import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SessionProvider } from "@/components/auth/SessionProvider";
import AuthButton from "@/components/auth/AuthButton";
import { DEMO_USERS } from "@/lib/auth/session";

describe("SessionProvider & AuthButton UI (Day 41)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Sign In button when user is unauthenticated", async () => {
    // Mock GET /api/auth/session returning unauthenticated
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/session")) {
        return new Response(JSON.stringify({ authenticated: false, session: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, { status: 404 });
    });

    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );

    const signInBtn = await screen.findByRole("button", { name: "Sign In" });
    expect(signInBtn).toBeDefined();
  });

  it("opens modal dialog when Sign In is clicked with demo and OAuth options", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/api/auth/session")) {
        return new Response(JSON.stringify({ authenticated: false, session: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, { status: 404 });
    });

    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );

    const signInBtn = await screen.findByRole("button", { name: "Sign In" });
    fireEvent.click(signInBtn);

    expect(await screen.findByRole("dialog")).toBeDefined();
    expect(screen.getByText("Sign In to IMDb Clone")).toBeDefined();
    expect(screen.getByText(/Demo Critic \(Eleanor Vance\)/i)).toBeDefined();
    expect(screen.getByText(/Demo Cinephile \(Alex Rivera\)/i)).toBeDefined();
    expect(screen.getByText("Continue with GitHub")).toBeDefined();
    expect(screen.getByText("Continue with Google")).toBeDefined();
  });

  it("signs in as demo user when clicking Demo Critic and updates UI to authenticated", async () => {
    const criticUser = DEMO_USERS.critic;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      const u = typeof url === "string" ? url : url.toString();

      if (u.includes("/api/auth/session") && options?.method === "POST") {
        return new Response(
          JSON.stringify({
            authenticated: true,
            user: criticUser,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (u.includes("/api/auth/session")) {
        return new Response(JSON.stringify({ authenticated: false, session: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(null, { status: 404 });
    });

    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );

    const signInBtn = await screen.findByRole("button", { name: "Sign In" });
    fireEvent.click(signInBtn);

    const demoCriticBtn = await screen.findByText(/Demo Critic \(Eleanor Vance\)/i);
    fireEvent.click(demoCriticBtn);

    // Modal closes and user button renders with username
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByText("Eleanor Vance (Top Critic)")).toBeDefined();
    });
  });

  it("opens user menu and signs out successfully", async () => {
    const criticUser = DEMO_USERS.critic;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      const u = typeof url === "string" ? url : url.toString();

      if (u.includes("/api/auth/session") && options?.method === "DELETE") {
        return new Response(
          JSON.stringify({ authenticated: false, message: "Signed out successfully" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Initial session load returns authenticated critic
      if (u.includes("/api/auth/session")) {
        return new Response(
          JSON.stringify({ authenticated: true, user: criticUser }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(null, { status: 404 });
    });

    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );

    // Shows user button
    const userBtn = await screen.findByRole("button", {
      name: `User menu for ${criticUser.name}`,
    });
    expect(userBtn).toBeDefined();

    // Click to open user menu
    fireEvent.click(userBtn);

    const signOutBtn = await screen.findByRole("menuitem", { name: /Sign Out/i });
    expect(signOutBtn).toBeDefined();

    // Click sign out
    fireEvent.click(signOutBtn);

    // Reverts to unauthenticated state with "Sign In" button
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
    });
  });
});
