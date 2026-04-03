# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Openfeld is an Astro 6 site using the minimal starter template. It uses pnpm as the package manager and requires Node.js >= 22.12.0.

## Commands

- `pnpm dev` — Start dev server at localhost:4321
- `pnpm build` — Production build to `./dist/`
- `pnpm preview` — Preview production build locally
- `pnpm astro add <integration>` — Add an Astro integration
- `pnpm format` — Format code with Prettier
- `pnpm format:check` — Check formatting without writing
- `pnpm exec playwright test` — Run Playwright smoke tests
- `pnpm astro check` — Run Astro type checking

## Architecture

- **Framework:** Astro 6 with strict TypeScript (`astro/tsconfigs/strict`)
- **Routing:** File-based routing in `src/pages/` — `.astro` and `.md` files become routes
- **Static assets:** Placed in `public/`
- **Components:** Place in `src/components/`
- **Config:** `astro.config.mjs` (currently default/empty)

## Testing

After making changes, run `pnpm exec playwright test` to validate the smoke tests pass. Tests cover the page title, open/closed status display, and countdown timer.

## CI

- `.github/workflows/ci.yml` — Runs `astro check` and Playwright tests on PRs to `main`
- `.github/workflows/deploy.yml` — Deploys to Cloudflare Pages on push to `main`
- `.github/workflows/claude.yml` — Runs Claude Code on issues and PR comments when `@claude` is mentioned
