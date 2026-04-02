#!/bin/bash
set -euo pipefail

REPO="cartogram/is-the-feld-open"

echo "🏗️  Setting up labels, milestones, and issues for $REPO"
echo ""

# ── Labels ────────────────────────────────────────────────────────────────────
echo "Creating labels..."
gh label create "type: documentation" --repo "$REPO" --color "0075ca" --description "Documentation tasks" --force
gh label create "type: feature"       --repo "$REPO" --color "a2eeef" --description "New feature" --force
gh label create "type: design"        --repo "$REPO" --color "d4c5f9" --description "Design tasks" --force
gh label create "type: spike"         --repo "$REPO" --color "e4e669" --description "Spike / exploration" --force
gh label create "size: S"             --repo "$REPO" --color "c5def5" --description "Small" --force
gh label create "size: M"             --repo "$REPO" --color "bfd4f2" --description "Medium" --force
gh label create "size: L"             --repo "$REPO" --color "9fc5e8" --description "Large" --force
echo "✅ Labels created"
echo ""

# ── Milestones ────────────────────────────────────────────────────────────────
echo "Creating milestones..."
gh api repos/$REPO/milestones --method POST -f title="v1" -f description="Initial launch" -f state="open" 2>/dev/null || echo "  (v1 may already exist)"
gh api repos/$REPO/milestones --method POST -f title="v2" -f description="Post-launch enhancements" -f state="open" 2>/dev/null || echo "  (v2 may already exist)"
gh api repos/$REPO/milestones --method POST -f title="backlog" -f description="Future work — not scheduled" -f state="open" 2>/dev/null || echo "  (backlog may already exist)"
echo "✅ Milestones created"
echo ""

# Helper: look up milestone number by title
milestone_number() {
  gh api repos/$REPO/milestones --jq ".[] | select(.title==\"$1\") | .number"
}

V1=$(milestone_number "v1")
V2=$(milestone_number "v2")
BACKLOG=$(milestone_number "backlog")

echo "Milestone numbers: v1=$V1  v2=$V2  backlog=$BACKLOG"
echo ""

# ── Issues ────────────────────────────────────────────────────────────────────
echo "Creating issues..."

# Issue 1
gh issue create --repo "$REPO" \
  --title "Create README and project documentation" \
  --label "type: documentation,size: S" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Create a comprehensive README that documents the project purpose, tech stack, coding standards, and development workflow. This document will serve as the source of truth for any developer or AI agent working on the project, ensuring consistency in approach and code quality.

## Details

The README should cover the following:

### Project overview
- **isthefeldopen.com** is a single-page website that answers one question: *Is Tempelhof Feld in Berlin currently open?*
- It takes the visitor's current time, compares it against a hardcoded table of monthly opening and closing times, and displays open or closed status with a countdown timer.

### Tech stack
- **Framework:** Astro (single `.astro` page, no additional UI framework)
- **Hosting:** Cloudflare Workers
- **Repo:** GitHub with automated CI/CD via GitHub Actions
- No React, Vue, Svelte, or any JS framework
- No Tailwind or any CSS framework — plain CSS only

### Coding standards
- All CSS lives in a single `<style>` tag within the Astro component
- All JavaScript lives inline in a `<script>` tag within the Astro component
- Use native HTML elements wherever possible (e.g. native popover API for the info drawer)
- Use semantic HTML for time and date display (e.g. `<time>` element)
- Accessibility and WCAG contrast standards must be maintained throughout
- CSS custom properties (variables) should be used for theming, especially for the open/closed colour schemes

### Hours data structure
Monthly opening and closing times are stored as a JavaScript object directly in the Astro template:

```js
const hours = {
  january:  { open: "06:00", close: "20:00" },
  february: { open: "06:00", close: "20:30" },
  march:    { open: "06:00", close: "21:00" },
  // etc.
};
```

> Note: A future enhancement (see #11) may replace this with an internal API

### Testing
- Playwright smoke test to verify the page renders and core functionality works
- Astro linter/formatter for code consistency
- Both must pass before any PR can be merged

### GitHub Actions workflows
- Lint and test run on every pull request (blocks merge if failing)
- Deployment to Cloudflare Workers runs only on merge to `main`

## Acceptance Criteria

- [ ] README exists at the root of the repo
- [ ] Covers project overview, tech stack, and coding standards
- [ ] Documents the hours data structure with an example
- [ ] Documents the testing setup and how to run tests locally
- [ ] Documents the GitHub Actions workflows and deployment process
- [ ] Any developer or AI agent can read this and understand how to contribute
EOF
)"
echo "  ✅ Issue 1 created"

