# Collapse/Expand Payout Tables Design

**Date:** 2026-07-03  
**Status:** Approved

## Overview

Add collapse/expand toggle buttons to the Full Pay and Half Pay share tables. Tables start collapsed by default, and the collapsed/expanded state persists across re-renders when inputs change.

## Scope

Only the Full Pay and Half Pay `.result__share-table` divs are affected. The Withhold row has no table and receives no toggle.

## Architecture

### State

A module-level object in `ui.js` tracks expand state:

```js
const tableState = { full: false, half: false }
```

`false` = collapsed (the default). State persists across re-renders because it lives at module scope, not inside any render function.

### HTML (`index.html`)

A `<button class="result__toggle">` with an inline SVG chevron is added inside `.result__header` for both Full Pay and Half Pay, to the left of the label. Attributes:

- `aria-expanded="false"` initially
- `aria-controls` pointing to the table div id (`result-full-table` / `result-half-table`)
- `aria-label` describing the action ("Toggle full pay table")

### CSS (`style.css`)

- `.result__share-table--collapsed { display: none; }` — hides the table
- `.result__toggle` — unstyled button (transparent background, no border, pointer cursor, flex alignment)
- `.result__toggle svg` — `transition: transform 0.15s ease`
- `.result__toggle--expanded svg` — `transform: rotate(90deg)` (chevron points down when expanded)

### JS (`ui.js`)

**`initToggleButtons()`** (exported, called once from `main.js` on startup):
- Wires click handlers on `#toggle-full` and `#toggle-half`
- Each handler: flips the boolean in `tableState`, toggles `.result__share-table--collapsed` on the table div, toggles `.result__toggle--expanded` on the button, updates `aria-expanded`

**`setShareTables()`** (existing, modified):
- After rendering table HTML, reads `tableState.full` / `tableState.half`
- Applies `.result__share-table--collapsed` and sets `aria-expanded` on the button to match current state

## File Changes

| File | Change |
|------|--------|
| `index.html` | Add `<button class="result__toggle">` with SVG chevron to Full Pay and Half Pay headers |
| `src/style.css` | Add toggle button styles, collapsed class, chevron rotation transition |
| `src/ui.js` | Add `tableState`, export `initToggleButtons()`, update `setShareTables()` |
| `src/main.js` | Import and call `initToggleButtons()` on startup |
