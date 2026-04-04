import { test, expect } from "@playwright/test";

test.describe("home page", () => {
  test("page loads with title and status", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/— Tempelhof Feld$/);
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
});

test.describe("i18n", () => {
  test("German page loads with translated title and status", async ({
    page,
  }) => {
    await page.goto("/de/");

    await expect(page).toHaveTitle(/— Tempelhof Feld$/);
    await expect(
      page.getByRole("heading", {
        name: "Ist das Tempelhofer Feld geöffnet?",
      }),
    ).toBeVisible();

    const status = page.locator(".status");
    await expect(status).toHaveText(/^(Geöffnet|Geschlossen)$/);
  });

  test("language toggle is visible and links to other locale", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.locator(".lang-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText("Deutsch");
    await expect(toggle).toHaveAttribute("href", "/de/");

    await page.goto("/de/");
    await expect(toggle).toHaveText("English");
    await expect(toggle).toHaveAttribute("href", "/");
  });
});

test.describe("navigation", () => {
  test("countdown loads after navigating away and back", async ({ page }) => {
    await page.goto("/");

    const status = page.locator(".status");
    const countdown = page.locator(".countdown");

    // Confirm initial load completes (not stuck on "Loading…")
    await expect(status).toHaveText(/^(Open|Closed)$/);
    await expect(countdown).toHaveText(/\d+h \d{2}m \d{2}s/);

    // Navigate to a non-existent page, then go back
    await page.goto("/non-existent");
    await page.goBack();

    // Verify countdown re-initializes after navigation
    await expect(status).not.toHaveText("Loading…");
    await expect(status).toHaveText(/^(Open|Closed)$/);
    await expect(countdown).toHaveText(/\d+h \d{2}m \d{2}s/);
  });

  test("countdown loads after page reload", async ({ page }) => {
    await page.goto("/");

    const status = page.locator(".status");
    const countdown = page.locator(".countdown");

    // Confirm initial load
    await expect(status).toHaveText(/^(Open|Closed)$/);
    await expect(countdown).toHaveText(/\d+h \d{2}m \d{2}s/);

    // Reload and verify it re-initializes
    await page.reload();

    await expect(status).not.toHaveText("Loading…");
    await expect(status).toHaveText(/^(Open|Closed)$/);
    await expect(countdown).toHaveText(/\d+h \d{2}m \d{2}s/);
  });

  test("countdown loads after navigating to info and back", async ({
    page,
  }) => {
    await page.goto("/");

    const status = page.locator(".status");
    const countdown = page.locator(".countdown");

    // Confirm initial load
    await expect(status).toHaveText(/^(Open|Closed)$/);
    await expect(countdown).toHaveText(/\d+h \d{2}m \d{2}s/);

    // Click the Info link
    await page.locator(".info-link a").click();
    await expect(page.locator(".info-page")).toBeVisible();

    // Click the Back link
    await page.locator(".back-link").click();

    // Verify countdown re-initializes after returning
    await expect(status).not.toHaveText("Loading…");
    await expect(status).toHaveText(/^(Open|Closed)$/);
    await expect(countdown).toHaveText(/\d+h \d{2}m \d{2}s/);
  });

  test("countdown loads after starting on info page and navigating home", async ({
    page,
  }) => {
    await page.goto("/info");

    // Confirm info page loaded
    await expect(
      page.getByRole("heading", { name: "Tempelhof Feld", exact: true }),
    ).toBeVisible();

    // Navigate to home via the back link
    await page.locator(".back-link").click();

    // Verify countdown is loaded
    const status = page.locator(".status");
    const countdown = page.locator(".countdown");
    await expect(status).not.toHaveText("Loading…");
    await expect(status).toHaveText(/^(Open|Closed)$/);
    await expect(countdown).toHaveText(/\d+h \d{2}m \d{2}s/);
  });
});
