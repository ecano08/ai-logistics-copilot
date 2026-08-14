import express from "express";
import { db } from "./db";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
const port = 3000;

app.get("/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "ok",
      service: "api",
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      service: "api",
      database: "disconnected",
    });
  }
});

app.get("/health/ai", async (_req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/health");
    const data = await response.json();

    res.json({
      status: "ok",
      ai_service: "connected",
      details: data,
    });
  } catch {
    res.status(503).json({
      status: "error",
      ai_service: "disconnected",
    });
  }
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
