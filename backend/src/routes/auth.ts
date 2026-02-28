import crypto from "crypto";
import { Router, Request, Response } from "express";
import { query } from "../db";
import { exchangeCodeForToken, fetchUserInfo, revokeToken } from "../services/blizzard";

const router = Router();

const BNET_AUTH_URL = "https://oauth.battle.net/authorize";

function getRedirectUri(req: Request): string {
  if (process.env.BNET_REDIRECT_URI) {
    return process.env.BNET_REDIRECT_URI;
  }
  return `${req.protocol}://${req.get("host")}/api/auth/callback`;
}

router.get("/login", (req: Request, res: Response) => {
  const clientId = process.env.BNET_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "BNET_CLIENT_ID not configured" });
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    scope: "openid wow.profile",
    state,
  });

  const url = `${BNET_AUTH_URL}?${params.toString()}`;
  req.session.save((err) => {
    if (err) {
      console.error("Session save error:", err);
      res.status(500).json({ error: "Failed to initialize login" });
      return;
    }
    res.redirect(url);
  });
});

router.get("/callback", async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  if (!state || state !== req.session.oauthState) {
    res.status(400).json({ error: "Invalid OAuth state" });
    return;
  }
  delete req.session.oauthState;

  const redirectUri = getRedirectUri(req);

  try {
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    const userInfo = await fetchUserInfo(tokenData.access_token);

    await query(
      `INSERT INTO users (battle_net_id, battletag)
       VALUES ($1, $2)
       ON CONFLICT (battle_net_id)
       DO UPDATE SET battletag = EXCLUDED.battletag, updated_at = NOW()`,
      [userInfo.sub, userInfo.battletag]
    );

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");
    res.redirect(`${frontendUrl}/#access_token=${tokenData.access_token}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("OAuth callback error:", err);
    res.status(500).json({
      error: "Authentication failed",
      ...(process.env.NODE_ENV !== "production" && { detail: message }),
    });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const userInfo = await fetchUserInfo(token);
    const result = await query<{ id: number; battletag: string }>(
      "SELECT id, battletag FROM users WHERE battle_net_id = $1",
      [userInfo.sub]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: result.rows[0].id, battleTag: result.rows[0].battletag });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (token) {
    try {
      await revokeToken(token);
    } catch (err) {
      console.error("Token revocation failed:", err);
    }
  }
  res.json({ success: true });
});

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export default router;
