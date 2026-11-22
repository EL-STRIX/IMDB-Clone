import https from "node:https";
import dns from "node:dns/promises";

/**
 * Resilient fetch helper for TMDb API that resolves directly via secure DNS (8.8.8.8 / 1.1.1.1)
 * to bypass ISP-level DNS blocking/poisoning in certain regions (e.g. India).
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

  return new Promise((resolve, reject) => {
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
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error(`Failed to parse TMDB JSON: ${e}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}
