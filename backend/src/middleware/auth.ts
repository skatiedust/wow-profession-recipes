import { Request, Response, NextFunction } from "express";
import { query } from "../db";
import { fetchUserInfo } from "../services/blizzard";

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    battleTag: string;
  };
  accessToken: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice(7);

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

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: result.rows[0].id,
      battleTag: result.rows[0].battletag,
    };
    authReq.accessToken = token;

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
