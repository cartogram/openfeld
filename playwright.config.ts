import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "pnpm dev",
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:4321",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
