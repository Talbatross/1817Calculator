# 1817 Payout Calculator — Design Spec

**Date:** 2026-06-15

## Overview

A browser-based dividend payout calculator for the 18xx game 1817. Given a revenue amount and company share count, it displays the per-share payout for each of the three payout choices: full pay, half pay, and withhold.

## Architecture

Vite + vanilla JS project. Calculation logic is kept in a pure module with no DOM access so it can be tested independently.

```
1817Calculator/
├── index.html          # Entry point, markup
├── src/
│   ├── main.js         # App init, wires input events to UI updates
│   ├── calculator.js   # Pure calculation functions (no DOM)
│   ├── ui.js           # DOM read/write functions
│   └── style.css       # All styles
├── package.json
└── vite.config.js
```

## UI & Layout

Single page, mobile-first vertical layout. Results update live on every input change — no submit button.

```
┌─────────────────────────────┐
│  1817 Payout Calculator     │
├──────────────┬──────────────┤
│ Revenue  $__ │ Shares  10 ▾ │
├──────────────┴──────────────┤
│ 🟢 Full Pay          $7/sh  │
│ 🟡 Half Pay          $4/sh  │
│ 🔴 Withhold          $0/sh  │
└─────────────────────────────┘
```

- Revenue: number input, step $10, min $0
- Shares: `<select>` with options 2, 5, 10 — defaults to 10
- Result rows are color-coded: green (full), amber (half), red (withhold)
- When revenue is 0 or empty, all rows display `—`

## Calculation Logic

All functions in `calculator.js` take `(revenue, shares)` and return a per-share dollar amount.

**Full pay:**
```
perShare = revenue / shares
```

**Half pay (10-share companies):**
```
withheld = floor(revenue / 20) * 10
payout   = revenue - withheld
perShare = payout / 10
```
Withheld rounds down to the nearest $10; payout gets the remainder.

Example: $70 revenue → withheld $30, payout $40, **$4/share**

**Half pay (2-share and 5-share companies):**
```
perShare = (revenue / 2) / shares
```
No rounding needed — all values work out cleanly given 1817 revenue track values.

**Withhold:**
```
perShare = 0
```

## Error Handling

- Revenue defaults to 0 on load; all rows show `—`
- Revenue input rejects negative values
- Share count is a fixed dropdown — no validation needed
- No server, no persistence, no async — nothing else to fail

## Testing

Vitest unit tests covering `calculator.js`:

| Case | Input | Expected |
|---|---|---|
| Full pay, 10-share | $70, 10 | $7/share |
| Half pay, 10-share | $70, 10 | $4/share |
| Half pay, 10-share (even) | $60, 10 | $3/share |
| Half pay, 5-share | $60, 5 | $6/share |
| Half pay, 2-share | $60, 2 | $15/share |
| Withhold | any | $0/share |
