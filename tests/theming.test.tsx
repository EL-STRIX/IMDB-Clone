import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, useTheme, ThemeScope } from "@/components/ThemeProvider";

function TestConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("hc")}>Set HC</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("Theming System Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "theme=; path=/; max-age=0";
    document.documentElement.removeAttribute("data-theme");
  });

  it("initial render matches initial theme and sets data-theme on <html>", () => {
    render(
      <ThemeProvider initialTheme="hc">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("hc");
    expect(screen.getByTestId("resolved").textContent).toBe("hc");
    expect(document.documentElement.getAttribute("data-theme")).toBe("hc");
  });

  it("toggle switches data-theme on <html> and updates cookie and localStorage", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Switch to light
    act(() => {
      fireEvent.click(screen.getByText("Set Light"));
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.cookie).toContain("theme=light");

    // Switch to high-contrast
    act(() => {
      fireEvent.click(screen.getByText("Set HC"));
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("hc");
    expect(localStorage.getItem("theme")).toBe("hc");
    expect(document.cookie).toContain("theme=hc");
  });

  it("system mode respects prefers-color-scheme media query", () => {
    // Mock matchMedia for prefers-color-scheme: dark
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider initialTheme="system">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("ensures no flash occurs by having valid theme attribute", () => {
    render(
      <ThemeProvider initialTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    // Root html element attribute is synchronously present
    const attr = document.documentElement.getAttribute("data-theme");
    expect(attr).toBe("light");
  });

  it("ThemeScope isolates theme override for subtrees", () => {
    render(
      <ThemeProvider initialTheme="light">
        <div>
          <span data-testid="global">Global Light</span>
          <ThemeScope theme="dark">
            <span data-testid="scoped">Scoped Dark</span>
          </ThemeScope>
        </div>
      </ThemeProvider>
    );

    const scopedElem = screen.getByTestId("scoped").closest("[data-theme]");
    expect(scopedElem?.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