# Issue 2
gh issue create --repo "$REPO" \
  --title "Set up Astro project with Cloudflare Workers" \
  --label "type: feature,size: S" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Scaffold the Astro project and configure it for deployment on Cloudflare Workers. This is the foundational setup issue — all other development issues depend on this being completed first.

## Details

- Initialise a new Astro project using the CLI
- Install and configure the Cloudflare Workers adapter for Astro (`@astrojs/cloudflare`)
- Set up `wrangler.toml` for Cloudflare Workers deployment configuration
- Create a single `src/pages/index.astro` file as the only page
- Confirm that `npm run dev` runs locally and `npm run build` produces a Workers-compatible output
- Push to GitHub and confirm the repo is correctly structured

## Acceptance Criteria

- [ ] Astro project scaffolded and committed to GitHub
- [ ] Cloudflare Workers adapter installed and configured
- [ ] `wrangler.toml` present with correct configuration
- [ ] `npm run dev` serves the site locally without errors
- [ ] `npm run build` produces a build without errors
- [ ] Single `index.astro` page exists at `src/pages/index.astro`
EOF
)"
echo "  ✅ Issue 2 created"

# Issue 3
gh issue create --repo "$REPO" \
  --title "Hardcode monthly hours table as JavaScript object" \
  --label "type: feature,size: S" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Add the Tempelhof Feld opening and closing hours for each month of the year as a hardcoded JavaScript object inside the Astro page. This is the core data that all status and countdown logic will depend on, so it should be in place before building any display components.

**Depends on:** #2

## Details

- Research and verify the current official opening and closing times for Tempelhof Feld for each month
- Official source: [tempelhofer-feld.berlin.de](https://tempelhofer-feld.berlin.de)
- Store the data as a JavaScript object inside a `<script>` tag in `index.astro`
- Each month entry should include `open` and `close` times in 24-hour format (e.g. `"06:00"`, `"21:30"`)
- Example structure:

```js
const HOURS = {
  0:  { open: "06:00", close: "20:00" }, // January
  1:  { open: "06:00", close: "20:30" }, // February
  2:  { open: "06:00", close: "21:00" }, // March
  // ... all 12 months
};
```

- Add a comment above the object noting the source and last verified date

## Acceptance Criteria

- [ ] All 12 months are represented in the hours object
- [ ] Opening and closing times are accurate and sourced from the official Tempelhof website
- [ ] Times are in 24-hour format as strings
- [ ] A comment notes the source URL and date last verified
- [ ] Object is defined in the `<script>` tag of `index.astro`
EOF
)"
echo "  ✅ Issue 3 created"

# Issue 4
gh issue create --repo "$REPO" \
  --title "Build core open/closed status display with colour scheme" \
  --label "type: feature,size: M" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Build the primary UI of the page — a clear display showing whether Tempelhof Feld is currently open or closed. The page should read the visitor's local time, compare it to the hours table, and display the result. The colour scheme of the entire page should shift based on the status.

**Depends on:** #3

## Details

### Page structure
- Centred title at the top: "Is Tempelhof Feld open?"
- Large, clear status display: "Open" or "Closed"
- Info link at the bottom (see #6 for the info drawer)

### Status logic
- On page load, read the visitor's current local time using `new Date()`
- Look up the current month in the `HOURS` object
- Compare current time to `open` and `close` times
- Display "Open" or "Closed" accordingly

### Colour scheme using CSS variables
- Define CSS custom properties for the colour scheme at the `:root` level
- Apply an `[data-status="open"]` or `[data-status="closed"]` attribute to the `<body>` or root element
- When open: use a warmer, inviting palette (exact colours TBD by design)
- When closed: use a cooler, more muted palette (exact colours TBD by design)
- Example:

```css
:root {
  --color-bg: #f5f5f0;
  --color-text: #1a1a1a;
  --color-accent: #4a7c59;
}
[data-status="closed"] {
  --color-bg: #1a1a2e;
  --color-text: #e0e0e0;
  --color-accent: #7c4a4a;
}
```

- All colour usage throughout the page should reference these CSS variables

### Accessibility
- All text must meet WCAG AA contrast ratios in both open and closed states
- Status must be communicated accessibly (not colour alone) — use text and/or ARIA attributes

## Acceptance Criteria

- [ ] Page displays "Open" or "Closed" based on the visitor's current local time
- [ ] Status is determined by comparing current time to the correct month's hours in `HOURS`
- [ ] CSS custom properties are used for all colours
- [ ] `data-status` attribute on root element switches between `open` and `closed`
- [ ] Colour scheme visually changes between open and closed states
- [ ] Both colour schemes pass WCAG AA contrast requirements
- [ ] Status is communicated accessibly, not by colour alone
EOF
)"
echo "  ✅ Issue 4 created"

