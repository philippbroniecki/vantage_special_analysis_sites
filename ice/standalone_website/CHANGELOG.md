# ICE Standalone Website Changelog

## 2026-03-04

### Updated
- Demographic comparison UI now uses a single paired row controlled by two selectors:
  - `Demographic` (default `Party`) with options in exact order:
    `Party`, `Gender`, `Age`, `Race`, `Education`, `Rural/Urban/Suburban`, `Income`, `Religion`
  - `Mode` for investigations only with:
    - `Confident (normalized)` (default)
    - `Not confident (normalized)`
- Demographic cards are always side-by-side:
  - Left: ICE enforcement (raw category-based metrics)
  - Right: ICE investigations (normalized mode metric)
- Investigations normalization now consistently excludes `Unsure or not familiar with this event` from the denominator for:
  - Demographic comparisons
  - State ranking series
  - Crosstabs metrics
- Investigations crosstabs now expose exactly two derived metrics:
  - `confident_norm` (default)
  - `not_confident_norm`
- Embedded fallback JSON in `index.html` is synced to the current `ice_data.json` schema, including `demographic_controls`, for correct `file://` behavior.

### Validation
- Rebuilt outputs:
  - `Rscript --vanilla ice/R/build_standalone_website_data.R`
  - `Rscript --vanilla ice/R/build_crosstabs_data.R`
- Verified schema/data integrity:
  - `Rscript --vanilla ice/R/verify_standalone_outputs.R`

## 2026-03-03

### Added
- New standalone ICE site at `ice/standalone_website/index.html` in the report2_js style used by the Iran standalone site.
- Two topline question cards with the exact required question text and answer-category labels:
  - ICE enforcement (4 categories)
  - ICE investigations (5 categories)
- Paired demographic comparison layout organized by dimension:
  - Age, Party ID, Gender, Geography (Rural/Suburban/Urban)
  - Each dimension renders enforcement and investigations side-by-side, each with a metric selector.
- State ranking component with question toggle:
  - Enforcement rankings by any of the 4 enforcement categories.
  - Investigations rankings by derived categories:
    - `Confident = Very confident + Somewhat confident`
    - `Not confident = Not very confident + Not confident at all`
    - `Unsure or not familiar` as an additional selectable view.
- Stacked crosstabs explorers (enforcement first, investigations second) using the same heatmap interaction pattern as Iran.
- Runtime base-path logic for JSON fetches supporting both:
  - `/ice/standalone_website/`
  - root-style deployments
- Embedded fallback report data inside `index.html` for `file://` opening.

### Data Build Scripts
- Added `ice/R/ice_standalone_helpers.R` (shared path/schema/mapping helpers).
- Added `ice/R/build_standalone_website_data.R` to generate:
  - `ice/standalone_website/data/ice_data.json`
- Added `ice/R/build_crosstabs_data.R` to generate:
  - `ice/standalone_website/data/ice_crosstabs.json`
- Added `ice/R/verify_standalone_outputs.R` for fast JSON integrity checks.

### Validation
- Internal checks were added in both build scripts to ensure required keys exist and required sections are non-empty.
- Confirmed generated payload counts are non-zero for both questions.
- Standalone verification can be run with:
  - `Rscript --vanilla ice/R/verify_standalone_outputs.R`

### Run Instructions
From repo root:

```bash
Rscript --vanilla ice/R/build_standalone_website_data.R
Rscript --vanilla ice/R/build_crosstabs_data.R
python3 -m http.server 8000
# open http://localhost:8000/ice/standalone_website/
```
