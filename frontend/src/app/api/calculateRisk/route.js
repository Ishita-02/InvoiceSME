import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dotenv from "dotenv";
import Web3 from "web3";

dotenv.config();

const ASI_AGENT_URL = "http://localhost:8001";

export async function POST(req) {
  try {
    const body = await req.json();
    const { wallet } = body;

    console.log("wallet", wallet);

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // // --- Initialize Web3 Provider ---
    // const rpc_url = process.env.RPC_URL;
    // if (!rpc_url) {
    //   throw new Error("Missing RPC_URL in environment variables");
    // }

    // --- Send to ASI Agent ---
    const response = await axios.post(`${ASI_AGENT_URL}/risk/check`, {
      wallet_address: wallet,
    });

    const { risk_score, message } = response.data;

    // --- Return JSON Response ---
    return NextResponse.json(
      {
        wallet,
        risk_score,
        message,
        source: "ASI Agent",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in /api/risk/check:", error.message);

    return NextResponse.json(
      {
        error: "Failed to fetch risk score from ASI agent",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
