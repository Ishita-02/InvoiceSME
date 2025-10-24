import requests
import random
import os
from datetime import datetime
from web3 import Web3

SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/AqK-lMhLej1xV4uOTUDOKt724_JJsrwb"
w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))

# --- Constants ---
ETHERSCAN_API_KEY = "NZ5G99S66WE5UJB773744VH517GH2PCBIW"
EAS_SUBGRAPH_URL = "https://sepolia.easscan.org/graphql"

# Sepolia contract addresses for reputable DeFi protocols
DEFI_CONTRACTS = {
    "0x3bFA4769FB09eefC5aB096D41E9C430A807a78D4".lower(): "Uniswap V3 Router",
    "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951".lower(): "Aave V3 Pool",
}

# Country risk scores (lower = safer, based on business environment & payment culture)
COUNTRY_RISK = {
    "USA": 5, "UK": 8, "Germany": 7, "France": 10, "Canada": 6,
    "Australia": 7, "Singapore": 5, "Japan": 6, "South Korea": 8,
    "Netherlands": 6, "Switzerland": 4, "Sweden": 5, "Norway": 5,
    "India": 25, "China": 20, "Brazil": 30, "Mexico": 28,
    "Russia": 40, "Turkey": 35, "Argentina": 38, "Venezuela": 50,
    "Nigeria": 35, "Kenya": 30, "South Africa": 25,
    "DEFAULT": 35  # Unknown countries get higher risk
}

# Industry risk scores (based on payment reliability & volatility)
INDUSTRY_RISK = {
    "Technology": 10, "Healthcare": 8, "Finance": 7, "Insurance": 7,
    "Manufacturing": 12, "Retail": 15, "E-commerce": 13,
    "Government": 5, "Education": 8, "Telecommunications": 10,
    "Real Estate": 18, "Construction": 22, "Hospitality": 25,
    "Transportation": 15, "Energy": 12, "Agriculture": 20,
    "Entertainment": 28, "Fashion": 23, "Cryptocurrency": 35,
    "DEFAULT": 20  # Unknown industries get moderate risk
}

# --- Helper Functions for Data Fetching ---

def get_transaction_data(address: str):
    url = f"https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address={address}&sort=asc&apikey={ETHERSCAN_API_KEY}"
    res = requests.get(url)
    data = res.json().get("result", [])
    return data

def get_wallet_balance(address: str) -> float:
    url = f"https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=balance&address={address}&tag=latest&apikey={ETHERSCAN_API_KEY}"
    res = requests.get(url)
    balance = float(res.json().get("result", 0)) / 1e18
    return balance

def has_ens_name(address: str) -> bool:
    """Checks if the address has a primary ENS name set."""
    try:
        checksum_address = w3.to_checksum_address(address)
        name = w3.ens.name(checksum_address)
        return name is not None
    except Exception:
        return False

def has_defi_interactions(tx_data: list) -> bool:
    """Checks if the wallet has interacted with key DeFi protocols."""
    for tx in tx_data:
        if tx.get("to") and tx["to"].lower() in DEFI_CONTRACTS:
            return True
    return False

def get_eas_attestation_count(address: str) -> int:
    """Gets the number of attestations received by the address from EAS subgraph."""
    query = """
    query Attestations($recipient: String!) {
      attestations(where: {recipient: {equals: $recipient}}) {
        id
      }
    }
    """
    variables = {"recipient": address}
    try:
        res = requests.post(EAS_SUBGRAPH_URL, json={"query": query, "variables": variables})
        data = res.json()
        return len(data.get("data", {}).get("attestations", []))
    except Exception:
        return 0

# --- New Helper Functions for Invoice Parameters ---

def calculate_country_risk(country: str) -> float:
    """Returns normalized country risk (0 = safest, 1 = riskiest)"""
    risk = COUNTRY_RISK.get(country.upper(), COUNTRY_RISK["DEFAULT"])
    return min(1.0, risk / 50)  # Normalize to 0-1