# Issue 5
gh issue create --repo "$REPO" \
  --title "Implement countdown timer" \
  --label "type: feature,size: M" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Add a live countdown timer below the open/closed status display. When the field is open, it counts down to closing time. When closed, it counts down to the next opening time. The timer should update every second.

**Depends on:** #4

## Details

- Display format: `HH:MM:SS` or natural language like `2h 34m 12s` — choose whichever reads more clearly
- Use `<time>` element with a `datetime` attribute for semantic HTML and accessibility
- Timer logic:
  - If open: calculate time remaining until `close` time today
  - If closed: calculate time remaining until `open` time tomorrow (or today if not yet opened)
  - Handle edge cases: midnight crossover, days where hours differ
- Update every second using `setInterval`
- Label above the countdown should contextualise it: e.g. "Closes in" or "Opens in"

## Acceptance Criteria

- [ ] Countdown displays correctly when the field is open (counts to close time)
- [ ] Countdown displays correctly when the field is closed (counts to open time)
- [ ] Timer updates every second
- [ ] Uses `<time>` element with a valid `datetime` attribute
- [ ] Handles edge cases: before opening time, after closing time, midnight crossover
- [ ] Label correctly reads "Closes in" or "Opens in" depending on status
EOF
)"
echo "  ✅ Issue 5 created"

# Issue 6
gh issue create --repo "$REPO" \
  --title "Build info drawer using native popover API" \
  --label "type: feature,size: M" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Add an "Info" link at the bottom of the page that, when clicked, opens an info panel using the native HTML popover API. The panel should display the full yearly hours table, a short history of Tempelhof, and relevant links.

**Depends on:** #3, #4

## Details

### Trigger
- A simple text link at the bottom of the page: "Info"
- Uses the native HTML popover API — no JavaScript modal libraries
- Example markup:

```html
<button popovertarget="info-panel">Info</button>
<div id="info-panel" popover>...</div>
```

### Info panel content

1. **Full yearly hours table** — all 12 months with open and close times, formatted clearly
2. **Short paragraph about Tempelhof Feld:**
   - Brief history: formerly Tempelhof Airport, one of the world's earliest commercial airports
   - Closed in 2008, reopened as a public urban park in 2010
   - Now one of Berlin's largest and most beloved open spaces
3. **Links section:**
   - Link to Matthew's personal website (URL TBD — add placeholder)
   - Link to TPH 100% website (the organisation that advocates for keeping Tempelhof as a public park)
   - Note that TPH 100% accepts donations — frame the link to encourage this

### Accessibility
- Popover should be keyboard accessible (open and close with keyboard)
- Focus should move into the popover when opened
- ESC key should close it (this is default popover behaviour)
- Use semantic HTML inside the panel (headings, `<table>` for hours, etc.)

## Acceptance Criteria

- [ ] "Info" link at the bottom of the page
- [ ] Clicking opens a panel using the native HTML popover API (no JS modal library)
- [ ] Panel displays the full 12-month hours table
- [ ] Panel includes a short history paragraph about Tempelhof
- [ ] Panel includes links to Matthew's personal site and TPH 100%
- [ ] TPH 100% link is framed to encourage donations
- [ ] Popover is keyboard accessible and closeable with ESC
- [ ] Uses semantic HTML inside the panel
EOF
)"
echo "  ✅ Issue 6 created"

