import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import scanRoutes from "./routes/scanRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import {
  apiLimiter,
  authLimiter,
  aiLimiter,
  scanLimiter,
} from "./middleware/rateLimiters.js";

const app = express();


app.use(helmet());


app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);


app.use("/api", apiLimiter);


app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());


app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "SecureCode AI API is running.",
  });
});


app.use("/api/auth", authLimiter, authRoutes);


app.use("/api/scans", scanLimiter, scanRoutes);


app.use("/api/ai", aiLimiter, aiRoutes);


app.use("/api/dashboard", dashboardRoutes);

export default app;
