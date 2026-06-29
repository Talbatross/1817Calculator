# Double Jump Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a double-jump feasibility analysis card that tells players how many loans a company needs to take to pay ≥ 2× its stock price per share (Full Pay or Half Pay), and whether those loans can be repaid from the treasury-dividend cash that flows back.

**Architecture:** Pure math in `calculator.js` (new `doubleJumpAnalysis` export), DOM in `ui.js` (new `setDoubleJump`/`clearDoubleJump` + updated `getInputs`), and wiring in `main.js`. A new stock-price input row sits between the existing input groups and the results, and a card div sits below the results.

**Tech Stack:** Vanilla JS (ES modules), Vite, Vitest for unit tests, plain CSS.

## Global Constraints

- Each loan face value: $100 (hardcoded constant `LOAN_VALUE = 100`)
- Interest applies to same-round loans
- Double jump threshold: ≥ 2× stock price per share
- Applies to Full Pay and Half Pay (not Withhold)
- Existing file split: `calculator.js` = pure functions only, `ui.js` = DOM only, `main.js` = wiring
- Test runner: `npx vitest run` (all tests must stay green after every task)

---

### Task 1: `doubleJumpAnalysis()` pure function + tests

**Files:**
- Modify: `src/calculator.js` (append new export)
- Modify: `src/calculator.test.js` (append new describe block)

**Interfaces:**
- Consumes: existing `interest(rate, loans)` from `calculator.js`
- Produces: `doubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price)` → `{ targetPerShare, cashBeforeLoans, loansNeeded, maxNewLoans, capacityOk, existingInterest, newInterest, externalShares, externalDividend, endCash, possible }`

- [ ] **Step 1: Write the failing tests**

First, update the import line at the top of `src/calculator.test.js` to include `doubleJumpAnalysis`:

```js
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest, doubleJumpAnalysis } from './calculator.js'
```

Then append the new describe block at the end of `src/calculator.test.js`:

```js
import { ..., doubleJumpAnalysis } from './calculator.js'

describe('doubleJumpAnalysis', () => {
  it('is possible when treasury dividends cover loan repayment', () => {
    // shares=10, treasury=8, price=$20 → targetPerShare=$40, totalTarget=$400
    // cashBeforeLoans=$110, loansNeeded=ceil((400-110)/100)=3
    // externalDividend=2×$40=$80, newInterest=3×$10=$30
    // endCash=110-80-0-30=0 ✓
    const r = doubleJumpAnalysis(100, 10, 8, 10, 0, 10, 20)
    expect(r.targetPerShare).toBe(40)
    expect(r.cashBeforeLoans).toBe(110)
    expect(r.loansNeeded).toBe(3)
    expect(r.maxNewLoans).toBe(10)
    expect(r.capacityOk).toBe(true)
    expect(r.existingInterest).toBe(0)
    expect(r.newInterest).toBe(30)
    expect(r.externalShares).toBe(2)
    expect(r.externalDividend).toBe(80)
    expect(r.endCash).toBe(0)
    expect(r.possible).toBe(true)
  })

  it('is possible with zero new loans when cash+revenue covers total target', () => {
    // totalTarget=20×10=$200, cashBeforeLoans=$200 → loansNeeded=0
    // externalDividend=10×$20=$200, endCash=200-200-0-0=0 ✓
    const r = doubleJumpAnalysis(200, 10, 0, 0, 0, 10, 10)
    expect(r.loansNeeded).toBe(0)
    expect(r.newInterest).toBe(0)
    expect(r.endCash).toBe(0)
    expect(r.possible).toBe(true)
  })

  it('is not possible when loan capacity is exceeded', () => {
    // shares=5, existingLoans=5 → maxNewLoans=0
    // totalTarget=40×5=$200, cashBeforeLoans=$100 → loansNeeded=1 > 0
    const r = doubleJumpAnalysis(100, 5, 0, 0, 5, 10, 20)
    expect(r.loansNeeded).toBe(1)
    expect(r.maxNewLoans).toBe(0)
    expect(r.capacityOk).toBe(false)
    expect(r.possible).toBe(false)
  })

  it('is not possible when end cash is negative (no treasury to offset)', () => {
    // treasury=0, all 10 shares are external: externalDividend=$400
    // loansNeeded=3, newInterest=$30
    // endCash=100-400-0-30=-330
    const r = doubleJumpAnalysis(100, 10, 0, 0, 0, 10, 20)
    expect(r.loansNeeded).toBe(3)
    expect(r.endCash).toBe(-330)
    expect(r.possible).toBe(false)
  })

  it('deducts existing loan interest from end cash', () => {
    // same as first test but existingLoans=1 → existingInterest=$10
    // endCash=110-80-10-30=-10
    const r = doubleJumpAnalysis(100, 10, 8, 10, 1, 10, 20)
    expect(r.existingInterest).toBe(10)
    expect(r.endCash).toBe(-10)
    expect(r.possible).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/calculator.test.js
```

