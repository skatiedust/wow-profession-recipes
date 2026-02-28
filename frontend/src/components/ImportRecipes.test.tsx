import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ImportRecipes from "./ImportRecipes";

const mockFetch = vi.fn();
const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

describe("ImportRecipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it("renders nothing when closed", () => {
    render(
      <ImportRecipes
        isOpen={false}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.queryByText("Import from Addon")).not.toBeInTheDocument();
  });

  it("renders modal when open", () => {
    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    expect(screen.getByText("Import from Addon")).toBeInTheDocument();
    expect(screen.getByText(/ProfessionExporter addon/)).toBeInTheDocument();
    expect(screen.getByText("/exportrecipes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/ })).toBeInTheDocument();
  });

  it("shows error for invalid JSON", async () => {
    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    const textarea = screen.getByPlaceholderText(
      /"character":"Name","realm":"Realm"/
    );
    fireEvent.change(textarea, { target: { value: "not valid json" } });
    fireEvent.click(screen.getByRole("button", { name: /Import/ }));

    expect(await screen.findByText(/Invalid JSON/)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows error for missing required fields", async () => {
    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    const textarea = screen.getByPlaceholderText(
      /"character":"Name","realm":"Realm"/
    );
    fireEvent.change(textarea, {
      target: { value: '{"character":"X","realm":"Y"}' },
    });
    fireEvent.click(screen.getByRole("button", { name: /Import/ }));

    expect(await screen.findByText(/Invalid JSON/)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls API and shows result on successful import", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        character_id: 1,
        matched: 2,
        matched_recipes: ["Haste Potion", "Destruction Potion"],
        skipped: 0,
        unmatched: ["Unknown Recipe"],
      }),
    });

    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({ Authorization: "Bearer test-token" })}
        onSuccess={mockOnSuccess}
      />
    );
    const textarea = screen.getByPlaceholderText(
      /"character":"Name","realm":"Realm"/
    );
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          character: "TestChar",
          realm: "Whitemane",
          profession: "Alchemy",
          recipes: ["Haste Potion", "Destruction Potion", "Unknown Recipe"],
        }),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Import/ }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/recipes/import",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        credentials: "include",
        body: JSON.stringify({
          character: "TestChar",
          realm: "Whitemane",
          profession: "Alchemy",
          recipes: ["Haste Potion", "Destruction Potion", "Unknown Recipe"],
        }),
      })
    );

    expect(await screen.findByText(/Matched: 2/)).toBeInTheDocument();
    expect(screen.getByText("Haste Potion")).toBeInTheDocument();
    expect(screen.getByText("Destruction Potion")).toBeInTheDocument();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("accepts addon payload aliases and recipe objects", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        character_id: 1,
        matched: 2,
        matched_recipes: ["Runed Adamantite Rod", "Void Sphere"],
        skipped: 0,
        unmatched: [],
      }),
    });

    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    const textarea = screen.getByPlaceholderText(
      /"character":"Name","realm":"Realm"/
    );
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          data: {
            character_name: "Avarrai",
            realm_name: "Dreamscythe",
            profession_name: "Enchanting",
            recipe_names: [{ name: "Runed Adamantite Rod" }, { name: "Void Sphere" }],
          },
        }),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Import/ }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/recipes/import",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          character: "Avarrai",
          realm: "Dreamscythe",
          profession: "Enchanting",
          recipes: ["Runed Adamantite Rod", "Void Sphere"],
        }),
      })
    );
    expect(await screen.findByText(/Matched: 2/)).toBeInTheDocument();
  });

  it("shows error when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unknown profession: Foo" }),
    });

    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    const textarea = screen.getByPlaceholderText(
      /"character":"Name","realm":"Realm"/
    );
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          character: "X",
          realm: "Y",
          profession: "Foo",
          recipes: [],
        }),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Import/ }));

    expect(await screen.findByText(/Unknown profession: Foo/)).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay is clicked", () => {
    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    const overlay = screen.getByText("Import from Addon").closest(".import-recipes-overlay");
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it("Import button is disabled when textarea is empty", () => {
    render(
      <ImportRecipes
        isOpen={true}
        onClose={mockOnClose}
        authHeaders={() => ({})}
        onSuccess={mockOnSuccess}
      />
    );
    const importBtn = screen.getByRole("button", { name: /Import/ });
    expect(importBtn).toBeDisabled();
  });
});
