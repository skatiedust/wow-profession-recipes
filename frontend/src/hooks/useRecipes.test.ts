import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRecipes } from "./useRecipes";

const mockRecipes = [
  {
    id: 1,
    name: "Flask of Supreme Power",
    source: "Drop",
    zone: "Scholomance",
    reputation_requirement: null,
    dropped_by: null,
    url: null,
    rarity: "epic",
    crafters: [],
  },
  {
    id: 2,
    name: "Elixir of Mongoose",
    source: "Drop",
    zone: null,
    reputation_requirement: null,
    dropped_by: null,
    url: null,
    rarity: "rare",
    crafters: [],
  },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRecipes", () => {
  it("returns empty recipes when professionId is null", () => {
    const { result } = renderHook(() => useRecipes(null, ""));
    expect(result.current.recipes).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("fetches recipes when professionId is provided", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockRecipes,
    });

    const { result } = renderHook(() => useRecipes(1, ""));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recipes).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/recipes?profession_id=1")
    );
  });

  it("filters recipes by search query", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockRecipes,
    });

    const { result } = renderHook(() => useRecipes(1, "flask"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.recipes[0].name).toBe("Flask of Supreme Power");
  });

  it("returns empty on fetch error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRecipes(1, ""));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recipes).toEqual([]);
  });
});
