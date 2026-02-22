import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with no message and not visible", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.message).toBeNull();
    expect(result.current.visible).toBe(false);
  });

  it("shows a message and sets visible to true", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.show("Hello");
    });

    expect(result.current.message).toBe("Hello");
    expect(result.current.visible).toBe(true);
  });

  it("hides after the duration", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.show("Hello");
    });

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.message).toBeNull();
  });

  it("resets timer when show is called again", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.show("First");
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.show("Second");
    });

    expect(result.current.message).toBe("Second");
    expect(result.current.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.visible).toBe(false);
  });
});
