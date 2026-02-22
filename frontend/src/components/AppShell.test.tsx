import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AppShell from "./AppShell";

describe("AppShell", () => {
  it("renders top bar, sidebar, and children", () => {
    render(
      <AppShell
        topBar={<div data-testid="topbar">TopBar</div>}
        sidebar={<div data-testid="sidebar">Sidebar</div>}
      >
        <div data-testid="content">Content</div>
      </AppShell>
    );

    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("toggles sidebar open class when hamburger is clicked", () => {
    render(
      <AppShell sidebar={<div>Sidebar</div>}>
        <div>Content</div>
      </AppShell>
    );

    const hamburger = screen.getByLabelText("Open menu");
    const sidebar = document.querySelector(".app-sidebar");

    expect(sidebar).not.toHaveClass("open");

    fireEvent.click(hamburger);
    expect(sidebar).toHaveClass("open");

    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(sidebar).not.toHaveClass("open");
  });

  it("closes sidebar when overlay is clicked", () => {
    render(
      <AppShell sidebar={<div>Sidebar</div>}>
        <div>Content</div>
      </AppShell>
    );

    fireEvent.click(screen.getByLabelText("Open menu"));
    const sidebar = document.querySelector(".app-sidebar");
    expect(sidebar).toHaveClass("open");

    const overlay = document.querySelector(".app-sidebar-overlay");
    fireEvent.click(overlay!);
    expect(sidebar).not.toHaveClass("open");
  });
});