# Issue 7
gh issue create --repo "$REPO" \
  --title "Set up GitHub Actions for CI/CD" \
  --label "type: feature,size: S" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Set up two GitHub Actions workflows: one that runs linting and tests on every pull request (blocking merge if they fail), and one that deploys to Cloudflare Workers when a PR is merged to `main`.

**Depends on:** #2

## Details

### Workflow 1: PR checks (lint + test)
- **Triggers on:** every pull request to `main`
- **Steps:**
  1. Checkout code
  2. Install dependencies
  3. Run Astro linter/formatter check
  4. Run Playwright smoke tests
- If any step fails, the PR is blocked from merging
- **File:** `.github/workflows/ci.yml`

### Workflow 2: Deploy to Cloudflare
- **Triggers on:** push to `main` (i.e. merged PR)
- **Steps:**
  1. Checkout code
  2. Install dependencies
  3. Build Astro project
  4. Deploy to Cloudflare Workers using Wrangler
- Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to be set as GitHub repository secrets
- **File:** `.github/workflows/deploy.yml`

### Playwright smoke test
A basic smoke test at `tests/smoke.test.ts` that:
- Visits the page
- Confirms the page title/heading is present
- Confirms either "Open" or "Closed" text is visible
- Confirms the countdown timer is visible and updating

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` exists and runs lint + tests on every PR
- [ ] `.github/workflows/deploy.yml` exists and deploys on merge to `main`
- [ ] A failing lint check blocks a PR from merging
- [ ] A failing Playwright test blocks a PR from merging
- [ ] Deployment only runs on `main`, not on PRs
- [ ] Cloudflare credentials are stored as GitHub secrets (not hardcoded)
- [ ] Basic Playwright smoke test exists and passes
EOF
)"
echo "  ✅ Issue 7 created"

# Issue 8
gh issue create --repo "$REPO" \
  --title "Design logo" \
  --label "type: design,size: S" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Design a logo for isthefeldopen.com that captures the essence of Tempelhof Feld as both an airport and an urban park.

## Details

### Concept
- A circle representing the outer boundary/perimeter path of the Feld
- Two lines through the circle representing the two runways that cross the field
- The result should read as both an abstract symbol and a subtle aerial-view map of the park
- Simple, minimal, geometric — should work at small sizes (favicon) and large sizes (header)

### Deliverables
- SVG format (scalable)
- Should work in both open and closed colour scheme contexts (consider using `currentColor` so it inherits CSS variable colours)
- Optionally: a version with the text "isthefeldopen" alongside the mark

### Reference
- Look at aerial/satellite images of Tempelhof Feld on Google Maps for reference on runway positions and the circular perimeter path

## Acceptance Criteria

- [ ] Logo delivered as SVG
- [ ] Design includes circle + two runway lines as described
- [ ] Works at small (16px favicon) and large sizes
- [ ] Uses `currentColor` or CSS variables so it adapts to open/closed colour schemes
- [ ] Visually minimal and clean
EOF
)"
echo "  ✅ Issue 8 created"

# Issue 9
gh issue create --repo "$REPO" \
  --title "Design background graphics" \
  --label "type: design,size: M" \
  --milestone "v1" \
  --body "$(cat <<'EOF'
## Description

Design a subtle background for the page that evokes the texture and aerial view of Tempelhof Feld without interfering with readability or accessibility.

## Details

### Layer 1: Concrete grain texture
- A subtle noise/grain texture that references the concrete and tarmac surfaces of the airfield
- Should be very low opacity — purely atmospheric, not distracting
- Consistent across the entire page background
- Can be implemented as an SVG filter, CSS filter, or a small repeating PNG

### Layer 2: Abstract SVG shapes
- Abstract shapes inspired by an aerial view of Tempelhof Feld (as seen on Google Earth/Maps)
- Should hint at — but not literally reproduce — the following features:
  - The two runways
  - The curved perimeter path
  - The terminal building and surrounding structures
  - Other structural landmarks and dividing areas within the park
- Style: collage-blob aesthetic — organic, slightly abstract shapes, not technical diagrams
- Impressionistic rather than photorealistic
- Fixed position — does not scroll with the page content
- Low opacity / subtle — the background should support the content, not compete with it

### Accessibility requirements
- Background must not reduce the contrast of any text below WCAG AA standards
- Must not interfere with legibility of the open/closed status or countdown
- Test both open and closed colour schemes to ensure contrast is maintained in both

## Acceptance Criteria

- [ ] Grain texture layer implemented at a subtle, non-distracting opacity
- [ ] SVG shape layer implemented with abstract Tempelhof-inspired shapes
- [ ] Shapes are fixed-position (do not scroll)
- [ ] Background does not reduce any text contrast below WCAG AA
- [ ] Both open and closed colour scheme variants tested for accessibility
- [ ] Overall effect is atmospheric and evocative, not distracting
EOF
)"
echo "  ✅ Issue 9 created"

# Issue 10
gh issue create --repo "$REPO" \
  --title "Add multilingual support using DeepL" \
  --label "type: feature,size: M" \
  --milestone "v2" \
  --body "$(cat <<'EOF'
## Description

Add multilingual support to isthefeldopen.com, with German as the primary additional language given the site's Berlin context. Use the DeepL API for translations.

## Details

- Since Tempelhof is in Berlin, German (`de`) should be the first language added after English
- Consider using Astro's i18n routing or a simple manual approach given the site's small scope
- Use the DeepL API to produce translations — do not use machine-translated strings without review
- A language toggle should be accessible and not clutter the minimal UI
- All translatable strings should be extracted into a single locale file (e.g. `src/i18n/en.ts`, `src/i18n/de.ts`)
- The open/closed status, countdown label, info panel content, and all UI text should be translated

## Acceptance Criteria

- [ ] Site is available in English and German at minimum
- [ ] Language toggle is present in the UI and accessible
- [ ] All UI strings are extracted into locale files
- [ ] Translations produced or reviewed using DeepL
- [ ] Info panel history paragraph is translated
- [ ] Correct language is detected or remembered between visits
EOF
)"
echo "  ✅ Issue 10 created"

# Issue 11
gh issue create --repo "$REPO" \
  --title "Internal API for hours data" \
  --label "type: spike,size: L" \
  --milestone "backlog" \
  --body "$(cat <<'EOF'
## Description

Replace the hardcoded hours JavaScript object with a public API endpoint that serves the hours data and can accept a timestamp to return open/closed status. This would make the site more maintainable and allow other tools or integrations to consume the data.

## Details

### Background
- In v1, the hours data is hardcoded as a JS object in `index.astro` (see #3)
- This works fine for a simple site but makes updates require a code deployment
- A public API would allow the data to be consumed by other projects or apps

### Proposed API design

Using Astro's native endpoint system (`src/pages/api/`):

**GET `/api/hours`**
Returns the full hours table for all 12 months:
```json
{
  "hours": {
    "january":  { "open": "06:00", "close": "20:00" },
    "february": { "open": "06:00", "close": "20:30" },
    ...
  }
}
```

**POST `/api/status`**
Accepts a timestamp in the request body; returns whether the field is open or closed at that moment, plus closing/opening time and time remaining:

Request body:
```json
{ "timestamp": "2025-04-02T14:30:00+02:00" }
```

Response:
```json
{
  "status": "open",
  "closes_at": "21:00",
  "time_remaining": "06:29:45"
}
```

### Implementation notes
- Astro endpoints are created as `.ts` files in `src/pages/api/`
- Export named functions matching HTTP methods: `export const GET`, `export const POST`
- Since the site runs on Cloudflare Workers, endpoints will be server-side (not static)
- This API should be public so other tools and projects can use it
- Consider CORS headers so it can be called from other origins

### Spike questions to answer
- Does Astro's Cloudflare adapter support server-side API routes in this configuration?
- Should the hours data be stored in a Cloudflare KV store to allow updates without redeployment?
- What rate limiting, if any, is needed for a public API?

## Acceptance Criteria

- [ ] `GET /api/hours` returns the full 12-month hours table as JSON
- [ ] `POST /api/status` accepts a timestamp and returns open/closed status, closing/opening time, and time remaining
- [ ] Both endpoints return appropriate error responses for bad input
- [ ] CORS headers are set to allow cross-origin requests
- [ ] API is publicly accessible (no auth required)
- [ ] Endpoints are documented in the README
EOF
)"
echo "  ✅ Issue 11 created"

echo ""
echo "🎉 All done! 7 labels, 3 milestones, and 11 issues created on $REPO"
