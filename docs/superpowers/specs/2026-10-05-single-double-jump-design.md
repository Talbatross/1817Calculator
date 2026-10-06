# Single & Double Jump Analysis — Design Spec
**Date:** 2026-10-05

## Overview

Extend the existing Double Jump section to analyze both **Single Jumps** and **Double Jumps** for both **Full Pay** and **Half Pay**. Show only the combinations that are possible.

Supersedes the UI portion of `2026-06-29-double-jump-design.md`. The loan/price-step/cash mechanics in the current `analyzeDoubleJump` stay as they are.

## Mechanic

The current analysis (in `calculator.js`) becomes generic over a jump multiplier:

- **Single jump:** payout counted toward threshold ≥ `1 × adjustedPrice`
- **Double jump:** payout counted toward threshold ≥ `2 × adjustedPrice`

The rest does not change: each new loan moves the price one step left on `STOCK_PRICES`; new loans are capped at `shares − existingLoans`; `endCash = cash + withheld + treasuryDividend − existingInterest − newInterest`; the jump is possible when the threshold is met and `endCash ≥ 0`, using the fewest loans that achieve it.

## Display

Four combinations are evaluated, in this order:

1. Double Jump — Full Pay
2. Double Jump — Half Pay
3. Single Jump — Full Pay
4. Single Jump — Half Pay

- Each **possible** combination gets one card (green header, as now):
  - Title: `<Jump> — <Pay Type> (≥ $X total)`, where X is the unadjusted target `price × multiplier`
  - Body: the existing loans line plus the remaining-cash breakdown (unchanged)
- **Impossible** combinations are not rendered.
- If a pay type's Double Jump is possible with **no new loans**, that pay type's Single Jump is not rendered: paying that amount forces the double jump, so a single jump is not a choice. If the Double Jump needs loans, the Single Jump is still shown, since the player can choose not to take them.
- If **none** are possible, show a single line: `No jumps possible`.
- The section stays hidden when price is unset or revenue is 0 (unchanged).

## Architecture

Pure math in `calculator.js`, DOM in `ui.js`, wiring in `main.js` (existing pattern).

### `calculator.js`
- Rename `analyzeDoubleJump(...)` → `analyzeJump(..., price, multiplier)`; `totalTarget = adjustedPrice * multiplier`.
- Replace `fullPayDoubleJumpAnalysis` / `halfPayDoubleJumpAnalysis` with:
  - `fullPayJumpAnalysis(revenue, company, price, multiplier)`
  - `halfPayJumpAnalysis(revenue, company, price, multiplier)`

### `main.js`
- When `price > 0` and revenue > 0: build the list of four `{ jumpLabel, payLabel, multiplier, analysis }` entries in the order above, filter to `analysis.possible`, and pass the result to `setJumps(possibleJumps, price, rate)`. Otherwise call `clearJumps()`.

### `ui.js`
- `setDoubleJumps` → `setJumps(possibleJumps, price, rate)`: renders one card per entry, or the `No jumps possible` line when the list is empty.
- `clearDoubleJump` → `clearJumps`.
- Remove `renderDJImpossibleBody` (no longer used).

### `index.html`
- Container `#double-jump` → `#jumps`.
- Input section label "Double Jump" → "Stock Jumps". The price select is unchanged.

### `style.css`
- Rename the `#double-jump` selectors to `#jumps`. Reuse the existing `.dj__*` card classes.
- Add a muted style for the `No jumps possible` line (`.dj__none`).

## Edge Cases

- If a double jump is possible, the single jump for the same pay type is generally possible too; both are shown.
- Price $40 (the floor): loans cannot lower the price further, so the existing behavior holds.
- shares = 2: treasury is forced to 0, same as now.

## Testing

- Existing double-jump tests move to the new functions with `multiplier = 2`, and their expectations stay the same.
- New single-jump tests (`multiplier = 1`): possible without loans, possible with a loan (price drop), not possible.

## Out of Scope

- Triple or greater jumps
- Withhold (pays no dividend)
- Explaining why a combination is impossible
