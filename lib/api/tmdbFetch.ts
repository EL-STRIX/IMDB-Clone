import https from "node:https";
import dns from "node:dns/promises";
import { defaultRateLimiter } from "@/lib/resilience/tokenBucket";
import { withRetry } from "@/lib/resilience/retry";
import { defaultCircuitBreaker } from "@/lib/resilience/circuitBreaker";
import { logTrace, logErrorTrace } from "@/lib/resilience/telemetry";

/**
 * Resilient fetch helper for TMDb API that resolves directly via secure DNS (8.8.8.8 / 1.1.1.1)
 * to bypass ISP-level DNS blocking/poisoning in certain regions (e.g. India).
 * Rate limited via TokenBucket, wrapped with exponential backoff retry, and logged to telemetry.
 */
export async function tmdbFetch<T>(path: string): Promise<T> {
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);

  let ip: string;
  try {
    const ips = await resolver.resolve4("api.themoviedb.org");
    ip = ips[0];
  } catch {
    ip = "3.175.86.67";
  }

  const startTime = Date.now();
  let retryCount = 0;

  return withRetry(async () => {
    await defaultRateLimiter.acquire();

    return new Promise<T>((resolve, reject) => {
      const req = https.request(
        {
          hostname: ip,
          port: 443,
          path,
          method: "GET",
          headers: {
            Host: "api.themoviedb.org",
            Accept: "application/json",
            "User-Agent": "IMDbClone/1.0",
          },
          servername: "api.themoviedb.org",
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            const durationMs = Date.now() - startTime;
            const status = res.statusCode || 200;

            if (status >= 400) {
              const err: any = new Error(`TMDb error HTTP ${status}`);
              err.status = status;
              logErrorTrace({
                url: path,
                error: err,
                breakerState: defaultCircuitBreaker.getState(),
              });
              retryCount++;
              return reject(err);
            }

            try {
              const parsed = JSON.parse(raw);
              logTrace({
                url: path,
                durationMs,
                status,
                retryCount,
                breakerState: defaultCircuitBreaker.getState(),
              });
              resolve(parsed);
            } catch (e) {
              logErrorTrace({
                url: path,
                error: e,
                breakerState: defaultCircuitBreaker.getState(),
              });
              reject(new Error(`Failed to parse TMDB JSON: ${e}`));
            }
          });
        }
      );

      req.on("error", (err) => {
        logErrorTrace({
          url: path,
          error: err,
          breakerState: defaultCircuitBreaker.getState(),
        });
        retryCount++;
        reject(err);
      });

      req.end();
    });
  });
}
