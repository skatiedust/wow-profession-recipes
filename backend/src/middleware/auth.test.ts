import { Request, Response, NextFunction } from "express";
import { requireAuth, AuthenticatedRequest } from "./auth";

function buildReq(sessionData: Record<string, unknown> = {}): Request {
  return { session: sessionData } as unknown as Request;
}

function buildRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("requireAuth", () => {
  it("calls next and attaches user when session has userId", () => {
    const req = buildReq({ userId: 42, battleTag: "Player#1234" });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    const authed = req as AuthenticatedRequest;
    expect(authed.user).toEqual({ id: 42, battleTag: "Player#1234" });
  });

  it("returns 401 when session has no userId", () => {
    const req = buildReq({});
    const res = buildRes();
    const next: NextFunction = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
  });
});
