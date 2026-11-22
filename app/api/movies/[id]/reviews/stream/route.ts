import { NextRequest } from "next/server";
import { reviewEventBus } from "@/lib/reviews/events";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/movies/[id]/reviews/stream
 * Server-Sent Events (SSE) endpoint broadcasting live review creations, edits, votes, and flags.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: movieId } = await params;
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let pingInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial connection payload
      try {
        controller.enqueue(
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ type: "connected", movieId })}\n\n`)
        );
      } catch {
        // Stream aborted immediately
        return;
      }

      // 2. Subscribe to review events for this movie
      unsubscribe = reviewEventBus.subscribe(movieId, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`event: review-update\ndata: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Client disconnected
          if (unsubscribe) unsubscribe();
        }
      });

      // 3. Heartbeat ping to keep connection alive through proxies
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (pingInterval) clearInterval(pingInterval);
        }
      }, 30000);
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    },
  });

  req.signal.addEventListener("abort", () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
