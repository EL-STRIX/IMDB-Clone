import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  DEMO_USERS,
} from "@/lib/auth/session";
import { requireAuth } from "@/lib/auth/guards";
import { GET, POST } from "@/app/api/movies/[id]/reviews/route";

describe("Authentication & Route Protection (Day 41)", () => {
  describe("Token Signing & Verification", () => {
    it("generates a signed session token that verifies successfully", async () => {
      const user = DEMO_USERS.critic;
      const token = await createSessionToken(user);

      expect(token).toBeDefined();
      expect(token).toContain(".");

      const session = await verifySessionToken(token);
      expect(session).not.toBeNull();
      expect(session?.user.id).toBe(user.id);
      expect(session?.user.name).toBe(user.name);
      expect(session?.user.role).toBe("critic");
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });

    it("rejects tampered tokens with invalid HMAC signatures", async () => {
      const token = await createSessionToken(DEMO_USERS.cinephile);
      const [payload, signature] = token.split(".");

      // Tamper signature
      const tamperedToken = `${payload}.${signature}tampered`;
      const session = await verifySessionToken(tamperedToken);

      expect(session).toBeNull();
    });

    it("rejects malformed or empty token strings", async () => {
      expect(await verifySessionToken("")).toBeNull();
      expect(await verifySessionToken("not-a-token")).toBeNull();
    });
  });

  describe("Server Route Auth Guard (requireAuth)", () => {
    it("returns 401 Unauthorized when request lacks session cookie or authorization header", async () => {
      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
      });

      const auth = await requireAuth(req);
      expect(auth.authenticated).toBe(false);
      if (!auth.authenticated) {
        expect(auth.response.status).toBe(401);
        const data = await auth.response.json();
        expect(data.error).toBe("Unauthorized");
      }
    });

    it("returns 401 Unauthorized when token is invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid.fake.token",
        },
      });

      const auth = await requireAuth(req);
      expect(auth.authenticated).toBe(false);
      if (!auth.authenticated) {
        expect(auth.response.status).toBe(401);
      }
    });

    it("authorizes request with valid session cookie", async () => {
      const user = DEMO_USERS.critic;
      const token = await createSessionToken(user);

      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const auth = await requireAuth(req);
      expect(auth.authenticated).toBe(true);
      if (auth.authenticated) {
        expect(auth.user.id).toBe(user.id);
        expect(auth.user.role).toBe("critic");
      }
    });

    it("authorizes request with valid Authorization Bearer header", async () => {
      const user = DEMO_USERS.cinephile;
      const token = await createSessionToken(user);

      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const auth = await requireAuth(req);
      expect(auth.authenticated).toBe(true);
      if (auth.authenticated) {
        expect(auth.user.id).toBe(user.id);
      }
    });
  });

  describe("Review Writing API Protection", () => {
    it("allows public reading of reviews without authentication", async () => {
      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "GET",
      });

      const res = await GET(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.movieId).toBe("550");
      expect(Array.isArray(data.reviews)).toBe(true);
    });

    it("blocks unauthenticated users from writing reviews with 401 status", async () => {
      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: 10,
          title: "Masterpiece",
          content: "Absolute cinematic perfection.",
        }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("allows authenticated users to submit reviews with 201 Created", async () => {
      const user = DEMO_USERS.critic;
      const token = await createSessionToken(user);

      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          rating: 9,
          title: "Intense and gripping",
          content: "Unmatched cinematography and brilliant lead acting.",
        }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.review.authorName).toBe(user.name);
      expect(data.review.rating).toBe(9);
    });
  });
});
