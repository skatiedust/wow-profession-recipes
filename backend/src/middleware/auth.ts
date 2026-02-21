import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    battleTag: string;
  };
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  (req as AuthenticatedRequest).user = {
    id: req.session.userId,
    battleTag: req.session.battleTag!,
  };

  next();
}
