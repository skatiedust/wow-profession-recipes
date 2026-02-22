import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CrafterList from "./CrafterList";

describe("CrafterList", () => {
  it("renders an em dash when crafters is empty", () => {
    render(<CrafterList crafters={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders a single crafter name", () => {
    render(
      <CrafterList crafters={[{ name: "Gondor", realm: "Whitemane" }]} />
    );
    expect(screen.getByText("Gondor")).toBeInTheDocument();
  });

  it("renders multiple crafter names", () => {
    render(
      <CrafterList
        crafters={[
          { name: "Gondor", realm: "Whitemane" },
          { name: "Aelina", realm: "Pagle" },
          { name: "Zeph", realm: "Whitemane" },
        ]}
      />
    );
    expect(screen.getByText("Gondor")).toBeInTheDocument();
    expect(screen.getByText("Aelina")).toBeInTheDocument();
    expect(screen.getByText("Zeph")).toBeInTheDocument();
  });

  it("adds realm as title attribute", () => {
    render(
      <CrafterList crafters={[{ name: "Gondor", realm: "Whitemane" }]} />
    );
    const nameEl = screen.getByText("Gondor");
    expect(nameEl).toHaveAttribute("title", "Gondor - Whitemane");
  });
});