Expected: 5 new failures — `doubleJumpAnalysis is not a function` or similar.

- [ ] **Step 3: Implement `doubleJumpAnalysis` in `src/calculator.js`**

Append after the existing `withholdCompanySteps` function:

```js
export function doubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price) {
  const LOAN_VALUE = 100
  const targetPerShare = price * 2
  const totalTarget = targetPerShare * shares
  const externalShares = shares - treasury
  const externalDividend = targetPerShare * externalShares
  const existingInterest = interest(rate, existingLoans)
  const maxNewLoans = shares - existingLoans
  const cashBeforeLoans = cash + revenue

  const loansNeeded = cashBeforeLoans >= totalTarget
    ? 0
    : Math.ceil((totalTarget - cashBeforeLoans) / LOAN_VALUE)

  const capacityOk = loansNeeded <= maxNewLoans
  const newInterest = loansNeeded * rate
  const endCash = cashBeforeLoans - externalDividend - existingInterest - newInterest

  return {
    targetPerShare,
    cashBeforeLoans,
    loansNeeded,
    maxNewLoans,
    capacityOk,
    existingInterest,
    newInterest,
    externalShares,
    externalDividend,
    endCash,
    possible: capacityOk && endCash >= 0,
  }
}
```

- [ ] **Step 4: Run tests to verify all pass**

```
npx vitest run src/calculator.test.js
```

Expected: all 21 tests pass (16 existing + 5 new).

- [ ] **Step 5: Commit**

```
git add src/calculator.js src/calculator.test.js
git commit -m "feat: add doubleJumpAnalysis pure function"
```

---

### Task 2: HTML structure, CSS card styles, and UI functions

**Files:**
- Modify: `index.html` — add stock price input row and `#double-jump` div
- Modify: `src/style.css` — generalize `.breakdown__total`, add `.dj-*` styles
- Modify: `src/ui.js` — update `getInputs`, add `setDoubleJump` and `clearDoubleJump`

**Interfaces:**
- Consumes: `doubleJumpAnalysis` return shape from Task 1
- Produces:
  - `getInputs()` now includes `price: number`
  - `setDoubleJump(analysis: object, rate: number) → void`
  - `clearDoubleJump() → void`

- [ ] **Step 1: Add stock price input and result container to `index.html`**

Insert a new `<div class="dj-input">` block between the closing `</div>` of `.inputs` and the opening `<div class="results">`:

```html
      <div class="dj-input">
        <span class="input-group__label">Double Jump</span>
        <label>
          Stock price ($)
          <input id="price" type="number" min="0" step="1" value="0" />
        </label>
      </div>
      <div class="results" ...>
        ...
      </div>
      <div id="double-jump"></div>
```

Full updated `index.html` structure for the relevant section:

```html
      </div><!-- end .inputs -->
      <div class="dj-input">
        <span class="input-group__label">Double Jump</span>
        <label>
          Stock price ($)
          <input id="price" type="number" min="0" step="1" value="0" />
        </label>
      </div>
      <div class="results" aria-live="polite" aria-atomic="true">
        <!-- existing result rows unchanged -->
      </div>
      <div id="double-jump"></div>
```

- [ ] **Step 2: Update `src/style.css`**

**2a.** Generalize the existing `.breakdown__total` selector so it works inside both `.result__breakdown` and `.dj__breakdown`. Replace:

```css
.result__breakdown .breakdown__total {
  color: #333;
  font-weight: 600;
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  margin-top: 2px;
  padding-top: 2px;
}
```

with:

```css
.breakdown__total {
  color: #333;
  font-weight: 600;
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  margin-top: 2px;
  padding-top: 2px;
}
```

**2b.** Append new rules at the end of `src/style.css`:

