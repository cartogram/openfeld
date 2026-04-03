import { test, expect } from "@playwright/test";

test("page loads with title and status", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Is Tempelhof Feld open?");
  await expect(
    page.getByRole("heading", { name: "Is Tempelhof Feld open?" }),
  ).toBeVisible();
});

test("displays open or closed status", async ({ page }) => {
  await page.goto("/");

  const status = page.locator(".status");
  await expect(status).toHaveText(/^(Open|Closed)$/);
});

test("countdown timer is visible and updating", async ({ page }) => {
  await page.goto("/");

  const countdown = page.locator(".countdown");
  await expect(countdown).toBeVisible();

  const first = await countdown.textContent();
  expect(first).toMatch(/\d+h \d{2}m \d{2}s/);

  // Wait and verify the timer updates
  await page.waitForTimeout(1500);
  const second = await countdown.textContent();
  expect(second).toMatch(/\d+h \d{2}m \d{2}s/);
  expect(second).not.toBe(first);
});
