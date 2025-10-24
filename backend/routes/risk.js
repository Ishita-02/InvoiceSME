import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// --- Environment Variables ---
const ASI_AGENT_URL = "http://localhost:8001";

function parseDate(dateString) {
  // Handle DD/MM/YYYY format (common in India and Europe)
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  
  // Handle DD-MM-YYYY format
  if (dateString.includes('-') && dateString.split('-')[0].length <= 2) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  
  // Default: try standard Date parsing (works for ISO format YYYY-MM-DD)
  return new Date(dateString);
}


function calculateDaysUntilDue(date) {
  try {
    const target = parseDate(date);
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

router.post("/risk/check", async (req, res) => {
  const { wallet, country, amount, industry, date } = req.body;
  console.log("wallet", req.body)

  if (!wallet) {
    return res.status(400).json({ error: "Wallet address is required" });
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

  try {
    // --- Send to ASI Agent ---
    const response = await axios.post(
      `${ASI_AGENT_URL}/risk/check`,
      { wallet_address: wallet, country: country,
      amount: amount,
      industry: industry,
      days: calculatedDays }
    );

    // --- Extract Agent Response ---
    const { risk_score, risk_level, details } = response.data;

    return res.json({
      wallet,
      risk_score,
      risk_level,
      details,
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
