import { NextRequest, NextResponse } from "next/server";
import { getAwardsForActor, addAwardForActor } from "@/lib/data/awards";
import { can, User } from "@/lib/auth/policy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing actor id" }, { status: 400 });
  }

  // Check read policy (public access)
  const isAllowed = can(null, "read", "awards");
  if (!isAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const awardsData = getAwardsForActor(id);

  return NextResponse.json(awardsData, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing actor id" }, { status: 400 });
  }

  // Extract user authorization from headers
  const roleHeader = request.headers.get("x-user-role");
  const authHeader = request.headers.get("authorization");

  let role: User["role"] = "guest";
  if (roleHeader === "admin" || authHeader?.includes("admin")) {
    role = "admin";
  } else if (roleHeader === "editor" || authHeader?.includes("editor")) {
    role = "editor";
  } else if (roleHeader === "viewer") {
    role = "viewer";
  }

  const user: User = { id: "req-user", role };

  // Enforce policy: write is restricted to admin/editor
  if (!can(user, "write", "awards")) {
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions to modify awards" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.event || !body.category || !body.year) {
      return NextResponse.json(
        { error: "Missing required fields: event, category, year" },
        { status: 400 }
      );
    }

    const createdAward = addAwardForActor(id, {
      event: body.event,
      year: Number(body.year),
      category: body.category,
      work: body.work || "Featured Work",
      outcome: body.outcome === "won" ? "won" : "nominated",
    });

    return NextResponse.json(createdAward, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
