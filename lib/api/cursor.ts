export function encodeCursor(page: number): string {
  return Buffer.from(JSON.stringify({ page })).toString("base64");
}

export function decodeCursor(cursor?: string): number {
  if (!cursor) return 1;
  try {
    const json = Buffer.from(cursor, "base64").toString("utf-8");
    const data = JSON.parse(json);
    return typeof data.page === "number" && data.page > 0 ? data.page : 1;
  } catch {
    return 1;
  }
}
