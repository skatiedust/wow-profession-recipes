import crypto from "crypto";
import { Router, Request, Response } from "express";
import { query } from "../db";
import { exchangeCodeForToken, fetchUserInfo } from "../services/blizzard";

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

    const result = await query<{ id: number }>(
      `INSERT INTO users (battle_net_id, battletag)
       VALUES ($1, $2)
       ON CONFLICT (battle_net_id)
       DO UPDATE SET battletag = EXCLUDED.battletag, updated_at = NOW()
       RETURNING id`,
      [userInfo.sub, userInfo.battletag]
    );

    const userId = result.rows[0].id;

    req.session.userId = userId;
    req.session.battleTag = userInfo.battletag;
    req.session.accessToken = tokenData.access_token;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(frontendUrl);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

router.get("/me", (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    id: req.session.userId,
    battleTag: req.session.battleTag,
  });
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