def calculate_industry_risk(industry: str) -> float:
    """Returns normalized industry risk (0 = safest, 1 = riskiest)"""
    risk = INDUSTRY_RISK.get(industry.title(), INDUSTRY_RISK["DEFAULT"])
    return min(1.0, risk / 35)  # Normalize to 0-1

def calculate_payment_term_risk(days: int) -> float:
    """
    Returns risk based on payment terms.
    Shorter terms (30-60 days) = lower risk
    Longer terms (90+ days) = higher risk
    """
    if days <= 30:
        return 0.1
    elif days <= 60:
        return 0.2
    elif days <= 90:
        return 0.4
    elif days <= 120:
        return 0.6
    else:
        return 0.8

def calculate_amount_risk(amount: float, wallet_balance: float) -> float:
    """
    Returns risk based on invoice amount relative to wallet balance.
    Higher amounts with low collateral = higher risk
    """
    if wallet_balance == 0:
        return 0.9
    
    ratio = amount / (wallet_balance * 3000)  # Assuming ~$3000 per ETH
    
    if ratio <= 0.5:
        return 0.1  # Invoice is small relative to collateral
    elif ratio <= 1.0:
        return 0.3
    elif ratio <= 2.0:
        return 0.5
    elif ratio <= 5.0:
        return 0.7
    else:
        return 0.9  # Invoice is much larger than collateral

# --- Main Risk Score Calculation ---

