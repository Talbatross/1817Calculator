# Loan Interest Calculator — Design Spec

**Date:** 2026-06-18  
**Status:** Approved

## Overview

Add a Loans input group to the 1817 Payout Calculator so players can see their company's projected net cash after paying loan interest for each payout option.

## Rules Context

In 1817, companies may take loans up to their share count (10, 5, or 2). A game-wide interest rate applies to all loans, ranging from $0 to $70 in $5 increments, set by the total loans outstanding across all companies. Each operating round, the company pays `rate × loans` in interest.

## Inputs

Two labeled input groups replace the current flat inputs block:

**Revenue group** (existing, unchanged):
- Revenue ($) — number, min 0, step 10
- Shares — select: 10, 5, 2
- Treasury shares — number, min 0, max = shares − 2, step 1

**Loans group** (new):
- Company cash ($) — number, min 0, no step constraint
- Loans — number, min 0, max = shares (clamped when shares changes), step 1
- Interest rate — select: $0, $5, $10, … $70

The loans `max` updates alongside treasury `max` when the shares select changes. If the current loans value exceeds the new max, it is clamped to the new max.

## Calculation

```
interest = rate × loans
net cash = company cash + company receipt − interest
```

This replaces the raw company receipt in each result row. When cash, loans, and rate are all zero (the default), net cash equals the company receipt — no change to existing behaviour.

## New Code

### `calculator.js`

```js
export function interest(rate, loans) {
  return rate * loans
}
```

Pure function, no side effects.

### `ui.js`

`getInputs()` returns three additional fields: `cash`, `loans`, `rate`.

### `main.js`

Reads the new inputs, computes `interest(rate, loans)`, and passes `companyReceipt + cash - i` as the company result string for each payout option.

### `index.html`

Adds the Loans group below the existing Revenue group. The loans input `max` attribute is updated in `updateTreasuryVisibility()` (renamed or extended as appropriate).

## Output Display

Each result row's company figure becomes the projected net cash:

```
Full Pay    $7/share     $1,234
Half Pay    $4/share     $1,198
Withhold    $0/share     $1,150
```

## Testing

- `interest(rate, loans)` — unit tested in `calculator.test.js`
- Zero loans / zero rate returns net equal to bare company receipt
- Loans clamped to shares when shares select changes
- Existing payout tests unaffected
