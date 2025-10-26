from uagents import Agent, Context
from uagents.crypto import Identity
from uagents.network import add_testnet_funds
from protocols.risk_protocol import risk_protocol, RiskRequest, RiskResponse
from utils.risk_model import calculate_risk_score

agent = Agent(
    name="risk_score_agent",
    port=8001,
    seed="risk_agent_seed_phrase_123",
    endpoint=["http://localhost:8001/submit"]
)

@agent.on_rest_post("/risk-check", RiskRequest, RiskResponse)
async def handle_risk_post(ctx: Context, req: RiskRequest) -> RiskResponse:
    ctx.logger.info(f"Received risk check for: {req}")
    riskRes: RiskResponse = calculate_risk_score(req.wallet_address, req.country, float(req.amount), req.industry, int(req.days))
    print("res", riskRes)
    return RiskResponse(
        risk_score=riskRes["risk_score"],
        risk_level=riskRes["risk_level"],
        wallet_address=riskRes["wallet_address"],
        details=riskRes["details"]
    )


add_testnet_funds(agent.address)

if __name__ == "__main__":
    agent.run()
