# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Openfeld is an Astro 6 site using the minimal starter template. It uses pnpm as the package manager and requires Node.js >= 22.12.0.

## Commands

- `pnpm dev` — Start dev server at localhost:4321
- `pnpm build` — Production build to `./dist/`
- `pnpm preview` — Preview production build locally
- `pnpm astro add <integration>` — Add an Astro integration

## Architecture

- **Framework:** Astro 6 with strict TypeScript (`astro/tsconfigs/strict`)
- **Routing:** File-based routing in `src/pages/` — `.astro` and `.md` files become routes
- **Static assets:** Placed in `public/`
- **Components:** Place in `src/components/`
- **Config:** `astro.config.mjs` (currently default/empty)

## CI

GitHub Actions workflow (`.github/workflow/claude.yml`) runs Claude Code on issues and PR comments when `@claude` is mentioned.