def calculate_risk_score(
    wallet_address: str,
    country: str ,
    amount: float ,
    industry: str,
    days: int 
) -> dict:
    """
    Calculate comprehensive risk score for invoice financing.
    
    Parameters:
    - wallet_address: Ethereum address of the seller
    - country: Country where business operates
    - days: Payment term in days
    - industry: Business industry/sector
    - amount: Invoice amount in USD
    
    Returns:
    - Dictionary with risk score and detailed breakdown
    """
    try:
        amount = float(amount) if amount else 10000.0
        days = int(days) if days else 60
        country = str(country) if country else "DEFAULT"
        industry = str(industry) if industry else "DEFAULT"
        tx_data = get_transaction_data(wallet_address)
        tx_count = len(tx_data)
        balance = get_wallet_balance(wallet_address)

        if tx_count == 0:
            return {
                "risk_score": 90.0,
                "risk_level": "VERY HIGH",
                "reason": "No transaction history - new/inactive wallet",
                "details": {}
            }

        # === Blockchain-Based Parameters ===
        first_tx_time = int(tx_data[0].get("timeStamp", datetime.now().timestamp()))
        age_days = (datetime.now() - datetime.fromtimestamp(first_tx_time)).days or 1
        unique_addresses = len(set(tx["to"] for tx in tx_data if tx.get("to")))
        error_tx_count = sum(1 for tx in tx_data if tx.get("isError") == "1")

        has_ens = has_ens_name(wallet_address)
        has_defi = has_defi_interactions(tx_data)
        attestation_count = get_eas_attestation_count(wallet_address)

        # === Blockchain Factors (0 to 1, higher = safer) ===
        tx_factor = min(1, tx_count / 100)
        balance_factor = min(1, balance / 2)
        age_factor = min(1, age_days / 180)
        diversity_factor = min(1, unique_addresses / 25)
        error_factor = min(1, error_tx_count / tx_count if tx_count > 0 else 0)
        ens_factor = 1 if has_ens else 0
        defi_factor = 1 if has_defi else 0
        attestation_factor = min(1, attestation_count / 5)

        # === Invoice-Specific Risk Factors (0 to 1, higher = riskier) ===
        country_risk_factor = calculate_country_risk(country)
        industry_risk_factor = calculate_industry_risk(industry)
        payment_term_risk_factor = calculate_payment_term_risk(days)
        amount_risk_factor = calculate_amount_risk(amount, balance)

        # === Weighted Score Composition ===
        # On-chain reputation (40% weight)
        blockchain_safety_score = (
            (tx_factor * 0.08)
            + (balance_factor * 0.10)
            + (age_factor * 0.07)
            + (diversity_factor * 0.05)
            + (ens_factor * 0.10)
            + (defi_factor * 0.15)
            + (attestation_factor * 0.15)
            - (error_factor * 0.10)
        ) * 0.4

        # Invoice-specific risk (60% weight)
        risk_score = (
            (country_risk_factor * 0.25)
            + (industry_risk_factor * 0.15)
            + (payment_term_risk_factor * 0.10)
            + (amount_risk_factor * 0.10)
        ) * 0.6

        # Combine scores (blockchain safety reduces risk, invoice factors increase it)
        risk_score = max(0, min(100, (100 - blockchain_safety_score * 100) * 0.4 + risk_score * 100))

        # Determine risk level
        if risk_score < 20:
            risk_level = "VERY LOW"
        elif risk_score < 40:
            risk_level = "LOW"
        elif risk_score < 60:
            risk_level = "MEDIUM"
        elif risk_score < 80:
            risk_level = "HIGH"
        else:
            risk_level = "VERY HIGH"

        # Prepare detailed breakdown
        details = {
            "blockchain_metrics": {
                "transaction_count": tx_count,
                "wallet_balance_eth": round(balance, 4),
                "wallet_age_days": age_days,
                "unique_interactions": unique_addresses,
                "has_ens_name": has_ens,
                "defi_interactions": has_defi,
                "eas_attestations": attestation_count,
                "failed_transactions": error_tx_count
            },
            "metrics": {
                "country": country,
                "country_risk": round(country_risk_factor * 100, 1),
                "industry": industry,
                "industry_risk": round(industry_risk_factor * 100, 1),
                "payment_days": days,
                "payment_term_risk": round(payment_term_risk_factor * 100, 1),
                "amount_usd": amount,
                "amount_risk": round(amount_risk_factor * 100, 1)
            },
            "component_scores": {
                "blockchain_safety_contribution": round(blockchain_safety_score * 100, 2),
                "risk_contribution": round(risk_score * 100, 2)
            }
        }

        print(f"""
        ╔══════════════════════════════════════════════════════════════╗
        ║          INVOICE FINANCING RISK ASSESSMENT                   ║
        ╠══════════════════════════════════════════════════════════════╣
        ║ Wallet: {wallet_address}                  ║
        ║ Risk Score: {risk_score:.2f}/100 ({risk_level}){''.ljust(35-len(risk_level))}║
        ╠══════════════════════════════════════════════════════════════╣
        ║ BLOCKCHAIN REPUTATION (40% weight)                           ║
        ╠══════════════════════════════════════════════════════════════╣
        ║ ✓ Transactions: {str(tx_count).ljust(46)}║
        ║ ✓ Balance: {f'{balance:.4f} ETH'.ljust(50)}║
        ║ ✓ Account Age: {f'{age_days} days'.ljust(47)}║
        ║ ✓ ENS Name: {('Yes' if has_ens else 'No').ljust(50)}║
        ║ ✓ DeFi Activity: {('Yes' if has_defi else 'No').ljust(47)}║
        ║ ✓ Attestations: {str(attestation_count).ljust(47)}║
        ║ ⚠ Failed Txs: {str(error_tx_count).ljust(48)}║
        ╠══════════════════════════════════════════════════════════════╣
        ║ INVOICE DETAILS (60% weight)                                 ║
        ╠══════════════════════════════════════════════════════════════╣
        ║ 🌍 Country: {f'{country} (Risk: {country_risk_factor*100:.1f}%)'.ljust(49)}║
        ║ 🏢 Industry: {f'{industry} (Risk: {industry_risk_factor*100:.1f}%)'.ljust(48)}║
        ║ 📅 Payment Terms: {f'{days} days (Risk: {payment_term_risk_factor*100:.1f}%)'.ljust(42)}║
        ║ 💰 Amount: {f'${amount:,.2f} (Risk: {amount_risk_factor*100:.1f}%)'.ljust(46)}║
        ╚══════════════════════════════════════════════════════════════╝
        """)

        return {
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "wallet_address": wallet_address,
            "details": details
        }

    except Exception as e:
        print(f"Error calculating risk: {e}")
        return {
            "risk_score": random.uniform(40, 70),
            "risk_level": "MEDIUM",
            "reason": "Error in calculation - defaulting to medium risk",
            "error": str(e)
        }
