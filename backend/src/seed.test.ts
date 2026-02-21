const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();
const mockEnd = jest.fn();

jest.mock("./db", () => ({
  __esModule: true,
  default: {
    connect: (...args: unknown[]) => mockConnect(...args),
    end: (...args: unknown[]) => mockEnd(...args),
  },
}));

jest.mock("fs", () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock("path", () => ({
  ...jest.requireActual("path"),
  resolve: jest.fn().mockReturnValue("/fake/recipes"),
  join: (...args: string[]) => args.join("/"),
  basename: jest.requireActual("path").basename,
}));

import * as fs from "fs";
import { seed } from "./seed";

const ALCHEMY_RECIPES = [
  {
    name: "Flask of Pure Death",
    source: "drop",
    zone: "Serpentshrine Cavern",
    reputation_requirement: null,
    dropped_by: ["Hydross the Unstable"],
    url: null,
    rarity: null,
  },
  {
    name: "Flask of Blinding Light",
    source: "drop",
    zone: "Tempest Keep: The Eye",
    reputation_requirement: null,
    dropped_by: ["Al'ar"],
    url: null,
    rarity: null,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockConnect.mockResolvedValue({
    query: mockQuery,
    release: mockRelease,
  });
});

describe("seed", () => {
  it("parses JSON files and upserts recipes", async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(["alchemy.json"]);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify(ALCHEMY_RECIPES)
    );

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT profession
      .mockResolvedValueOnce({ rowCount: 0 }) // UPDATE recipe 1 (not found)
      .mockResolvedValueOnce(undefined) // INSERT recipe 1
      .mockResolvedValueOnce({ rowCount: 0 }) // UPDATE recipe 2 (not found)
      .mockResolvedValueOnce(undefined) // INSERT recipe 2
      .mockResolvedValueOnce({ rowCount: 0 }) // soft-delete
      .mockResolvedValueOnce(undefined); // COMMIT

    await seed();

    expect(mockQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockQuery).toHaveBeenCalledWith("COMMIT");

    const insertCalls = mockQuery.mock.calls.filter(
      ([sql]: [string]) =>
        typeof sql === "string" && sql.includes("INSERT INTO recipes")
    );
    expect(insertCalls).toHaveLength(2);
    expect(insertCalls[0][1]).toContain("Flask of Pure Death");
    expect(insertCalls[1][1]).toContain("Flask of Blinding Light");
  });

  it("updates existing recipes instead of inserting", async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(["alchemy.json"]);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify([ALCHEMY_RECIPES[0]])
    );

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT profession
      .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE recipe 1 (found)
      .mockResolvedValueOnce({ rowCount: 0 }) // soft-delete
      .mockResolvedValueOnce(undefined); // COMMIT

    await seed();

    const insertCalls = mockQuery.mock.calls.filter(
      ([sql]: [string]) =>
        typeof sql === "string" && sql.includes("INSERT INTO recipes")
    );
    expect(insertCalls).toHaveLength(0);
  });

  it("soft-deletes recipes no longer in JSON", async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(["alchemy.json"]);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify([ALCHEMY_RECIPES[0]])
    );

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT profession
      .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE recipe 1
      .mockResolvedValueOnce({ rowCount: 2 }) // soft-delete (2 removed)
      .mockResolvedValueOnce(undefined); // COMMIT

    await seed();

    const softDeleteCall = mockQuery.mock.calls.find(
      ([sql]: [string]) =>
        typeof sql === "string" &&
        sql.includes("deleted_at") &&
        sql.includes("name != ALL")
    );
    expect(softDeleteCall).toBeDefined();
    expect(softDeleteCall![1][0]).toBe(1);
    expect(softDeleteCall![1][1]).toEqual(["Flask of Pure Death"]);
  });

  it("restores soft-deleted recipes when they reappear in JSON", async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(["alchemy.json"]);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify([ALCHEMY_RECIPES[0]])
    );

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT profession
      .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE sets deleted_at = NULL
      .mockResolvedValueOnce({ rowCount: 0 }) // soft-delete
      .mockResolvedValueOnce(undefined); // COMMIT

    await seed();

    const updateCall = mockQuery.mock.calls.find(
      ([sql]: [string]) =>
        typeof sql === "string" &&
        sql.includes("UPDATE recipes") &&
        sql.includes("deleted_at = NULL")
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1]).toContain("Flask of Pure Death");
  });

  it("skips unknown professions", async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(["inscription.json"]);
    (fs.readFileSync as jest.Mock).mockReturnValue("[]");

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT profession (not found)
      .mockResolvedValueOnce(undefined); // COMMIT

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    await seed();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Inscription")
    );
    consoleSpy.mockRestore();
  });

  it("rolls back on error", async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(["alchemy.json"]);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify(ALCHEMY_RECIPES)
    );

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT profession
      .mockRejectedValueOnce(new Error("DB error")) // UPDATE fails
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await expect(seed()).rejects.toThrow("DB error");
    expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
  });

  it("handles no JSON files gracefully", async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    await seed();

    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockEnd).toHaveBeenCalled();
  });
});
