# Openfeld

**[isthefeldopen.com](https://isthefeldopen.com)** is a single-page website that answers one question: _Is Tempelhof Feld in Berlin currently open?_

It takes the visitor's current time, compares it against a hardcoded table of monthly opening and closing times, and displays open or closed status with a countdown timer.

## Tech Stack

- **Framework:** [Astro](https://astro.build/) (single `.astro` page, no additional UI framework)
- **Hosting:** Cloudflare Workers
- **Package manager:** pnpm
- **Node.js:** >= 22.12.0
- **Repo:** GitHub with automated CI/CD via GitHub Actions

No React, Vue, Svelte, or any JS framework. No Tailwind or any CSS framework — plain CSS only.

## Coding Standards

- All CSS lives in a single `<style>` tag within the Astro component
- All JavaScript lives inline in a `<script>` tag within the Astro component
- Use native HTML elements wherever possible (e.g. native popover API for the info drawer)
- Use semantic HTML for time and date display (e.g. `<time>` element)
- Accessibility and WCAG contrast standards must be maintained throughout
- CSS custom properties (variables) should be used for theming, especially for the open/closed colour schemes

## Hours Data Structure

Monthly opening and closing times are stored as a JavaScript object directly in the Astro template:

```js
const hours = {
  january: { open: "06:00", close: "20:00" },
  february: { open: "06:00", close: "20:30" },
  march: { open: "06:00", close: "21:00" },
  april: { open: "06:00", close: "21:30" },
  may: { open: "06:00", close: "22:00" },
  june: { open: "06:00", close: "22:30" },
  july: { open: "06:00", close: "22:30" },
  august: { open: "06:00", close: "22:00" },
  september: { open: "06:00", close: "21:30" },
  october: { open: "06:00", close: "20:30" },
  november: { open: "06:00", close: "20:00" },
  december: { open: "06:00", close: "20:00" },
};
```

> **Note:** A future enhancement may replace this with an internal API (see [#11](https://github.com/cartogram/openfeld/issues/11)).

## Development

```sh
# Install dependencies
pnpm install

# Start dev server at localhost:4321
pnpm dev

# Production build to ./dist/
pnpm build

# Preview production build locally
pnpm preview

# Add an Astro integration
pnpm astro add <integration>
```

## Testing

- **Playwright** smoke test to verify the page renders and core functionality works
- **Astro linter/formatter** for code consistency
- Both must pass before any PR can be merged

```sh
# Run tests (once configured)
pnpm test
```

## GitHub Actions Workflows

- **Lint and test** — runs on every pull request; blocks merge if failing
- **Deploy** — deployment to Cloudflare Workers runs only on merge to `main`
- **Claude Code** — runs on issues and PR comments when `@claude` is mentioned

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards above
3. Ensure linting and tests pass locally
4. Open a pull request — CI must be green before merging
