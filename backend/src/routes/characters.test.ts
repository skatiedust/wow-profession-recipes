import { Request, Response } from "express";

const mockQuery = jest.fn();
jest.mock("../db", () => ({ query: (...args: unknown[]) => mockQuery(...args) }));

const mockFetchGuildCharacters = jest.fn();
jest.mock("../services/blizzard", () => ({
  fetchGuildCharacters: (...args: unknown[]) => mockFetchGuildCharacters(...args),
}));

jest.mock("../middleware/auth", () => ({
  requireAuth: jest.fn((_req: unknown, _res: unknown, next: () => void) => next()),
  AuthenticatedRequest: {},
}));

import charactersRouter from "./characters";

type HandlerFn = (req: Request, res: Response) => void | Promise<void>;
interface Layer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: HandlerFn }>;
  };
}

function findHandler(method: string, path: string): HandlerFn {
  const layer = (charactersRouter as unknown as { stack: Layer[] }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method]
  );
  if (!layer?.route) throw new Error(`No handler for ${method.toUpperCase()} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function buildReq(overrides: Record<string, unknown> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function buildRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GUILD = "Red Sun";
});

describe("GET /import", () => {
  const handler = findHandler("get", "/import");

  it("returns only characters from configured guild", async () => {
    mockFetchGuildCharacters.mockResolvedValueOnce([
      { name: "Avarrai", realm: "Dreamscythe" },
    ]);

    const req = buildReq({ accessToken: "token" });
    const res = buildRes();

    await handler(req, res);

    expect(mockFetchGuildCharacters).toHaveBeenCalledWith("token", "red sun");
    expect(res.json).toHaveBeenCalledWith([
      { name: "Avarrai", realm: "Dreamscythe" },
    ]);
  });

  it("returns empty array when guild service returns none", async () => {
    mockFetchGuildCharacters.mockResolvedValueOnce([]);

    const req = buildReq({ accessToken: "token" });
    const res = buildRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });
});
