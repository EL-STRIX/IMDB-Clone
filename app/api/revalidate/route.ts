import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-revalidate-secret");

  const expectedSecret = process.env.REVALIDATE_SECRET || "internship_revalidate_secret";

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const tag = request.nextUrl.searchParams.get("tag");
  if (!tag) {
    return NextResponse.json(
      { error: "Missing 'tag' query parameter" },
      { status: 400 }
    );
  }

  try {
    (revalidateTag as any)(tag, "max");
    return NextResponse.json({
      revalidated: true,
      tag,
      now: Date.now(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate tag" },
      { status: 500 }
    );
  }
}
