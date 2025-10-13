from uagents import Agent, Context
from uagents.crypto import Identity
from uagents.network import add_testnet_funds
from protocols.risk_protocol import risk_protocol, RiskRequest, RiskResponse
from utils.risk_model import calculate_risk_score

# identity = Identity.from_seed("risk_agent_seed_phrase_123", 1)

agent = Agent(
    name="risk_score_agent",
    port=8001,
    seed="risk_agent_seed_phrase_123",
    endpoint=["http://localhost:8001/submit"]
)

@agent.on_rest_post("/risk/check", RiskRequest, RiskResponse)
async def handle_risk_post(ctx: Context, req: RiskRequest) -> RiskResponse:
    ctx.logger.info(f"Received risk check for: {req.wallet_address}")
    risk = calculate_risk_score(req.wallet_address)
    return RiskResponse(
        risk_score=risk,
        message=f"Risk score for {req.wallet_address}: {risk:.2f}"
    )


add_testnet_funds(agent.address)

if __name__ == "__main__":
    agent.run()
