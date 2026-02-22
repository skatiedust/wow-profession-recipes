import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useProfessions } from "./useProfessions";

const mockProfessions = [
  { id: 1, name: "Alchemy", icon_url: null },
  { id: 2, name: "Blacksmithing", icon_url: "https://icons.example.com/bs.png" },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useProfessions", () => {
  it("fetches professions on mount", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockProfessions,
    });

    const { result } = renderHook(() => useProfessions());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.professions).toEqual(mockProfessions);
  });

  it("returns empty on error", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useProfessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.professions).toEqual([]);
  });
});
