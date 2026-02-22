import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Toast from "./Toast";

describe("Toast", () => {
  it("renders nothing when message is null", () => {
    const { container } = render(<Toast message={null} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the message text", () => {
    render(<Toast message="Recipe added to your profile." visible={true} />);
    expect(screen.getByText("Recipe added to your profile.")).toBeInTheDocument();
  });

  it("has the visible class when visible is true", () => {
    render(<Toast message="Hello" visible={true} />);
    const el = screen.getByRole("status");
    expect(el.className).toContain("visible");
  });

  it("does not have the visible class when visible is false", () => {
    render(<Toast message="Hello" visible={false} />);
    const el = screen.getByRole("status");
    expect(el.className).not.toContain("visible");
  });
});
