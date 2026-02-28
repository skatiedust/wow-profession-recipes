import { Request, Response } from "express";

const mockQuery = jest.fn();
jest.mock("../db", () => ({ query: (...args: unknown[]) => mockQuery(...args) }));

const mockExchangeCodeForToken = jest.fn();
const mockFetchUserInfo = jest.fn();
const mockRevokeToken = jest.fn();
jest.mock("../services/blizzard", () => ({
  exchangeCodeForToken: (...args: unknown[]) => mockExchangeCodeForToken(...args),
  fetchUserInfo: (...args: unknown[]) => mockFetchUserInfo(...args),
  revokeToken: (...args: unknown[]) => mockRevokeToken(...args),
}));

import authRouter from "./auth";

type HandlerFn = (req: Request, res: Response) => void | Promise<void>;
interface Layer {
  route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: HandlerFn }> };
}

function findHandler(method: string, path: string): HandlerFn {
  const layer = (authRouter as unknown as { stack: Layer[] }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method]
  );
  if (!layer?.route) throw new Error(`No handler for ${method.toUpperCase()} ${path}`);
  return layer.route.stack[0].handle;
}

function buildReq(overrides: Record<string, unknown> = {}): Request {
  const session: Record<string, unknown> = {
    save: jest.fn((cb: (err?: Error) => void) => cb()),
  };
  return {
    protocol: "https",
    get: jest.fn().mockReturnValue("example.com"),
    query: {},
    headers: {},
    session,
    ...overrides,
  } as unknown as Request;
}

function buildRes(): Response & { _redirectUrl?: string } {
  const res = {} as Response & { _redirectUrl?: string };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockImplementation((url: string) => {
    res._redirectUrl = url;
  });
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BNET_CLIENT_ID = "test-client-id";
  delete process.env.BNET_REDIRECT_URI;
  process.env.FRONTEND_URL = "https://frontend.example.com";
});

describe("GET /login", () => {
  const handler = findHandler("get", "/login");

  it("redirects to Battle.net with correct query parameters including state", () => {
    const session: Record<string, unknown> = {
      save: jest.fn((cb: (err?: Error) => void) => cb()),
    };
    const req = buildReq({ session });
    const res = buildRes();

    handler(req, res);

    expect(res.redirect).toHaveBeenCalled();
    const url = new URL(res._redirectUrl!);
    expect(url.origin + url.pathname).toBe("https://oauth.battle.net/authorize");
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid wow.profile");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://example.com/api/auth/callback"
    );
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(session.oauthState).toBe(url.searchParams.get("state"));
  });

  it("uses BNET_REDIRECT_URI env var when set", () => {
    process.env.BNET_REDIRECT_URI = "https://custom.example.com/cb";
    const session: Record<string, unknown> = {
      save: jest.fn((cb: (err?: Error) => void) => cb()),
    };
    const req = buildReq({ session });
    const res = buildRes();

    handler(req, res);

    const url = new URL(res._redirectUrl!);
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://custom.example.com/cb"
    );
  });

  it("returns 500 when BNET_CLIENT_ID is not configured", () => {
    delete process.env.BNET_CLIENT_ID;
    const req = buildReq();
    const res = buildRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "BNET_CLIENT_ID not configured",
    });
  });
});

describe("GET /callback", () => {
  const handler = findHandler("get", "/callback");

  it("exchanges code, upserts user, and redirects to frontend with access_token in hash", async () => {
    mockExchangeCodeForToken.mockResolvedValueOnce({
      access_token: "tok_abc",
      token_type: "bearer",
      expires_in: 86400,
    });
    mockFetchUserInfo.mockResolvedValueOnce({
      sub: "999",
      battletag: "Hero#1111",
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 7 }] });

    const session: Record<string, unknown> = { oauthState: "abc123" };
    const req = buildReq({
      query: { code: "auth-code-123", state: "abc123" },
      session,
    });
    const res = buildRes();

    await handler(req, res);

    expect(mockExchangeCodeForToken).toHaveBeenCalledWith(
      "auth-code-123",
      "https://example.com/api/auth/callback"
    );
    expect(mockFetchUserInfo).toHaveBeenCalledWith("tok_abc");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["999", "Hero#1111"]
    );
    expect(session.oauthState).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith(
      "https://frontend.example.com/#access_token=tok_abc"
    );
  });

  it("returns 400 when code is missing", async () => {
    const req = buildReq({ query: {} });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing authorization code",
    });
  });

  it("returns 400 when state is missing or mismatched", async () => {
    const req = buildReq({
      query: { code: "auth-code-123", state: "wrong" },
      session: { oauthState: "correct" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid OAuth state" });
  });

  it("returns 500 when token exchange fails", async () => {
    mockExchangeCodeForToken.mockRejectedValueOnce(new Error("token error"));
    const req = buildReq({
      query: { code: "bad", state: "s1" },
      session: { oauthState: "s1" },
    });
    const res = buildRes();

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    await handler(req, res);
    consoleSpy.mockRestore();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Authentication failed" })
    );
  });
});

describe("GET /me", () => {
  const handler = findHandler("get", "/me");

  it("returns user info when given a valid Bearer token", async () => {
    mockFetchUserInfo.mockResolvedValueOnce({ sub: "999", battletag: "Hero#1111" });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 7, battletag: "Hero#1111" }] });

    const req = buildReq({
      headers: { authorization: "Bearer tok_valid" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(mockFetchUserInfo).toHaveBeenCalledWith("tok_valid");
    expect(res.json).toHaveBeenCalledWith({ id: 7, battleTag: "Hero#1111" });
  });

  it("returns 401 when no Authorization header is present", async () => {
    const req = buildReq({ headers: {} });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
  });

  it("returns 401 when token is invalid", async () => {
    mockFetchUserInfo.mockRejectedValueOnce(new Error("invalid token"));

    const req = buildReq({
      headers: { authorization: "Bearer bad_token" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  it("returns 401 when user not found in database", async () => {
    mockFetchUserInfo.mockResolvedValueOnce({ sub: "unknown", battletag: "Ghost#0000" });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = buildReq({
      headers: { authorization: "Bearer tok_orphan" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });
});

describe("POST /logout", () => {
  const handler = findHandler("post", "/logout");

  it("revokes the token and returns success when Bearer token is provided", async () => {
    mockRevokeToken.mockResolvedValueOnce(undefined);
    const req = buildReq({
      headers: { authorization: "Bearer tok_to_revoke" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(mockRevokeToken).toHaveBeenCalledWith("tok_to_revoke");
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("returns success even when no token is provided", async () => {
    const req = buildReq({ headers: {} });
    const res = buildRes();

    await handler(req, res);

    expect(mockRevokeToken).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("returns success even when revocation fails", async () => {
    mockRevokeToken.mockRejectedValueOnce(new Error("revoke failed"));
    const req = buildReq({
      headers: { authorization: "Bearer tok_bad" },
    });
    const res = buildRes();

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    await handler(req, res);
    consoleSpy.mockRestore();

    expect(mockRevokeToken).toHaveBeenCalledWith("tok_bad");
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
