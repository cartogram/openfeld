import { test, expect, type Page } from "@playwright/test";

const status = (page: Page) => page.locator("#status");
const countdown = (page: Page) => page.locator("#countdown");

test.describe("home page", () => {
  test("page loads with title and status", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/— Tempelhof Feld$/);
    await expect(
      page.getByRole("heading", { name: "The feld is" }),
    ).toBeVisible();
  });

  test("displays open or closed status", async ({ page }) => {
    await page.goto("/");

    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
  });

  test("countdown timer is visible and updating", async ({ page }) => {
    await page.goto("/");

    const countdownEl = countdown(page);
    await expect(countdownEl).toBeVisible();

    const first = await countdownEl.textContent();
    expect(first).toMatch(/\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i);

    // Wait and verify the timer updates
    await page.waitForTimeout(1500);
    const second = await countdownEl.textContent();
    expect(second).toMatch(/\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i);
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
      page.getByRole("heading", { name: "Das Feld ist" }),
    ).toBeVisible();

    await expect(status(page)).toHaveText(/^(Geöffnet|Geschlossen)$/);
  });

  test("language toggle is visible and links to other locale", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.locator(".lang-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText("DE");
    await expect(toggle).toHaveAttribute("href", "/de/");

    await page.goto("/de/");
    await expect(toggle).toHaveText("EN");
    await expect(toggle).toHaveAttribute("href", "/");
  });

  test("clicking language toggle switches page language", async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("preferred-locale"));
    await page.goto("/");

    // Verify English
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);

    // Click toggle to switch to German
    await page.locator(".lang-toggle").click();
    await page.waitForURL(/\/de\//);
    await expect(
      page.getByRole("heading", { name: "Das Feld ist" }),
    ).toBeVisible();
    await expect(status(page)).toHaveText(/^(Geöffnet|Geschlossen)$/);

    // Click toggle to switch back to English
    await page.locator(".lang-toggle").click();
    await page.waitForURL(/^http:\/\/[^/]+\/$/);
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
  });

  test("language toggle preserves hash when switching locale", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.removeItem("preferred-locale"));
    await page.goto("/#details");

    await expect(
      page.getByRole("heading", { name: "Opening Hours" }),
    ).toBeVisible();

    await page.locator(".lang-toggle").click();
    await expect(page).toHaveURL(/\/de\/#details/);
    await expect(
      page.getByRole("heading", { name: "Die Öffnungszeiten" }),
    ).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("countdown loads after navigating away and back", async ({ page }) => {
    await page.goto("/");

    // Confirm initial load completes (not stuck on "Loading…")
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
    await expect(countdown(page)).toHaveText(
      /\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i,
    );

    // Navigate to a non-existent page, then go back
    await page.goto("/non-existent");
    await page.goBack();

    // Verify countdown re-initializes after navigation
    await expect(status(page)).not.toHaveText("Loading…");
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
    await expect(countdown(page)).toHaveText(
      /\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i,
    );
  });

  test("countdown loads after page reload", async ({ page }) => {
    await page.goto("/");

    // Confirm initial load
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
    await expect(countdown(page)).toHaveText(
      /\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i,
    );

    // Reload and verify it re-initializes
    await page.reload();

    await expect(status(page)).not.toHaveText("Loading…");
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
    await expect(countdown(page)).toHaveText(
      /\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i,
    );
  });

  test("countdown loads after visiting details anchor and returning", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
    await expect(countdown(page)).toHaveText(
      /\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i,
    );

    await page.getByRole("link", { name: "About" }).click();
    await expect(page.locator("#details")).toBeVisible();

    await page.getByRole("link", { name: "Back to status" }).click();

    await expect(status(page)).not.toHaveText("Loading…");
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
    await expect(countdown(page)).toHaveText(
      /\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i,
    );
  });

  test("countdown loads after starting on details hash and returning to status", async ({
    page,
  }) => {
    await page.goto("/#details");

    await expect(
      page.getByRole("heading", { name: "Opening Hours" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Back to status" }).click();

    await expect(status(page)).not.toHaveText("Loading…");
    await expect(status(page)).toHaveText(/^(Open|Closed)$/);
    await expect(countdown(page)).toHaveText(
      /\d+\s+Hours\s+\d+\s+Minutes\s+\d+\s+Seconds/i,
    );
  });
});
