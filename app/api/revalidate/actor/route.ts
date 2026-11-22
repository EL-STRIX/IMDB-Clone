import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-revalidate-secret");

  const expectedSecret =
    process.env.REVALIDATE_SECRET || "internship_revalidate_secret";

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Missing 'id' query parameter for actor revalidation" },
      { status: 400 }
    );
  }

  try {
    // In Next.js 16 revalidateTag accepts a second argument ('max' or undefined)
    (revalidateTag as any)(`actor-${id}`, "max");
    revalidatePath(`/actor/${id}`);

    return NextResponse.json({
      revalidated: true,
      actorId: id,
      now: Date.now(),
    });
  } catch (error) {
    console.error("Actor revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate actor" },
      { status: 500 }
    );
  }
}
