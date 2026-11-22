import { NextRequest, NextResponse } from "next/server";
import { serverWatchlistStore } from "@/lib/watchlist/serverStore";
import { SyncBatchRequest } from "@/lib/watchlist/syncTypes";

export async function POST(request: NextRequest) {
  try {
    const body: SyncBatchRequest = await request.json();

    if (!body || !Array.isArray(body.clientMutations)) {
      return NextResponse.json(
        { error: "Invalid payload: 'clientMutations' array required" },
        { status: 400 }
      );
    }

    const syncResult = serverWatchlistStore.reconcile(body);

    return NextResponse.json(syncResult, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process sync request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const items = serverWatchlistStore.getServerItems();
  return NextResponse.json({ items, count: items.length }, { status: 200 });
}
