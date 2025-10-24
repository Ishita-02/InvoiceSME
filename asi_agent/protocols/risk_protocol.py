from uagents import Protocol
from uagents import Model

class RiskRequest(Model):
    wallet_address: str
    country: str
    amount: str
    industry: str
    days: str

class RiskResponse(Model):
    risk_score: float
    risk_level: str
    wallet_address: str
    details: object


risk_protocol = Protocol(name="risk_protocol", version="1.0.0")
