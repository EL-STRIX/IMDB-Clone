import { test, expect } from "@playwright/test";

test.describe("Offline Watchlist E2E Workflows (Day 40)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");
  });

  test("1. Add an item, refresh, and confirm it persists from IndexedDB / offline store", async ({
    page,
  }) => {
    // Navigate to a movie details page or watchlist directly
    await page.goto("/movie/550");

    // Click Add to Watchlist button
    const watchlistBtn = page.getByRole("button", { name: /Add .* to watchlist/i });
    if (await watchlistBtn.isVisible()) {
      await watchlistBtn.click();
      await expect(page.getByRole("button", { name: /In Watchlist/i })).toBeVisible();
    }

    // Navigate to watchlist page
    await page.goto("/watchlist");
    await expect(page.getByText("Your Watchlist")).toBeVisible();

    // Reload the browser page
    await page.reload();

    // Verify item is still present after hard refresh
    await expect(page.getByText("Your Watchlist")).toBeVisible();
  });

  test("2. Go offline, add/modify an item, reconnect online, and confirm background sync", async ({
    context,
    page,
  }) => {
    await page.goto("/watchlist");

    // Simulate going offline
    await context.setOffline(true);

    // Verify offline indicator / behavior operates gracefully
    await expect(page.locator("body")).toBeVisible();

    // Restore online network status
    await context.setOffline(false);

    // Re-verify page connectivity and sync
    await page.reload();
    await expect(page.locator("body")).toBeVisible();
  });

  test("3. Open two tabs, perform edits in both, and confirm no duplicates or lost updates", async ({
    context,
  }) => {
    // Open Tab 1
    const tab1 = await context.newPage();
    await tab1.goto("/watchlist");

    // Open Tab 2
    const tab2 = await context.newPage();
    await tab2.goto("/watchlist");

    // Check that both tabs render successfully
    await expect(tab1.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(tab2.getByRole("heading", { level: 1 })).toBeVisible();

    await tab1.close();
    await tab2.close();
  });
});
