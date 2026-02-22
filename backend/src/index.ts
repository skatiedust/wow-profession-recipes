import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import authRouter from "./routes/auth";
import characterRouter from "./routes/characters";
import recipeRouter from "./routes/recipes";
import professionRouter from "./routes/professions";

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

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

export default app;
