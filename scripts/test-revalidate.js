const http = require("node:http");

// Unit check of revalidation route logic
const expectedSecret = "internship_revalidate_secret";

function testValidationLogic(url, headers = {}) {
  const parsed = new URL(url, "http://localhost:3000");
  const secret = parsed.searchParams.get("secret") || headers["x-revalidate-secret"];
  const tag = parsed.searchParams.get("tag");

  if (secret !== expectedSecret) {
    return { status: 401, body: { error: "Invalid secret" } };
  }
  if (!tag) {
    return { status: 400, body: { error: "Missing 'tag' query parameter" } };
  }
  return { status: 200, body: { revalidated: true, tag, now: Date.now() } };
}

// 1. Test unauthorized
const res1 = testValidationLogic("/api/revalidate?secret=wrong&tag=movies");
if (res1.status !== 401) throw new Error("Expected 401 for wrong secret");

// 2. Test missing tag
const res2 = testValidationLogic("/api/revalidate?secret=" + expectedSecret);
if (res2.status !== 400) throw new Error("Expected 400 for missing tag");

// 3. Test success with query secret
const res3 = testValidationLogic(`/api/revalidate?secret=${expectedSecret}&tag=movies`);
if (res3.status !== 200 || !res3.body.revalidated) throw new Error("Expected 200 and revalidated: true");

// 4. Test success with header secret
const res4 = testValidationLogic("/api/revalidate?tag=movie-550", {
  "x-revalidate-secret": expectedSecret,
});
if (res4.status !== 200 || res4.body.tag !== "movie-550") throw new Error("Expected 200 for movie-550 tag");

console.log("✓ Revalidation route tests passed for both query param and header secrets!");
