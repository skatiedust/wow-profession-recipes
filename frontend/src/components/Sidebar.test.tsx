import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Sidebar from "./Sidebar";

vi.mock("../hooks/useProfessions", () => ({
  useProfessions: () => ({
    professions: [
      { id: 1, name: "Alchemy", icon_url: null },
      { id: 2, name: "Blacksmithing", icon_url: "https://icons.example.com/bs.png" },
    ],
    loading: false,
  }),
}));

describe("Sidebar", () => {
  it("renders profession names", () => {
    render(<Sidebar selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Alchemy")).toBeInTheDocument();
    expect(screen.getByText("Blacksmithing")).toBeInTheDocument();
  });

  it("highlights the selected profession", () => {
    render(<Sidebar selectedId={1} onSelect={vi.fn()} />);
    const alchemy = screen.getByText("Alchemy").closest("li");
    expect(alchemy).toHaveClass("active");
  });

  it("calls onSelect when a profession is clicked", () => {
    const onSelect = vi.fn();
    render(<Sidebar selectedId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Blacksmithing"));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("renders icon images when icon_url is provided", () => {
    render(<Sidebar selectedId={null} onSelect={vi.fn()} />);
    const imgs = document.querySelectorAll("img.sidebar__icon");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("src", "https://icons.example.com/bs.png");
  });
});
