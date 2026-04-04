/// <reference types="node" />
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "npx astro dev --port 4322",
    env: { PLAYWRIGHT: "1" },
    port: 4322,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:4322",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
