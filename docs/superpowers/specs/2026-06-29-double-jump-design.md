# Double Jump Analysis — Design Spec
**Date:** 2026-06-29

## Overview

Add a double-jump feasibility analysis to the 1817 Payout Calculator. A double jump occurs when a company pays ≥ 2× its current stock price per share (Full Pay or Half Pay). Companies with insufficient cash can take short-term loans to physically fund the payment, using the treasury-share dividends that flow back as the repayment source.

## Mechanic

When a company pays a per-share dividend ≥ 2P (double the current stock price P) to **all** shareholders including treasury shares, the treasury portion (2P × treasury) immediately returns to company cash. This returning cash is what funds loan repayment.

The math is identical for Full Pay and Half Pay double jumps:

- **Physical cash needed** to make the payment: `2P × shares`
- **Loans needed**: `max(0, ceil((2P × shares − cash − revenue) / 100))`  
  (each loan provides $100; taken this round and repaid this round)
- **End cash** after treasury return + interest + loan repayment:
  `cash + revenue − 2P × (shares − treasury) − existing_interest − new_interest`
  where `new_interest = loans_needed × rate`
- **Possible** when:
  1. `loans_needed ≤ shares − existing_loans` (within loan capacity)
  2. `end_cash ≥ 0` (solvent after repayment)

Interest applies to same-round loans (per confirmed rules). Each loan is $100 face value.

## New Input

**Stock price ($)** — number input, min 0, step 1, default 0.

Placed in a full-width row between the two-column input area and the results section, labeled "Double Jump". Hidden/no-op when value is 0.

## New UI Section

A single analysis card rendered below the `.results` div. Visible when `price > 0` and `revenue > 0`. Hidden (empty) otherwise.

### Possible — loans needed
```
Double Jump (≥ $40/share)              Possible ✓
Applies to Full Pay and Half Pay
3 new loans needed ($300 + $30 interest)

Cash + revenue              $110
− Ext. dividend (2 × $40)  −$80
− New interest (3 × $10)   −$30
= Remaining                   $0
```

### Possible — no loans needed
```
Double Jump (≥ $40/share)              Possible ✓
Applies to Full Pay and Half Pay
No new loans needed

Cash + revenue             $500
− Ext. dividend (4 × $40) −$160
− Existing interest         −$20
= Remaining                $320
```

### Not possible — over loan capacity (shown first when both constraints fail)
```
Double Jump (≥ $40/share)         Not Possible ✗
Need 12 loans — capacity: 3
```

### Not possible — insufficient net cash
```
Double Jump (≥ $40/share)         Not Possible ✗
3 loans needed, but remaining cash: −$50
```

When loans_needed = 0 but end_cash < 0 (existing interest makes it infeasible):
```
Double Jump (≥ $40/share)         Not Possible ✗
Remaining cash would be: −$20
```

**Breakdown row visibility:** Only show "− Existing interest" row when `existingInterest > 0`. Only show "− New interest" row when `newInterest > 0`. Never show `−$0` rows.

## Architecture

Follows the existing pattern: pure math in `calculator.js`, DOM in `ui.js`, wiring in `main.js`.

### `calculator.js` — new export
```js
doubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price)
```
Returns:
```js
{
  targetPerShare,     // 2 * price
  cashBeforeLoans,    // cash + revenue
  loansNeeded,        // min new loans for physical payment
  maxNewLoans,        // shares - existingLoans
  capacityOk,         // loansNeeded <= maxNewLoans
  existingInterest,   // existing loan interest this round
  newInterest,        // loansNeeded * rate
  externalShares,     // shares - treasury
  externalDividend,   // targetPerShare * externalShares
  endCash,            // net cash after everything
  possible,           // capacityOk && endCash >= 0
}
```

### `ui.js` — additions
- Update `getInputs()` to include `price: Number(document.getElementById('price').value)`
- `setDoubleJump(analysis, rate)` — renders the card into `#double-jump`
- `clearDoubleJump()` — empties `#double-jump`

### `index.html` — additions
- Stock price input row between inputs and results
- `<div id="double-jump"></div>` after `.results`

### `style.css` — additions
- `.dj` card styles (header, body, breakdown grid)
- Reuse existing `.breakdown__total` class for the `= Remaining` row
- Possible state: green header tint matching `.result--full`
- Not-possible state: red header tint matching `.result--withhold`

### `main.js` — additions
- Read `price` from inputs
- When `price > 0` and `revenue > 0`: call `doubleJumpAnalysis` and `setDoubleJump`
- Otherwise: call `clearDoubleJump`

## Edge Cases

- **price = 0**: hide the card entirely (clearDoubleJump)
- **revenue = 0**: hide the card (already returns early in update())
- **shares = 2**: treasury is always 0 (forced by existing logic); externalShares = 2; formula still works
- **Negative end_cash with 0 new loans**: show "Not Possible" with remaining cash figure
- **rate = 0**: new_interest = 0 regardless of loans; capacity is the only constraint
- **Already achievable from revenue alone** (`revenue / shares >= 2 * price`): loansNeeded = 0, show "No new loans needed"

## Out of Scope

- Double-jump analysis for Withhold (withhold never pays dividends, so no double jump applies)
- Multi-round loan repayment planning
- Tracking ongoing interest burden from retained new loans
