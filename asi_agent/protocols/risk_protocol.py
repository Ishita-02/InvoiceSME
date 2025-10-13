from uagents import Protocol
from uagents import Model

class RiskRequest(Model):
    wallet_address: str

class RiskResponse(Model):
    risk_score: float
    message: str

risk_protocol = Protocol(name="risk_protocol", version="1.0.0")
