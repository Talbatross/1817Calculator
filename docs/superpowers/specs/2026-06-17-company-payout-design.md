# Company Payout Display

**Date:** 2026-06-17

## Goal

Show what the company treasury receives for each payout type, taking treasury shares into account. Treasury shares receive dividends that go back to the company rather than to a player.

## Rules

- **Full pay:** company receives dividends on treasury shares only — `fullPay(revenue, shares) * treasury`
- **Half pay:** company receives the withheld portion plus dividends on treasury shares — `(revenue - halfPay(revenue, shares) * shares) + halfPay(revenue, shares) * treasury`. This formula works for all share counts, including the 10-share rounding logic.
- **Withhold:** company receives all revenue — `revenue`
- **2-share companies:** single president always owns both shares; treasury is always 0. No treasury input shown.

## Changes

### calculator.js

Add three exported functions:

```js
export function fullPayCompany(revenue, shares, treasury) {
  return fullPay(revenue, shares) * treasury
}

export function halfPayCompany(revenue, shares, treasury) {
  const perShare = halfPay(revenue, shares)
  return (revenue - perShare * shares) + perShare * treasury
}

export function withholdCompany(revenue) {
  return revenue
}
```

### index.html

- Add a treasury shares number input (min 0, max `shares - 2`). Hidden when shares = 2.
- Add a `result__company` span inside each of the 3 result cards.

### ui.js

- Update `getInputs()` to return `treasury` (reads the new input).
- Add `setCompanyResults(full, half, hold)` that writes to the `result__company` spans.

### main.js

- When shares = 2, set `treasury = 0` (no input read).
- Pass `treasury` to the three company functions.
- Format company amounts as `$X` (always absolute, no `/share` or `total` suffix).
- Hide/show the treasury input when the shares select changes.

### style.css

- Style `result__company` muted and smaller to visually subordinate it to the shareholder value.

## Display Format

| Scenario | Shareholder shows | Company shows |
|---|---|---|
| 10-share, full pay | `$8/share` | `$0` |
| 10-share, half pay | `$4/share` | `$40` |
| 10-share, withhold | `$0/share` | `$80` |
| 2-share, full pay | `$80 total` | `$0` |
| 2-share, half pay | `$40 total` | `$40` |
| 2-share, withhold | `$0 total` | `$80` |
| 5-share, 1 treasury, full pay | `$16/share` | `$16` |
