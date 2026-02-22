import { Request, Response, NextFunction } from "express";

const mockQuery = jest.fn();
jest.mock("../db", () => ({ query: (...args: unknown[]) => mockQuery(...args) }));

const mockFetchUserInfo = jest.fn();
jest.mock("../services/blizzard", () => ({
  fetchUserInfo: (...args: unknown[]) => mockFetchUserInfo(...args),
}));

import { requireAuth, AuthenticatedRequest } from "./auth";

function buildReq(overrides: Record<string, unknown> = {}): Request {
  return { headers: {}, ...overrides } as unknown as Request;
}

function buildRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requireAuth", () => {
  it("calls next and attaches user when given a valid Bearer token", async () => {
    mockFetchUserInfo.mockResolvedValueOnce({ sub: "999", battletag: "Player#1234" });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42, battletag: "Player#1234" }] });

    const req = buildReq({
      headers: { authorization: "Bearer tok_valid" },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    const authed = req as AuthenticatedRequest;
    expect(authed.user).toEqual({ id: 42, battleTag: "Player#1234" });
    expect(authed.accessToken).toBe("tok_valid");
  });

  it("returns 401 when no Authorization header is present", async () => {
    const req = buildReq({ headers: {} });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const req = buildReq({
      headers: { authorization: "Basic abc123" },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when Battle.net rejects the token", async () => {
    mockFetchUserInfo.mockRejectedValueOnce(new Error("invalid"));

    const req = buildReq({
      headers: { authorization: "Bearer bad_token" },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  it("returns 401 when user is not found in database", async () => {
    mockFetchUserInfo.mockResolvedValueOnce({ sub: "unknown", battletag: "Ghost#0000" });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = buildReq({
      headers: { authorization: "Bearer tok_orphan" },
    });
    const res = buildRes();
    const next: NextFunction = jest.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });
});
