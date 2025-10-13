import requests
import random
import os
from datetime import datetime
from web3 import Web3

# --- Action Required: Add your Sepolia RPC URL here ---
# You can get one for free from https://www.alchemy.com or https://www.infura.io
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

# --- Helper Functions for Data Fetching ---

def get_transaction_data(address: str):
    url = f"https://api-sepolia.etherscan.io/api?module=account&action=txlist&address={address}&sort=asc&apikey={ETHERSCAN_API_KEY}"
    res = requests.get(url)
    data = res.json().get("result", [])
    return data

def get_wallet_balance(address: str) -> float:
    url = f"https://api-sepolia.etherscan.io/api?module=account&action=balance&address={address}&tag=latest&apikey={ETHERSCAN_API_KEY}"
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

# --- Main Risk Score Calculation ---

def calculate_risk_score(wallet_address: str) -> float:
    try:
        tx_data = get_transaction_data(wallet_address)
        tx_count = len(tx_data)
        balance = get_wallet_balance(wallet_address)

        if tx_count == 0:
            return 90.0  # Brand new / inactive wallets are riskier

        # === Basic Parameters ===
        first_tx_time = int(tx_data[0].get("timeStamp", datetime.now().timestamp()))
        age_days = (datetime.now() - datetime.fromtimestamp(first_tx_time)).days or 1
        unique_addresses = len(set(tx["to"] for tx in tx_data if tx.get("to")))
        error_tx_count = sum(1 for tx in tx_data if tx.get("isError") == "1")

        # === New, Robust Parameters ===
        has_ens = has_ens_name(wallet_address)
        has_defi = has_defi_interactions(tx_data)
        attestation_count = get_eas_attestation_count(wallet_address)

        # === Compute Normalized Factors (0 to 1) ===
        tx_factor = min(1, tx_count / 100)
        balance_factor = min(1, balance / 2) # Capped at 2 test ETH
        age_factor = min(1, age_days / 180) # Capped at 6 months for testnet
        diversity_factor = min(1, unique_addresses / 25)
        error_factor = min(1, error_tx_count / tx_count if tx_count > 0 else 0)
        
        # New factors
        ens_factor = 1 if has_ens else 0
        defi_factor = 1 if has_defi else 0
        attestation_factor = min(1, attestation_count / 5) # Capped at 5 attestations

        # === Weighted Score Composition (higher = safer) ===
        # Weights are adjusted to include new, high-quality signals
        safety_score = (
            (tx_factor * 0.1)
            + (balance_factor * 0.15)
            + (age_factor * 0.1)
            + (diversity_factor * 0.1)
            + (ens_factor * 0.15)
            + (defi_factor * 0.2)
            + (attestation_factor * 0.2)
            - (error_factor * 0.15)
        )

        # Convert safety score (0 to 1) to a risk score (100 to 0)
        risk_score = max(0, min(100, 100 - (safety_score * 100)))

        print(f"""
        === Risk Analysis for {wallet_address} ===
        ✅ Tx count: {tx_count}
        ✅ Balance: {balance:.4f} ETH
        ✅ Age (days): {age_days}
        ✅ Unique addresses: {unique_addresses}
        ✅ ENS Name: {'Yes' if has_ens else 'No'}
        ✅ DeFi Interactions: {'Yes' if has_defi else 'No'}
        ✅ EAS Attestations: {attestation_count}
        ⚠️ Failed txs: {error_tx_count}
        📊 Risk Score: {risk_score:.2f}
        """)
        return round(risk_score, 2)

    except Exception as e:
        print("Error calculating risk:", e)
        return random.uniform(40, 70)