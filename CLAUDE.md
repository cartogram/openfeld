# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Openfeld is an Astro 6 site using the minimal starter template. It uses Vite+ (`vp`) as the unified toolchain and pnpm as the package manager. Requires Node.js >= 22.12.0.

## Commands

- `vp dev` — Start Vite dev server
- `vp build` — Production build to `./dist/`
- `vp check` — Run format, lint, and type checks
- `vp fmt` — Format code with Oxfmt
- `vp lint` — Lint code with Oxlint
- `vp exec playwright test` — Run Playwright smoke tests
- `vp run dev` — Run the `dev` script from package.json (Astro dev server at localhost:4321)
- `vp run build` — Run the `build` script from package.json (Astro build)

## Architecture

- **Framework:** Astro 6 with strict TypeScript (`astro/tsconfigs/strict`)
- **Toolchain:** Vite+ (`vite.config.ts` for unified config)
- **Routing:** File-based routing in `src/pages/` — `.astro` and `.md` files become routes
- **Static assets:** Placed in `public/`
- **Components:** Place in `src/components/`
- **Config:** `astro.config.mjs` for Astro, `vite.config.ts` for Vite+

## Testing

After making changes, run `vp check` to validate formatting, linting, and types. Run `vp exec playwright test` to validate the smoke tests pass. Tests cover the page title, open/closed status display, and countdown timer.

## CI

- `.github/workflows/ci.yml` — Runs `vp check` and Playwright tests on PRs to `main`
- `.github/workflows/deploy.yml` — Deploys to Cloudflare Pages on push to `main`
- `.github/workflows/claude.yml` — Runs Claude Code on issues and PR comments when `@claude` is mentioned
