import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import { randomUUID } from "node:crypto";
import authRouter from "./routes/auth";
import characterRouter from "./routes/characters";
import recipeRouter from "./routes/recipes";
import professionRouter from "./routes/professions";
import { logError, logInfo } from "./logger";

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", true);
}

app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, ""),
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  logInfo("http.request.start", {
    request_id: requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    user_agent: req.get("user-agent") || "",
  });

  res.on("finish", () => {
    logInfo("http.request.finish", {
      request_id: requestId,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: Date.now() - startedAt,
    });
  });

  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/characters", characterRouter);
app.use("/api/recipes", recipeRouter);
app.use("/api/professions", professionRouter);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logError("http.request.error", err, {
    request_id: res.locals.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  logInfo("server.start", { port, is_production: isProduction });
});

export default app;
