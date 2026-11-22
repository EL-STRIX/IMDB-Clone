import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();
    console.log(
      `[WEB VITALS] ${metric.name}: ${metric.value.toFixed(2)} (rating: ${metric.rating || "N/A"}, id: ${metric.id})`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid metric data" }, { status: 400 });
  }
}
