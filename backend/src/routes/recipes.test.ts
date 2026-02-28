import { Request, Response } from "express";

const mockQuery = jest.fn();
jest.mock("../db", () => ({ query: (...args: unknown[]) => mockQuery(...args) }));

jest.mock("../middleware/auth", () => ({
  requireAuth: jest.fn((_req: unknown, _res: unknown, next: () => void) => next()),
  AuthenticatedRequest: {},
}));

import recipeRouter from "./recipes";

type HandlerFn = (req: Request, res: Response) => void | Promise<void>;
interface Layer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: HandlerFn }>;
  };
}

function findHandler(method: string, path: string): HandlerFn {
  const layer = (recipeRouter as unknown as { stack: Layer[] }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method]
  );
  if (!layer?.route) throw new Error(`No handler for ${method.toUpperCase()} ${path}`);
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

function buildReq(overrides: Record<string, unknown> = {}): Request {
  return {
    query: {},
    headers: {},
    body: {},
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
});

describe("GET /", () => {
  const handler = findHandler("get", "/");

  it("returns recipes with crafter info for a valid profession_id", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: "Flask of the Titans",
          source: "drop",
          zone: "Molten Core",
          reputation_requirement: null,
          dropped_by: ["Golemagg"],
          url: null,
          rarity: "rare",
          crafters: [{ name: "Arthas", realm: "Whitemane" }],
        },
        {
          id: 2,
          name: "Elixir of the Mongoose",
          source: "drop",
          zone: "Winterspring",
          reputation_requirement: null,
          dropped_by: null,
          url: null,
          rarity: "rare",
          crafters: [],
        },
      ],
    });

    const req = buildReq({ query: { profession_id: "1" } });
    const res = buildRes();

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM recipes r"),
      [1]
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "Flask of the Titans" }),
        expect.objectContaining({ id: 2, crafters: [] }),
      ])
    );
  });

  it("returns 400 when profession_id is missing", async () => {
    const req = buildReq({ query: {} });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "profession_id query parameter is required",
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 400 when profession_id is not a number", async () => {
    const req = buildReq({ query: { profession_id: "abc" } });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("GET /checklist", () => {
  const handler = findHandler("get", "/checklist");

  it("returns recipes with known flag for a valid character", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 10, profession_id: 3 }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, name: "Enchant Weapon - Mongoose", known: true },
          { id: 2, name: "Enchant Boots - Cat's Swiftness", known: false },
        ],
      });

    const req = buildReq({
      query: { character_id: "10" },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM characters"),
      [10, 42]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("FROM recipes r"),
      [10, 3]
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "Enchant Weapon - Mongoose", known: true }),
        expect.objectContaining({ known: false }),
      ])
    );
  });

  it("returns 400 when character_id is missing", async () => {
    const req = buildReq({
      query: {},
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "character_id query parameter is required",
    });
  });

  it("returns 404 when character does not belong to user", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = buildReq({
      query: { character_id: "99" },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Character not found" });
  });

  it("returns 400 when character has no profession assigned", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, profession_id: null }],
    });

    const req = buildReq({
      query: { character_id: "10" },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Character has no profession assigned",
    });
  });
});

describe("POST /checklist", () => {
  const handler = findHandler("post", "/checklist");

  it("inserts a character_recipes row when known is true", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const req = buildReq({
      body: { character_id: 10, recipe_id: 5, known: true },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id FROM characters"),
      [10, 42]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO character_recipes"),
      [10, 5]
    );
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("deletes a character_recipes row when known is false", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const req = buildReq({
      body: { character_id: 10, recipe_id: 5, known: false },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM character_recipes"),
      [10, 5]
    );
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("returns 400 when required fields are missing", async () => {
    const req = buildReq({
      body: { character_id: 10 },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "character_id, recipe_id, and known (boolean) are required",
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 400 when known is not a boolean", async () => {
    const req = buildReq({
      body: { character_id: 10, recipe_id: 5, known: "yes" },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 404 when character does not belong to user", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = buildReq({
      body: { character_id: 99, recipe_id: 5, known: true },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Character not found" });
  });
});

describe("POST /import", () => {
  const handler = findHandler("post", "/import");

  it("imports recipes successfully and returns matched/skipped/unmatched", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 10, name: "Haste Potion" },
          { id: 11, name: "Destruction Potion" },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const req = buildReq({
      body: {
        character: "MyChar",
        realm: "Whitemane",
        profession: "Alchemy",
        recipes: ["Haste Potion", "Destruction Potion", "Unknown Recipe"],
      },
      user: { id: 42, battleTag: "Player#1234" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT id FROM professions"),
      ["Alchemy"]
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO characters"),
      expect.arrayContaining([42, "MyChar", "Whitemane", 2])
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM character_recipes cr"),
      [99, 2, [10, 11]]
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        character_id: expect.any(Number),
        matched: 2,
        matched_recipes: ["Haste Potion", "Destruction Potion"],
        skipped: 0,
        unmatched: ["Unknown Recipe"],
      })
    );
  });

  it("strips Recipe: prefix when matching", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 5, name: "Haste Potion" }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const req = buildReq({
      body: {
        character: "X",
        realm: "Y",
        profession: "Alchemy",
        recipes: ["Recipe: Haste Potion"],
      },
      user: { id: 1, battleTag: "Test#1" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        matched: 1,
        matched_recipes: ["Haste Potion"],
        unmatched: [],
      })
    );
  });

  it("returns 400 for invalid JSON structure", async () => {
    const req = buildReq({
      body: { character: "X", realm: "Y" },
      user: { id: 1, battleTag: "Test#1" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("Invalid body"),
      })
    );
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 400 for unknown profession", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = buildReq({
      body: {
        character: "X",
        realm: "Y",
        profession: "UnknownProf",
        recipes: [],
      },
      user: { id: 1, battleTag: "Test#1" },
    });
    const res = buildRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unknown profession: UnknownProf",
    });
  });
});
