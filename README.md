# Openfeld

**[isthefeldopen.com](https://isthefeldopen.com)** is a single-page website that answers one question: _Is Tempelhof Feld in Berlin currently open?_

It takes the visitor's current time, compares it against monthly opening and closing times, and displays open or closed status with a countdown timer. It also exposes a public API for other tools and integrations to consume the hours data.

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

## API

The site exposes a public JSON API. CORS is enabled for all origins.

### `GET /api/hours`

Returns the full 12-month hours table:

```json
{
  "hours": {
    "january": { "open": "07:30", "close": "17:00" },
    "february": { "open": "07:00", "close": "18:00" },
    "may": {
      "open": "06:00",
      "close": "21:30",
      "late_close": "22:00",
      "split_day": 16
    }
  }
}
```

Some months include `late_close` and `split_day` fields when closing times change partway through the month.

### `POST /api/status`

Accepts a timestamp and returns whether the field is open or closed at that moment:

**Request:**

```json
{ "timestamp": "2025-07-15T12:00:00+02:00" }
```

**Response (open):**

```json
{
  "status": "open",
  "closes_at": "23:00",
  "time_remaining": "11:00:00"
}
```

**Response (closed):**

```json
{
  "status": "closed",
  "opens_at": "06:00",
  "time_remaining": "02:30:00"
}
```

Returns `400` for missing, non-string, or unparseable timestamps.

## Hours Data

Monthly opening and closing times are stored in `src/data/hours.ts` and shared between the frontend UI and the API endpoints.

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
