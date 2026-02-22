import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecipeTable from "./RecipeTable";
import type { Recipe } from "../hooks/useRecipes";

const mockIsLoggedIn = { value: false };
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    isLoggedIn: mockIsLoggedIn.value,
    user: mockIsLoggedIn.value ? { id: 1, battleTag: "Test#1234" } : null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    authHeaders: () => ({}),
  }),
}));

const recipes: Recipe[] = [
  {
    id: 1,
    name: "Flask of Supreme Power",
    source: "Drop",
    zone: "Scholomance",
    reputation_requirement: null,
    dropped_by: ["Ras Frostwhisper"],
    url: "https://wowhead.com/item=1",
    rarity: "epic",
    crafters: [{ name: "Gondor", realm: "Whitemane" }],
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

describe("RecipeTable", () => {
  beforeEach(() => {
    mockIsLoggedIn.value = false;
  });

  it("renders recipe names", () => {
    render(<RecipeTable recipes={recipes} />);
    expect(screen.getByText("Flask of Supreme Power")).toBeInTheDocument();
    expect(screen.getByText("Elixir of Mongoose")).toBeInTheDocument();
  });

  it("applies rarity CSS classes", () => {
    render(<RecipeTable recipes={recipes} />);
    const flask = screen.getByText("Flask of Supreme Power");
    expect(flask.closest("span")).toHaveClass("rarity-epic");
  });

  it("renders recipe URLs as links", () => {
    render(<RecipeTable recipes={recipes} />);
    const link = screen.getByText("Flask of Supreme Power");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://wowhead.com/item=1");
  });

  it("does not show You column when logged out", () => {
    render(<RecipeTable recipes={recipes} />);
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("shows You column when logged in", () => {
    mockIsLoggedIn.value = true;
    render(<RecipeTable recipes={recipes} />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("checkboxes are disabled when no onToggle provided", () => {
    mockIsLoggedIn.value = true;
    render(<RecipeTable recipes={recipes} />);
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => expect(cb).toBeDisabled());
  });

  it("checkboxes reflect knownMap and call onToggle", () => {
    mockIsLoggedIn.value = true;
    const knownMap = new Map([[1, true], [2, false]]);
    const onToggle = vi.fn();

    render(
      <RecipeTable recipes={recipes} knownMap={knownMap} onToggle={onToggle} />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    fireEvent.click(checkboxes[1]);
    expect(onToggle).toHaveBeenCalledWith(2, true);
  });
});