```css
.dj-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.dj-input label {
  max-width: 160px;
}

#double-jump {
  margin-top: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

#double-jump:empty {
  display: none;
}

.dj__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
}

.dj__header--ok   { background: #e8f5e9; }
.dj__header--fail { background: #fbe9e7; }

.dj__title { font-weight: 600; color: #333; }

.dj__status--ok   { color: #2e7d32; font-weight: bold; }
.dj__status--fail { color: #c62828; font-weight: bold; }

.dj__body {
  padding: 8px 16px 12px;
  font-size: 0.85rem;
}

.dj__applies {
  font-size: 0.75rem;
  color: #777;
  margin-bottom: 4px;
}

.dj__loans, .dj__reason {
  color: #555;
  margin-bottom: 6px;
}

.dj__breakdown {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 10px;
  row-gap: 1px;
  font-size: 0.75rem;
  color: #666;
  margin-top: 4px;
}

.dj__breakdown span:nth-child(even) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 3: Update `src/ui.js`**

**3a.** Add `price` to `getInputs()`:

```js
export function getInputs() {
  return {
    revenue: Number(document.getElementById('revenue').value),
    shares: Number(document.getElementById('shares').value),
    treasury: Number(document.getElementById('treasury').value),
    cash: Number(document.getElementById('cash').value),
    loans: Number(document.getElementById('loans').value),
    rate: Number(document.getElementById('rate').value),
    price: Number(document.getElementById('price').value),
  }
}
```

**3b.** Append `clearDoubleJump` and `setDoubleJump` at the end of `src/ui.js`:

```js
export function clearDoubleJump() {
  document.getElementById('double-jump').innerHTML = ''
}

