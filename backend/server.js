import express from "express";
import cors from "cors";
import riskRouter from "./routes/risk.js";

const app = express();
app.use(express.json());
app.use(cors());

// Mount the risk route
app.use("/api", riskRouter);

app.listen(5001, () => {
  console.log("✅ Backend running on http://localhost:5001");
});
