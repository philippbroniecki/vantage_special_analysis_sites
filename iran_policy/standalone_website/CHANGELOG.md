# report2_js — Design Changelog

A complete visual redesign of the `report_js` interactive report. Content, data values,
and chart logic are preserved exactly; all changes are design/presentation improvements.

---

## Design System Changes

### Token system (CSS custom properties)
- Expanded from ~15 to ~30 design tokens covering shadows, radii, tints, and easing
- Added `--shadow-card` / `--shadow-raise` layered shadow system (ambient + cast + ring)
  replacing the single `--shadow` variable — produces more realistic depth on cards
- Added `--r-xs` through `--r-full` radius scale for consistent rounding across elements
- Added `--accent-tint` / `--accent-tint2` for subtle background fills on interactive elements
- Added `--muted-faint` for tertiary text (rank numbers, mini tags)
- Added `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` for snappier spring-like motion
- Theme transition properties defined per-element (`transition: ... 280ms ease`) for smooth
  dark/light switching without flash

### Dark mode refinements
- Deeper background stack: `#0c1520` → `#07101a` (more contrast with surface cards)
- Cleaner surface hierarchy: surface / surface-alt / surface-hi are more visually distinct
- Accent color adjusted to `#48b4be` (slightly warmer teal vs `#5eb1bb` original)
- Line/border colors tuned for better legibility in dark context
- Hero gradient swapped to darker navy range to avoid wash-out at small sizes

---

## Layout & Responsive Changes

### Max-width and spacing
- Layout max-width increased from 1040px → 1100px (better use of laptop/desktop width)
- Layout gap increased from `1rem` → `1.35rem` for better section breathing room
- Card padding increased from `1rem 1.1rem` → `1.5rem 1.7rem` for more internal whitespace
- Section heading margin-bottom increased from `0.7rem` → `1.1rem`

### Topbar
- Now a **frosted glass** sticky bar using `backdrop-filter: blur(18px) saturate(1.6)`
  with a thin `border-bottom` — matches modern app navigation patterns
- Brand mark: small teal dot with a subtle `box-shadow` ring replaces bare text
- Toggle button: card-shadow pill with smooth hover lift (translateY + shadow upgrade)
  showing sun/moon Unicode icons (☀ / ☾) with Light/Dark label
- Height increased from implicit → explicit 54px for predictable layout

### Hero card
- Padding increased to `2.1rem 2.2rem` from `1.4rem 1.5rem`
- Two decorative radial-gradient orbs via `::before` / `::after` pseudo-elements
  (teal top-right, warm bottom-center) for visual depth without images
- H1 gets `max-width: 660px` and `letter-spacing: -0.025em` for editorial feel
- Survey metadata: plain inline text → **pill tags** with semi-transparent
  border/background for a structured, modern meta row

### Demographic 2×2 grid
- Breakpoint changed from 980px → 880px (keeps 2-col layout on more laptop sizes)
- Bar track height increased from `0.64rem` → `7px` (more readable, heavier visual weight)
- Label column: `210px` fixed → `minmax(120px, 11rem)` for adaptive, truncation-safe labels
- Section eyebrow label added above each card's H2 (Party ID / Generational / Gender / Geography)

---

## Component Changes

### Survey question card
- Option rows: text-above-bar layout → **grid with value on right** (`1fr 52px`)
  so percentage is always visible without wrapping
- Question text displayed in a styled `<blockquote>` with a 3px left border (accent color)
  and a subtle tinted background — elevates the quote visually
- Option label font size increased from `0.83rem` → `0.84rem` with better line-height

### Archetype section
- Each archetype row now has a **colored left border** (3px) reflecting majority view:
  orange for majority pro-intervention, blue for majority contra — instant visual signal
- Border color uses CSS classes `.majority-pro` / `.majority-contra`
- Padding increased slightly; archetype label font increased to `0.86rem`

### State chart
- Added **rank number column** (left of state name) — easier to read as a ranked list
- Tier groups separated by **labeled dividers** with a hairline rule:
  `TOP 10` (warm/orange), `MIDDLE` (muted), `BOTTOM 10` (cool/blue)
  replacing the uniform bare list of the original
- Added `:hover` highlight on state rows for subtle interactivity
- State name column reduced from 170px to 162px (rank column takes the space)

### Takeaways section
- Converted from a plain `<ul>` to a **numbered card grid** — each takeaway is a
  flex row with a numbered badge (circular, accent-tinted) and body text
- Background/border treatment matches other surface-alt cards for visual consistency

---

## Animation & Interaction Changes

- **Scroll-reveal** via `IntersectionObserver` replaces on-load CSS animation:
  cards animate in (`opacity 0→1, translateY 14px→0`) as they enter the viewport
  rather than all firing at page load — more polished progressive disclosure
- Graceful fallback: `IntersectionObserver` not available → all cards shown immediately
- Toggle button has lift + shadow transition on hover; active state snaps back
- Theme transitions: all color/border/shadow properties transition at 280ms on element
  level — no Flash of Unstyled Content when switching theme

---

## How to Run

### Option 1 — direct file open (recommended for quick review)
Open `iran_policy/standalone_website/index.html` directly in any modern browser.
The file is fully self-contained (CSS + JS inline, no external dependencies).
Note: crosstabs explorer requires HTTP (see Option 2).

### Option 2 — local server (enables crosstabs explorer)
From the **repository root**:
```bash
python3 -m http.server 8000
```
Then open: `http://localhost:8000/iran_policy/standalone_website/`

### Option 3 — simulate Cloudflare Pages root deployment
From the standalone site directory:
```bash
cd iran_policy/standalone_website
python3 -m http.server 8001
```
Then open: `http://localhost:8001/`

### Rebuilding data from latest predictions
```bash
Rscript --vanilla iran_policy/R/build_standalone_website_data.R
Rscript --vanilla iran_policy/R/build_crosstabs_data.R
```

### Portability and public-safety note
- Frontend data URLs are now built from a runtime base path, so both
  `/iran_policy/standalone_website/` and site-root (`/`) deployments work.
- Generated JSON metadata is sanitized to avoid leaking local absolute paths.

> **Note on fonts:** The file uses the system font stack
> `'Inter', 'Avenir Next', 'Segoe UI', system-ui, sans-serif`.
> If Inter is installed locally it will be used; otherwise the system sans-serif renders.
> No external font CDN is required — the file works fully offline.

---

## Acceptance Checklist

- [x] `report_js` remains untouched
- [x] New `report2_js/index.html` created (self-contained)
- [x] Design is visibly more modern and polished
- [x] All content/data values preserved exactly
- [x] Light/dark mode works with smooth theme transitions
- [x] Frosted glass topbar, layered card shadows, pill meta tags
- [x] Archetype rows have colored left borders
- [x] State chart has tier dividers and rank numbers
- [x] Scroll-reveal animations via IntersectionObserver
- [x] Responsive at wide, laptop, and narrow widths
- [x] Works via direct file open (no server required)
