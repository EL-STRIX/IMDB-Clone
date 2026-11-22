import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { can, User } from "@/lib/auth/policy";
import { GET, POST } from "@/app/api/actor/[id]/awards/route";
import { getAwardsForActor } from "@/lib/data/awards";

describe("Access Policy Rules: can(user, action, resource)", () => {
  it("permits public read access for unauthenticated users and guests", () => {
    expect(can(null, "read", "awards")).toBe(true);
    expect(can(undefined, "read", "awards")).toBe(true);
    expect(can({ id: "1", role: "guest" }, "read", "awards")).toBe(true);
    expect(can({ id: "2", role: "viewer" }, "read", "awards")).toBe(true);
  });

  it("restricts write operations: denies guests and viewers, permits editors and admins", () => {
    expect(can(null, "write", "awards")).toBe(false);
    expect(can({ id: "1", role: "guest" }, "write", "awards")).toBe(false);
    expect(can({ id: "2", role: "viewer" }, "write", "awards")).toBe(false);

    expect(can({ id: "3", role: "editor" }, "write", "awards")).toBe(true);
    expect(can({ id: "4", role: "admin" }, "write", "awards")).toBe(true);
  });

  it("restricts delete operations strictly to admins", () => {
    expect(can(null, "delete", "awards")).toBe(false);
    expect(can({ id: "1", role: "editor" }, "delete", "awards")).toBe(false);
    expect(can({ id: "2", role: "viewer" }, "delete", "awards")).toBe(false);

    expect(can({ id: "3", role: "admin" }, "delete", "awards")).toBe(true);
  });
});

describe("Awards Mock API Route Handlers (/api/actor/[id]/awards)", () => {
  it("GET returns 200, awards data, and stale-while-revalidate Cache-Control header", async () => {
    const req = new NextRequest("http://localhost:3000/api/actor/6193/awards");
    const res = await GET(req, { params: Promise.resolve({ id: "6193" }) });

    expect(res.status).toBe(200);

    const cacheHeader = res.headers.get("Cache-Control");
    expect(cacheHeader).toContain("stale-while-revalidate=86400");
    expect(cacheHeader).toContain("s-maxage=3600");

    const data = await res.json();
    expect(data.actorId).toBe("6193");
    expect(data.totalWins).toBeGreaterThanOrEqual(1);
    expect(data.awards.length).toBeGreaterThanOrEqual(1);
  });

  it("POST rejects unauthorized users with 403 Forbidden", async () => {
    const req = new NextRequest("http://localhost:3000/api/actor/6193/awards", {
      method: "POST",
      body: JSON.stringify({
        event: "Cannes Film Festival",
        year: 2024,
        category: "Prix d'interprétation masculine",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "6193" }) });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Forbidden");
  });

  it("POST accepts authorized editor/admin requests and creates an award", async () => {
    const req = new NextRequest("http://localhost:3000/api/actor/6193/awards", {
      method: "POST",
      headers: {
        "x-user-role": "admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "Venice Film Festival",
        year: 2024,
        category: "Volpi Cup for Best Actor",
        work: "New Feature Film",
        outcome: "won",
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "6193" }) });
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.event).toBe("Venice Film Festival");
    expect(created.outcome).toBe("won");
  });
});
