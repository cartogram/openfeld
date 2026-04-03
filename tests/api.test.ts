import { test, expect } from "@playwright/test";

test.describe("GET /api/hours", () => {
  test("returns all 12 months of hours data", async ({ request }) => {
    const response = await request.get("/api/hours");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["access-control-allow-origin"]).toBe("*");

    const data = await response.json();
    expect(data.hours).toBeDefined();

    const months = Object.keys(data.hours);
    expect(months).toHaveLength(12);
    expect(months).toContain("january");
    expect(months).toContain("december");

    // Each month has open and close times
    for (const month of months) {
      expect(data.hours[month].open).toMatch(/^\d{2}:\d{2}$/);
      expect(data.hours[month].close).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});

test.describe("POST /api/status", () => {
  test("returns open status for midday in summer", async ({ request }) => {
    const response = await request.post("/api/status", {
      data: { timestamp: "2025-07-15T12:00:00+02:00" },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["access-control-allow-origin"]).toBe("*");

    const data = await response.json();
    expect(data.status).toBe("open");
    expect(data.closes_at).toBe("23:00");
    expect(data.time_remaining).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test("returns closed status for early morning", async ({ request }) => {
    const response = await request.post("/api/status", {
      data: { timestamp: "2025-01-15T04:00:00+01:00" },
    });

    const data = await response.json();
    expect(data.status).toBe("closed");
    expect(data.opens_at).toBe("07:30");
    expect(data.time_remaining).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test("returns 400 for missing timestamp", async ({ request }) => {
    const response = await request.post("/api/status", {
      data: {},
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test("returns 400 for invalid timestamp", async ({ request }) => {
    const response = await request.post("/api/status", {
      data: { timestamp: "not-a-date" },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test("returns 400 for invalid JSON", async ({ request }) => {
    const response = await request.fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: "not json{",
    });

    expect(response.status()).toBe(400);
  });

  test("includes CORS headers on POST response", async ({ request }) => {
    const response = await request.post("/api/status", {
      data: { timestamp: "2025-07-15T12:00:00+02:00" },
    });

    expect(response.headers()["access-control-allow-origin"]).toBe("*");
  });
});
