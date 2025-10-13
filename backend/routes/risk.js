import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// --- Environment Variables ---
const ASI_AGENT_URL = "http://localhost:8001";


router.post("/risk/check", async (req, res) => {
  const { wallet } = req.body;
  console.log("wallet", req.body)

  if (!wallet) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    // --- Send to ASI Agent ---
    const response = await axios.post(
      `${ASI_AGENT_URL}/risk/check`,
      { wallet_address: wallet }
    );

    // --- Extract Agent Response ---
    const { risk_score, message } = response.data;

    return res.json({
      wallet,
      risk_score,
      message,
      source: "ASI Agent",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Error in risk-score route:", error.message);

    return res.status(500).json({
      error: "Failed to fetch risk score from ASI agent",
      details: error.message
    });
  }
});

export default router;
