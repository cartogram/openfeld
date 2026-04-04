// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://openfeld.cartogram.ca",
  adapter: cloudflare(),
  integrations: [sitemap()],
  devToolbar: { enabled: !process.env.PLAYWRIGHT },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
