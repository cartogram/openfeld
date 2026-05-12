# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Openfeld is a real-time status checker for Tempelhof Feld park in Berlin. It shows whether the park is currently open or closed, with a live countdown timer and historical opening hours. The site is bilingual (English/German) and includes a public JSON API.

Built with Astro 6, deployed to Cloudflare Workers, using Vite+ (`vp`) as the unified toolchain and pnpm as the package manager. Requires Node.js >= 22.12.0.

## Commands

All commands use the Vite+ CLI (`vp`). Do not use `pnpm`/`npm` directly for running scripts.

- `vp dev` — Start Vite dev server
- `vp build` — Production build to `./dist/`
- `vp check` — Run format, lint, and type checks (run this after every change)
- `vp fmt` — Format code with Oxfmt (80-char print width)
- `vp lint` — Lint with Oxlint (type-aware)
- `vp exec playwright test` — Run Playwright E2E tests
- `vp run dev` — Run the `dev` script from package.json (Astro dev server at localhost:4321)
- `vp run build` — Run the `build` script from package.json (Astro build)
- `vp add / remove / update` — Package management (wraps pnpm)

**Vite+ pitfalls:**

- Never run `vp vitest` or `vp oxlint` directly — use `vp test` and `vp lint`
- Never import from `vite` or `vitest` directly — use `vite-plus`
- Never install Vitest, Oxlint, or Oxfmt separately — they are managed by Vite+
- Use `vp run <script>` for custom npm scripts that share a name with a built-in command

## Architecture

- **Framework:** Astro 6 with strict TypeScript (`astro/tsconfigs/strict`)
- **Adapter:** `@astrojs/cloudflare` — deployed as Cloudflare Workers (SSR)
- **Toolchain:** Vite+ (`vite.config.ts` for unified config, `pnpm-workspace.yaml` for catalog)
- **Routing:** File-based routing in `src/pages/` — `.astro` and `.ts` files become routes
- **i18n:** Astro's built-in i18n with English (default) and German; locale prefix `/de/`
- **Styling:** Plain CSS only — no CSS frameworks, no preprocessors
- **JavaScript:** No JS frameworks — all interactivity is native custom elements and vanilla JS
- **Static assets:** `public/`
- **Config:** `astro.config.mjs` (Astro + i18n + adapter), `vite.config.ts` (Vite+ toolchain), `wrangler.jsonc` (Cloudflare Workers)

## Source Structure

```
src/
├── components/         # Astro components (UI building blocks)
├── data/               # Core business logic
├── i18n/               # Translation strings and loader
├── layouts/            # Base page template
├── pages/              # File-based routes
│   ├── index.astro     # English home page
│   ├── de/             # German home page
│   └── api/            # JSON API endpoints
│       ├── hours.ts    # GET  /api/hours — all 12 months of hours
│       └── status.ts   # POST /api/status — open/closed at a timestamp
└── styles/             # Global CSS (imported via global.css)
    ├── reset.css       # Box-sizing, button resets
    ├── theme.css       # Design tokens (colors, fonts, spacing)
    ├── layout.css      # Responsive grid with gutters
    ├── typography.css  # Font loading (Chivo, Outward), heading styles
    ├── actions.css     # Link and button styles with underline effects
    └── global.css      # Imports all above; body setup, utilities
```

### Key Components

- **`Interface.astro`** — Status UI and countdown; `min-height` fills the viewport below the header (`--site-header-band` in `theme.css`) so `#details` starts below the first screen
- **`Base.astro`** (layout) — Wraps every page; composes header, interface, content, and footer; includes `ClientRouter` for Astro view transitions, dynamic theme colors based on park status, SEO meta tags, analytics
- **`Content.astro`** — Page slot plus the details section (opening hours, about copy, links) below the interface
- **`LanguageToggle.astro`** — Persists locale choice in `localStorage`; redirects on first visit based on browser preference
- **`ThemeToggle.astro`** — Custom element for light/dark theme toggle
- **`Head.astro`** — Global `<meta>`, Open Graph, Twitter Card tags
- **`Analytics.astro`** — Google Analytics (gtag)

### Data Layer (`src/data/`)

- **`hours.ts`** — `HOURS` constant maps month index (0–11) to open/close times. Some months have a `splitDay` property (closing time changes partway through the month). Key exports: `isOpen()`, `getTargetTime()`, `getCloseTime()`. All times are in Berlin timezone (`Europe/Berlin`).
- **`status.ts`** — `getStatus(date)` returns an `{ open, timeRemaining }` response. Used by `api/status.ts` and consumed by `Interface.astro`.

### i18n (`src/i18n/`)

- `en.ts` / `de.ts` — Translation string maps (German is auto-translated via DeepL; see `scripts/translate.ts`)
- `index.ts` — `getTranslations(locale)` helper used in all pages and components
- When editing `src/i18n/en.ts`, the `translate.yml` workflow automatically updates `de.ts` on the PR

## Testing

After every change:

1. `vp check` — validates formatting, linting, and TypeScript types
2. `vp exec playwright test` — runs the full E2E suite

**Test files:**

- `tests/smoke.test.ts` — Page load, open/closed display, countdown, German i18n, language toggle, `#details` hash / anchor navigation, countdown re-init after navigation/reload
- `tests/api.test.ts` — GET `/api/hours` response shape, POST `/api/status` with valid/invalid timestamps, CORS headers
- `scripts/translate.test.ts` — Unit tests for the translation script

Playwright runs on Chromium only, against `localhost:4322` (dev server on a different port than the default 4321 to avoid conflicts).

## CI/CD

- **`.github/workflows/ci.yml`** — On PRs to `main`: runs `vp check` then Playwright tests
- **`.github/workflows/deploy.yml`** — On push to `main`: builds with `vp run build` and deploys to Cloudflare Pages via wrangler
- **`.github/workflows/claude.yml`** — Runs Claude Code on issues and PR comments when `@claude` is mentioned
- **`.github/workflows/translate.yml`** — On PRs touching `src/i18n/en.ts`: auto-translates to German, formats, and commits `de.ts`

## Key Conventions

- **No framework JS, no CSS frameworks** — keep UI in native HTML/CSS/JS
- **TypeScript everywhere** — strict mode; all new code must typecheck cleanly
- **Design tokens in `theme.css`** — never hardcode colors or spacing values inline
- **Berlin timezone for all time logic** — always use `Europe/Berlin` in `src/data/`
- **i18n all user-visible strings** — add new strings to `en.ts`; `de.ts` is auto-generated
- **Semantic HTML** — use `<time>` for dates/times, proper ARIA attributes for dynamic content
- **Run `vp check` before committing** — CI will fail if formatting or lint errors exist