export function setDoubleJump(analysis, rate) {
  const {
    targetPerShare, cashBeforeLoans, loansNeeded, maxNewLoans,
    capacityOk, existingInterest, newInterest,
    externalShares, externalDividend, endCash, possible,
  } = analysis

  const headerClass = possible ? 'dj__header--ok' : 'dj__header--fail'
  const statusClass = possible ? 'dj__status--ok' : 'dj__status--fail'
  const statusText = possible ? 'Possible' : 'Not Possible'

  const fmt = n => n < 0 ? `−$${Math.abs(n)}` : `$${n}`

  let bodyHtml = '<div class="dj__applies">Applies to Full Pay and Half Pay</div>'

  if (possible) {
    if (loansNeeded === 0) {
      bodyHtml += '<div class="dj__loans">No new loans needed</div>'
    } else {
      bodyHtml += `<div class="dj__loans">${loansNeeded} new loan${loansNeeded !== 1 ? 's' : ''} needed ($${loansNeeded * 100} + $${newInterest} interest)</div>`
    }

    const existIntRow = existingInterest > 0
      ? `<span>− Existing interest</span><span>−$${existingInterest}</span>`
      : ''
    const newIntRow = newInterest > 0
      ? `<span>− New interest (${loansNeeded} × $${rate})</span><span>−$${newInterest}</span>`
      : ''

    bodyHtml += `
      <div class="dj__breakdown">
        <span>Cash + revenue</span><span>$${cashBeforeLoans}</span>
        <span>− Ext. dividend (${externalShares} × $${targetPerShare})</span><span>−$${externalDividend}</span>
        ${existIntRow}${newIntRow}
        <span class="breakdown__total">= Remaining</span><span class="breakdown__total">${fmt(endCash)}</span>
      </div>`
  } else {
    if (!capacityOk) {
      bodyHtml += `<div class="dj__reason">Need ${loansNeeded} loans — capacity: ${maxNewLoans}</div>`
    } else {
      const prefix = loansNeeded > 0
        ? `${loansNeeded} loan${loansNeeded !== 1 ? 's' : ''} needed, but remaining cash: `
        : 'Remaining cash would be: '
      bodyHtml += `<div class="dj__reason">${prefix}${fmt(endCash)}</div>`
    }
  }

  document.getElementById('double-jump').innerHTML = `
    <div class="dj__header ${headerClass}">
      <span class="dj__title">Double Jump (≥ $${targetPerShare}/share)</span>
      <span class="${statusClass}">${statusText}</span>
    </div>
    <div class="dj__body">${bodyHtml}</div>
  `
}
```

- [ ] **Step 4: Verify existing tests still pass**

```
npx vitest run
```

Expected: all 21 tests pass.

- [ ] **Step 5: Commit**

```
git add index.html src/style.css src/ui.js
git commit -m "feat: add double-jump card HTML, CSS, and UI functions"
```

---

### Task 3: Wire double-jump into `main.js` and verify

**Files:**
- Modify: `src/main.js`

**Interfaces:**
- Consumes:
  - `doubleJumpAnalysis(revenue, shares, treasury, cash, existingLoans, rate, price)` from `calculator.js`
  - `setDoubleJump(analysis, rate)` from `ui.js`
  - `clearDoubleJump()` from `ui.js`
  - `price` from `getInputs()` return

- [ ] **Step 1: Update the import lines in `src/main.js`**

```js
import {
  fullPay, halfPay, withhold,
  fullPayCompany, halfPayCompany, withholdCompany,
  interest,
  fullPayCompanySteps, halfPayCompanySteps, withholdCompanySteps,
  doubleJumpAnalysis,
} from './calculator.js'
import {
  getInputs, setResults,
  setCompanyBreakdowns, clearCompanyBreakdowns,
  setDoubleJump, clearDoubleJump,
} from './ui.js'
```

- [ ] **Step 2: Destructure `price` and call double-jump analysis in `update()`**

Update the `update` function. The full function after changes:

```js
function update() {
  const { revenue: rawRevenue, shares, treasury, cash, loans, rate, price } = getInputs()
  const revenue = Math.floor(rawRevenue / 10) * 10
  const t = shares === 2 ? 0 : Math.max(0, Math.min(Math.floor(treasury) || 0, shares * 2 - 2))
  const l = Math.max(0, Math.min(Math.floor(loans) || 0, shares))
  const i = interest(rate, l)

  if (!revenue) {
    setResults('—', '—', '—')
    clearCompanyBreakdowns()
    clearDoubleJump()
    return
  }

  if (shares === 2) {
    setResults(
      `$${fullPay(revenue, shares) * shares} total`,
      `$${halfPay(revenue, shares) * shares} total`,
      `$${withhold()} total`
    )
  } else {
    setResults(
      `$${fullPay(revenue, shares)}/share`,
      `$${halfPay(revenue, shares)}/share`,
      `$${withhold()}/share`
    )
  }

  setCompanyBreakdowns(
    fullPayCompanySteps(revenue, shares, t, cash, i, l, rate),
    halfPayCompanySteps(revenue, shares, t, cash, i, l, rate),
    withholdCompanySteps(revenue, cash, i, l, rate)
  )

  if (price > 0) {
    setDoubleJump(doubleJumpAnalysis(revenue, shares, t, cash, l, rate, price), rate)
  } else {
    clearDoubleJump()
  }
}
```

- [ ] **Step 3: Add event listener for the price input**

Append after the existing listeners at the bottom of `src/main.js`:

```js
document.getElementById('price').addEventListener('input', update)
```

- [ ] **Step 4: Run all tests**

```
npx vitest run
```

Expected: all 21 tests pass.

- [ ] **Step 5: Manual smoke test — verify the following scenarios in the browser**

Dev server should already be running at `http://localhost:5173`. If not: `npm run dev`

**Scenario A — Possible with loans:**
- Revenue: $100, Shares: 10, Treasury: 8, Cash: $10, Loans: 0, Rate: $10, Price: $20
- Expected card: "Double Jump (≥ $40/share) — Possible", "3 new loans needed ($300 + $30 interest)", remaining = $0

**Scenario B — Possible with no loans:**
- Revenue: $200, Shares: 10, Treasury: 0, Cash: $0, Loans: 0, Rate: $0, Price: $10
- Expected card: "Possible", "No new loans needed", remaining = $0

**Scenario C — Not possible, no treasury:**
- Revenue: $100, Shares: 10, Treasury: 0, Cash: $0, Loans: 0, Rate: $10, Price: $20
- Expected card: "Not Possible", "3 loans needed, but remaining cash: −$330"

**Scenario D — Not possible, over capacity:**
- Revenue: $100, Shares: 5, Treasury: 0, Cash: $0, Loans: 5, Rate: $10, Price: $20
- Expected card: "Not Possible", "Need 1 loans — capacity: 0"

**Scenario E — Price = 0:**
- Set Price to 0 — double-jump card should disappear entirely

**Scenario F — Revenue = 0:**
- Set Revenue to 0 — double-jump card should disappear entirely

- [ ] **Step 6: Commit**

```
git add src/main.js
git commit -m "feat: wire double-jump analysis into calculator"
```
