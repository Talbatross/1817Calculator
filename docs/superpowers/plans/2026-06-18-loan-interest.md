# Loan Interest Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Loans input group so players can see each company's projected net cash (current cash + company receipt − interest) for all three payout options.

**Architecture:** A new pure `interest(rate, loans)` function is added to `calculator.js`. `ui.js` reads three new DOM inputs (cash, loans, rate). `main.js` combines these with existing company receipt values to produce net cash strings. `index.html` is restructured into two labeled input groups.

**Tech Stack:** Vanilla JS ES modules, Vite, Vitest

## Global Constraints

- Revenue always a multiple of 10 (floored in `main.js`)
- Interest rate: $0–$70 in $5 increments
- Loans max = shares count (10, 5, or 2); clamped on shares change
- Company cash: no step constraint, min 0
- `calculator.js` must remain pure (no DOM access)
- Test runner: `npm test` (runs `vitest run`)

---

### Task 1: Add `interest()` to calculator.js (TDD)

**Files:**
- Modify: `src/calculator.js`
- Modify: `src/calculator.test.js`

**Interfaces:**
- Produces: `interest(rate: number, loans: number): number` — returns `rate * loans`

- [ ] **Step 1: Write the failing test**

Add this describe block at the bottom of `src/calculator.test.js`:

```js
describe('interest', () => {
  it('returns rate times number of loans', () => {
    expect(interest(10, 3)).toBe(30)
    expect(interest(35, 5)).toBe(175)
    expect(interest(70, 10)).toBe(700)
  })

  it('returns 0 when rate is 0', () => {
    expect(interest(0, 5)).toBe(0)
  })

  it('returns 0 when loans is 0', () => {
    expect(interest(30, 0)).toBe(0)
  })
})
```

Update the import at the top of `src/calculator.test.js` to include `interest`:

```js
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest } from './calculator.js'
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test
```

Expected: FAIL — `interest is not a function` or similar

- [ ] **Step 3: Implement `interest()` in calculator.js**

Add this export at the bottom of `src/calculator.js`:

```js
export function interest(rate, loans) {
  return rate * loans
}
```

- [ ] **Step 4: Run tests to verify all pass**

```
npm test
```

Expected: all tests PASS, no failures

- [ ] **Step 5: Commit**

```
git add src/calculator.js src/calculator.test.js
git commit -m "feat: add interest() pure function"
```

---

### Task 2: Add Loans input group to HTML and wire ui.js

**Files:**
- Modify: `index.html`
- Modify: `src/ui.js`

**Interfaces:**
- Consumes: new DOM element IDs `cash`, `loans`, `rate`
- Produces: `getInputs()` now returns `{ revenue, shares, treasury, cash, loans, rate }`

- [ ] **Step 1: Replace the inputs block in `index.html`**

Replace the existing `<div class="inputs">` block (lines 12–29) with this:

```html
      <div class="inputs">
        <div class="input-group">
          <span class="input-group__label">Revenue</span>
          <label>
            Revenue ($)
            <input id="revenue" type="number" min="0" step="10" value="0" />
          </label>
          <label>
            Shares
            <select id="shares">
              <option value="10" selected>10</option>
              <option value="5">5</option>
              <option value="2">2</option>
            </select>
          </label>
          <label id="treasury-label">
            Treasury shares
            <input id="treasury" type="number" min="0" max="8" step="1" value="0" />
          </label>
        </div>
        <div class="input-group">
          <span class="input-group__label">Loans</span>
          <label>
            Company cash ($)
            <input id="cash" type="number" min="0" value="0" />
          </label>
          <label>
            Loans
            <input id="loans" type="number" min="0" max="10" step="1" value="0" />
          </label>
          <label>
            Interest rate
            <select id="rate">
              <option value="0">$0</option>
              <option value="5">$5</option>
              <option value="10">$10</option>
              <option value="15">$15</option>
              <option value="20">$20</option>
              <option value="25">$25</option>
              <option value="30">$30</option>
              <option value="35">$35</option>
              <option value="40">$40</option>
              <option value="45">$45</option>
              <option value="50">$50</option>
              <option value="55">$55</option>
              <option value="60">$60</option>
              <option value="65">$65</option>
              <option value="70">$70</option>
            </select>
          </label>
        </div>
      </div>
```

- [ ] **Step 2: Update `getInputs()` in `src/ui.js`**

Replace the entire file with:

```js
export function getInputs() {
  return {
    revenue: Number(document.getElementById('revenue').value),
    shares: Number(document.getElementById('shares').value),
    treasury: Number(document.getElementById('treasury').value),
    cash: Number(document.getElementById('cash').value),
    loans: Number(document.getElementById('loans').value),
    rate: Number(document.getElementById('rate').value),
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

- [ ] **Step 3: Run tests to confirm no regressions**

```
npm test
```

Expected: all tests PASS (calculator.js tests are unaffected; no new DOM tests needed)

- [ ] **Step 4: Commit**

```
git add index.html src/ui.js
git commit -m "feat: add loans input group to HTML and ui.js"
```

---

### Task 3: Compute net cash in main.js and clamp loans on shares change

**Files:**
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `interest(rate, loans)` from `./calculator.js` (Task 1)
- Consumes: `getInputs()` returning `{ cash, loans, rate }` (Task 2)

- [ ] **Step 1: Replace `src/main.js` entirely**

```js
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest } from './calculator.js'
import { getInputs, setResults, setCompanyResults } from './ui.js'

function update() {
  const { revenue: rawRevenue, shares, treasury, cash, loans, rate } = getInputs()
  const revenue = Math.floor(rawRevenue / 10) * 10
  const t = shares === 2 ? 0 : Math.max(0, Math.min(Math.floor(treasury) || 0, shares - 2))
  const i = interest(rate, loans)

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
    `$${fullPayCompany(revenue, shares, t) + cash - i}`,
    `$${halfPayCompany(revenue, shares, t) + cash - i}`,
    `$${withholdCompany(revenue) + cash - i}`
  )
}

function updateTreasuryVisibility() {
  const shares = Number(document.getElementById('shares').value)
  const label = document.getElementById('treasury-label')
  const treasury = document.getElementById('treasury')
  const loans = document.getElementById('loans')

  label.hidden = shares === 2
  if (shares === 2) {
    treasury.value = 0
    treasury.max = 0
  } else {
    treasury.max = shares - 2
    if (Number(treasury.value) > Number(treasury.max)) treasury.value = treasury.max
  }

  loans.max = shares
  if (Number(loans.value) > shares) loans.value = shares
}

document.getElementById('revenue').addEventListener('input', update)
document.getElementById('shares').addEventListener('change', () => {
  updateTreasuryVisibility()
  update()
})
document.getElementById('treasury').addEventListener('input', update)
document.getElementById('cash').addEventListener('input', update)
document.getElementById('loans').addEventListener('input', update)
document.getElementById('rate').addEventListener('change', update)

updateTreasuryVisibility()
update()
```

- [ ] **Step 2: Run tests to confirm no regressions**

```
npm test
```

Expected: all tests PASS

- [ ] **Step 3: Smoke-test in the browser**

```
npm run dev
```

Open the local URL. Verify:
- Two input groups appear labeled "Revenue" and "Loans"
- Changing shares to 5 clamps loans max to 5; changing to 2 clamps to 2
- With revenue=$100, shares=10, treasury=0, cash=$500, loans=3, rate=$10: company results show $500 + receipt − $30 for each row
- With cash/loans/rate all at 0: company results match previous behavior

- [ ] **Step 4: Commit**

```
git add src/main.js
git commit -m "feat: wire loan interest into net cash display"
```
