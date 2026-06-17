# Company Payout Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show what the company treasury receives for each payout option, accounting for treasury shares that pay dividends back to the company.

**Architecture:** Add three pure calc functions to `calculator.js`, add a treasury shares input and company result spans to the HTML, extend `ui.js` with a `setCompanyResults` function and treasury read, then wire everything together in `main.js`. Style is a small CSS addition.

**Tech Stack:** Vanilla JS (ES modules), Vite, Vitest

---

### Task 1: Add company calc functions to calculator.js

**Files:**
- Modify: `src/calculator.js`
- Modify: `src/calculator.test.js`

- [ ] **Step 1: Write the failing tests**

In `src/calculator.test.js`, replace the second import line (the one from `./calculator.js`) with:

```js
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany } from './calculator.js'
```

Then append the following test blocks at the bottom of the file:

```js
describe('fullPayCompany', () => {
  it('returns 0 when no treasury shares', () => {
    expect(fullPayCompany(80, 10, 0)).toBe(0)
  })
  it('returns per-share dividend times treasury shares', () => {
    expect(fullPayCompany(80, 10, 2)).toBe(16)
    expect(fullPayCompany(60, 5, 1)).toBe(12)
  })
})

describe('halfPayCompany', () => {
  it('returns withheld amount when no treasury shares (10-share)', () => {
    // $80: withheld = floor(80/20)*10 = $40
    expect(halfPayCompany(80, 10, 0)).toBe(40)
    // $70: withheld = floor(70/20)*10 = $30
    expect(halfPayCompany(70, 10, 0)).toBe(30)
  })
  it('returns half revenue when no treasury shares (5-share)', () => {
    expect(halfPayCompany(60, 5, 0)).toBe(30)
  })
  it('adds treasury share dividends to withheld (10-share)', () => {
    // $80: withheld=$40, per-share=$4, treasury=2 → 40 + 4*2 = 48
    expect(halfPayCompany(80, 10, 2)).toBe(48)
  })
  it('adds treasury share dividends to withheld (5-share)', () => {
    // $60: withheld=$30, per-share=$6, treasury=1 → 30 + 6*1 = 36
    expect(halfPayCompany(60, 5, 1)).toBe(36)
  })
})

describe('withholdCompany', () => {
  it('returns full revenue to company', () => {
    expect(withholdCompany(80)).toBe(80)
    expect(withholdCompany(0)).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test
```

Expected: 7 new failures, all existing tests still pass.

- [ ] **Step 3: Add the three functions to calculator.js**

Append to the bottom of `src/calculator.js`:

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

- [ ] **Step 4: Run tests to confirm all pass**

```
npm test
```

Expected: all tests pass (existing 6 + new 7 = 13 total).

- [ ] **Step 5: Commit**

```bash
git add src/calculator.js src/calculator.test.js
git commit -m "feat: add company payout calc functions"
```

---

### Task 2: Add HTML elements

**Files:**
- Modify: `index.html`

The treasury input goes inside `.inputs`. The `result__company` spans go inside each result card, wrapped with the existing `result__value` in a new `result__right` div (so they stack vertically on the right side).

- [ ] **Step 1: Add treasury input inside `.inputs`**

Add after the shares `<label>` block:

```html
<label id="treasury-label">
  Treasury shares
  <input id="treasury" type="number" min="0" max="8" value="0" />
</label>
```

- [ ] **Step 2: Wrap result__value and add result__company in each card**

Replace each result card's inner spans. Before (Full Pay example):

```html
<div class="result result--full">
  <span class="result__label">Full Pay</span>
  <span class="result__value" id="result-full">—</span>
</div>
```

After:

```html
<div class="result result--full">
  <span class="result__label">Full Pay</span>
  <div class="result__right">
    <span class="result__value" id="result-full">—</span>
    <span class="result__company" id="result-full-company"></span>
  </div>
</div>
```

Apply the same pattern to the Half Pay and Withhold cards:

Half Pay:
```html
<div class="result result--half">
  <span class="result__label">Half Pay</span>
  <div class="result__right">
    <span class="result__value" id="result-half">—</span>
    <span class="result__company" id="result-half-company"></span>
  </div>
</div>
```

Withhold:
```html
<div class="result result--withhold">
  <span class="result__label">Withhold</span>
  <div class="result__right">
    <span class="result__value" id="result-withhold">—</span>
    <span class="result__company" id="result-withhold-company"></span>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add treasury input and company result spans to HTML"
```

---

### Task 3: Update ui.js

**Files:**
- Modify: `src/ui.js`

- [ ] **Step 1: Update getInputs to read treasury, add setCompanyResults**

Replace the entire contents of `src/ui.js` with:

```js
export function getInputs() {
  return {
    revenue: Number(document.getElementById('revenue').value),
    shares: Number(document.getElementById('shares').value),
    treasury: Number(document.getElementById('treasury').value),
  }
}

export function setResults(full, half, hold) {
  document.getElementById('result-full').textContent = full
  document.getElementById('result-half').textContent = half
  document.getElementById('result-withhold').textContent = hold
}

export function setCompanyResults(full, half, hold) {
  document.getElementById('result-full-company').textContent = full
  document.getElementById('result-half-company').textContent = half
  document.getElementById('result-withhold-company').textContent = hold
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui.js
git commit -m "feat: extend ui.js with treasury input read and setCompanyResults"
```

---

### Task 4: Wire everything in main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Replace main.js with the wired-up version**

```js
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany } from './calculator.js'
import { getInputs, setResults, setCompanyResults } from './ui.js'

function update() {
  const { revenue, shares, treasury } = getInputs()
  const t = shares === 2 ? 0 : treasury

  if (!revenue) {
    setResults('—', '—', '—')
    setCompanyResults('—', '—', '—')
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

  setCompanyResults(
    `$${fullPayCompany(revenue, shares, t)}`,
    `$${halfPayCompany(revenue, shares, t)}`,
    `$${withholdCompany(revenue)}`
  )
}

function updateTreasuryVisibility() {
  const shares = Number(document.getElementById('shares').value)
  const label = document.getElementById('treasury-label')
  const input = document.getElementById('treasury')
  label.hidden = shares === 2
  if (shares === 2) {
    input.value = 0
  } else {
    input.max = shares - 2
  }
}

document.getElementById('revenue').addEventListener('input', update)
document.getElementById('shares').addEventListener('change', () => {
  updateTreasuryVisibility()
  update()
})
document.getElementById('treasury').addEventListener('input', update)

updateTreasuryVisibility()
update()
```

- [ ] **Step 2: Run tests**

```
npm test
```

Expected: all 13 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: wire company payout display and treasury input visibility"
```

---

### Task 5: Style company results

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add result__right and result__company styles**

Append to the bottom of `src/style.css`:

```css
.result__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.result__company {
  font-size: 0.8rem;
  color: #666;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat: style company payout line in result cards"
```
