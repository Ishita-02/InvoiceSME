import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dotenv from "dotenv";
import Web3 from "web3";

dotenv.config();

const ASI_AGENT_URL = "http://localhost:8001";

function calculateDaysUntilDue(date) {
  try {
    const target = new Date(date);
    const today = new Date();
    console.log("target days today", target, today)
    
    // Reset time to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    // Calculate difference in milliseconds
    const diffTime = target.getTime() - today.getTime();
    
    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return at least 1 day if date is today or in the past
    return Math.max(1, diffDays);
  } catch (error) {
    console.error("Error calculating days:", error);
    // Default to 60 days if calculation fails
    return 60;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { wallet, country, amount, industry, date } = body;

    console.log("wallet", wallet);

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    let calculatedDays;
    
    if (date) {
      calculatedDays = calculateDaysUntilDue(date);
      console.log(`📅 Due date: ${date} → ${calculatedDays} days until due`);
    } else if (days) {
      calculatedDays = parseInt(days);
      console.log(`📊 Days provided directly: ${calculatedDays}`);
    } else {
      calculatedDays = 60;
      console.log("⚠️ No date or days provided, defaulting to 60 days");
    }


    const response = await axios.post(`${ASI_AGENT_URL}/risk/check`, {
      wallet_address: wallet,
      country: country,
      amount: amount,
      industry: industry,
      days: calculatedDays
    });

    const { risk_score, message } = response.data;

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
