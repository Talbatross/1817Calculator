# Single & Double Jump Analysis — Design Spec
**Date:** 2026-10-05

## Overview

Extend the existing Double Jump section to analyze both **Single Jumps** and **Double Jumps**. For each jump, show the best pay type (Full Pay or Half Pay) that achieves it.

Supersedes the UI portion of `2026-06-29-double-jump-design.md`. The loan/price-step/cash mechanics in the current `analyzeDoubleJump` stay as they are.

## Mechanic

The current analysis (in `calculator.js`) becomes generic over a jump multiplier:

- **Single jump:** payout counted toward threshold ≥ `1 × adjustedPrice`
- **Double jump:** payout counted toward threshold ≥ `2 × adjustedPrice`

The rest does not change: each new loan moves the price one step left on `STOCK_PRICES`; new loans are capped at `shares − existingLoans`; `endCash = cash + withheld + treasuryDividend − existingInterest − newInterest`; the jump is possible when the threshold is met and `endCash ≥ 0`, using the fewest loans that achieve it.

## Choosing the Best Pay Type

For each jump, run the analysis for Full Pay and Half Pay, then pick:

1. Only pay types where `possible === true`
2. Fewest `loansNeeded`
3. Tie → higher `endCash`
4. Still tied → Full Pay

If neither is possible, there is no best option.

## Architecture

Pure math in `calculator.js`, DOM in `ui.js`, wiring in `main.js` (existing pattern).

### `calculator.js`
- Rename `analyzeDoubleJump(...)` → `analyzeJump(..., price, multiplier)`; `totalTarget = adjustedPrice * multiplier`.
- Replace `fullPayDoubleJumpAnalysis` / `halfPayDoubleJumpAnalysis` with:
  - `fullPayJumpAnalysis(revenue, company, price, multiplier)`
  - `halfPayJumpAnalysis(revenue, company, price, multiplier)`
- New `bestJumpOption(fullAnalysis, halfAnalysis)` → `{ payType: 'Full Pay' | 'Half Pay', analysis }` or `null`.

### `ui.js`
- `setDoubleJumps` → `setJumps(singleJump, doubleJump, rate)`. Each argument is `{ label, totalTarget, best, full, half }`, where `full`/`half` are the analyses and `best` is the `bestJumpOption` result, already computed in `main.js`. `ui.js` does no math.
- `clearDoubleJump` → `clearJumps`.
- Card title: `Single Jump (≥ $X total)` / `Double Jump (≥ $Y total)`. X/Y is the unadjusted target (`price × multiplier`).
- **Possible:** header status `Possible ✓ — <Pay Type>`; the body reuses the existing possible body (loans line + breakdown) for the chosen analysis.
- **Not possible:** header status `Not Possible ✗`; the body has two reason lines, one per pay type, each prefixed `Full Pay: ` / `Half Pay: `, using the existing reason text.

### `index.html`
- Container `#double-jump` → `#jumps`.
- Input section label "Double Jump" → "Stock Jumps". The price select is unchanged.

### `style.css`
- Rename the `#double-jump` selectors to `#jumps`. Reuse the existing `.dj__*` card classes.

### `main.js`
- When `price > 0` and revenue > 0: compute full/half analyses for multipliers 1 and 2, resolve the best option for each, and call `setJumps`. Otherwise call `clearJumps`.

## Edge Cases

- If a double jump is possible, a single jump is too; both cards are still shown.
- Price $40 (the floor): loans cannot lower the price further, so the existing behavior holds.
- shares = 2: treasury is forced to 0, same as now.
- Neither pay type possible: the card shows both reasons.

## Testing

- Existing double-jump tests move to the new functions with `multiplier = 2`, and their expectations stay the same.
- New single-jump tests (`multiplier = 1`): possible without loans, possible with a loan (price drop), not possible.
- `bestJumpOption` tests: fewer loans wins; tie → more end cash wins; full tie → Full Pay; only one possible; neither possible → `null`.

## Out of Scope

- Triple or greater jumps
- Withhold (pays no dividend)
