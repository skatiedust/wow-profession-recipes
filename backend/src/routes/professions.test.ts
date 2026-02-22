import { Request, Response } from "express";

const mockQuery = jest.fn();
jest.mock("../db", () => ({ query: (...args: unknown[]) => mockQuery(...args) }));

import professionRouter from "./professions";

type HandlerFn = (req: Request, res: Response) => void | Promise<void>;
interface Layer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: HandlerFn }>;
  };
}

function findHandler(method: string, path: string): HandlerFn {
  const layer = (professionRouter as unknown as { stack: Layer[] }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method]
  );
  if (!layer?.route) throw new Error(`No handler for ${method.toUpperCase()} ${path}`);
  return layer.route.stack[0].handle;
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

describe("GET /", () => {
  const handler = findHandler("get", "/");

  it("returns all professions ordered by name", async () => {
    const professions = [
      { id: 1, name: "Alchemy", icon_url: "..." },
      { id: 2, name: "Blacksmithing", icon_url: "..." },
      { id: 8, name: "Cooking", icon_url: "..." },
    ];
    mockQuery.mockResolvedValueOnce({ rows: professions });

    const req = {} as Request;
    const res = buildRes();

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id, name, icon_url FROM professions"),
    );
    expect(res.json).toHaveBeenCalledWith(professions);
  });
});
