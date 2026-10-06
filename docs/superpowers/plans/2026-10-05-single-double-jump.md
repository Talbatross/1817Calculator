# Single & Double Jump Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Double Jump section with one that evaluates Single and Double jumps for both Full Pay and Half Pay, and shows only the possible combinations.

**Architecture:** Generalize the existing `analyzeDoubleJump` in `calculator.js` with a `multiplier` argument (1 = single, 2 = double). `main.js` builds the four combinations and filters to possible ones. `ui.js` renders one card per possible combination, or "No jumps possible" when the list is empty.

**Tech Stack:** Vanilla JS (ES modules), Vite, Vitest, plain CSS.

**Spec:** `docs/superpowers/specs/2026-10-05-single-double-jump-design.md`

## Global Constraints

- `calculator.js` = pure functions only; `ui.js` = DOM only (no math); `main.js` = wiring
- Single jump threshold: `1 × adjustedPrice`; double jump threshold: `2 × adjustedPrice`
- Combination order: Double/Full Pay, Double/Half Pay, Single/Full Pay, Single/Half Pay
- Card title: `<Jump> — <Pay Type> (≥ $X total)` where X = `price × multiplier` (unadjusted)
- Empty state text: `No jumps possible`
- Input section label: `Stock Jumps`; container id: `#jumps`
- Test command: `npm test` (all tests green after each task)

---

### Task 1: Generalize jump analysis with a multiplier

**Files:**
- Modify: `src/calculator.js` (the `analyzeDoubleJump` function and the two exports at the bottom)
- Modify: `src/calculator.test.js` (import line, the two DoubleJump describe blocks, plus new single-jump tests)
- Modify: `src/main.js` (import line and the two call sites so the app keeps working)

**Interfaces:**
- Produces:
  - `fullPayJumpAnalysis(revenue, company, price, multiplier)` → same result object as today's `fullPayDoubleJumpAnalysis` (`possible`, `canFund`, `originalPrice`, `adjustedPrice`, `totalTarget`, `loansNeeded`, `endCash`, …)
  - `halfPayJumpAnalysis(revenue, company, price, multiplier)` → same shape
  - `fullPayDoubleJumpAnalysis` / `halfPayDoubleJumpAnalysis` are removed

- [ ] **Step 1: Update existing tests to the new API and add single-jump tests**

In `src/calculator.test.js`, change the import line to:

```js
import { fullPay, halfPay, withhold, fullPayCompany, halfPayCompany, withholdCompany, interest, fullPayJumpAnalysis, halfPayJumpAnalysis } from './calculator.js'
```

Rename the existing describe blocks and calls with these replacements:
- `describe('fullPayDoubleJumpAnalysis'` → `describe('fullPayJumpAnalysis (double)'`
- `describe('halfPayDoubleJumpAnalysis'` → `describe('halfPayJumpAnalysis (double)'`
- every `fullPayDoubleJumpAnalysis(...args, price)` call → `fullPayJumpAnalysis(...args, price, 2)`
- every `halfPayDoubleJumpAnalysis(...args, price)` call → `halfPayJumpAnalysis(...args, price, 2)`

For example, `fullPayDoubleJumpAnalysis(90, { shares: 10, treasury: 0, cash: 5, existingLoans: 0, rate: 5 }, 50)` becomes `fullPayJumpAnalysis(90, { shares: 10, treasury: 0, cash: 5, existingLoans: 0, rate: 5 }, 50, 2)`. Keep all expectations unchanged.

Append at the end of the file:

```js
describe('fullPayJumpAnalysis (single)', () => {
  it('is possible with zero loans when revenue meets 1× price', () => {
    // price=$50, totalTarget=$50, revenue=$50 → no loans; endCash = 0
    const r = fullPayJumpAnalysis(50, { shares: 10, treasury: 0, cash: 0, existingLoans: 0, rate: 5 }, 50, 1)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(0)
    expect(r.totalTarget).toBe(50)
    expect(r.endCash).toBe(0)
  })

  it('uses a loan to drop the price one step', () => {
    // price=$50, revenue=$45 < $50; 1 loan → $45, target=$45 ✓
    // endCash = 5 (cash) - 5 (interest) = 0
    const r = fullPayJumpAnalysis(45, { shares: 10, treasury: 0, cash: 5, existingLoans: 0, rate: 5 }, 50, 1)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(1)
    expect(r.adjustedPrice).toBe(45)
    expect(r.totalTarget).toBe(45)
    expect(r.endCash).toBe(0)
  })

  it('is not possible when revenue is below 1× price and no loan capacity', () => {
    // existingLoans=10 → maxNewLoans=0; revenue=$30 < $50
    const r = fullPayJumpAnalysis(30, { shares: 10, treasury: 0, cash: 0, existingLoans: 10, rate: 5 }, 50, 1)
    expect(r.possible).toBe(false)
    expect(r.canFund).toBe(false)
  })
})

describe('halfPayJumpAnalysis (single)', () => {
  it('counts only the paid half toward the target', () => {
    // revenue=$100, shares=10: withheld=$50, paid=$50 ≥ target $50 → no loans
    // endCash = 0 (cash) + 50 (withheld) = 50
    const r = halfPayJumpAnalysis(100, { shares: 10, treasury: 0, cash: 0, existingLoans: 0, rate: 5 }, 50, 1)
    expect(r.possible).toBe(true)
    expect(r.loansNeeded).toBe(0)
    expect(r.effectiveRevenue).toBe(50)
    expect(r.endCash).toBe(50)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL. `fullPayJumpAnalysis is not a function` (or a similar import error).

- [ ] **Step 3: Implement the multiplier in `src/calculator.js`**

Rename the function signature and the target computation:

```js
function analyzeJump(effectiveRevenue, thresholdRevenue, rawRevenue, { shares, treasury, cash, existingLoans, rate }, price, multiplier) {
```

Inside `buildScenario`, change:

```js
    const totalTarget = adjustedPrice * 2
```

to:

```js
    const totalTarget = adjustedPrice * multiplier
```

Replace the two exports at the bottom of the file with:

```js
export function fullPayJumpAnalysis(revenue, company, price, multiplier) {
  return analyzeJump(revenue, revenue, revenue, company, price, multiplier)
}

export function halfPayJumpAnalysis(revenue, company, price, multiplier) {
  const effectiveRevenue = halfPay(revenue, company.shares) * company.shares
  return analyzeJump(effectiveRevenue, effectiveRevenue, revenue, company, price, multiplier)
}
```

Also update the comment above the function: the line `// thresholdRevenue: revenue counted toward the DJ threshold ...` should read `// thresholdRevenue: revenue counted toward the jump threshold ...`.

- [ ] **Step 4: Keep `src/main.js` working (no behavior change yet)**

In the import line, replace `fullPayDoubleJumpAnalysis, halfPayDoubleJumpAnalysis` with `fullPayJumpAnalysis, halfPayJumpAnalysis`. Replace the two call sites:

```js
      fullPayJumpAnalysis(revenue, company, price, 2),
      halfPayJumpAnalysis(revenue, company, price, 2),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/calculator.js src/calculator.test.js src/main.js
git commit -m "refactor: generalize jump analysis with a multiplier"
```

---

### Task 2: Render only the possible single/double jump combinations

**Files:**
- Modify: `src/main.js` (import line and the `if (price > 0)` block in `update()`, plus `clearDoubleJump` calls)
- Modify: `src/ui.js` (`clearDoubleJump`, `renderDJImpossibleBody`, `renderDJCard`, `setDoubleJumps`)
- Modify: `index.html` (the `.dj-input` label and the `#double-jump` div)
- Modify: `src/style.css` (`#double-jump` selectors; add `.dj__none`)

**Interfaces:**
- Consumes: `fullPayJumpAnalysis(revenue, company, price, multiplier)`, `halfPayJumpAnalysis(revenue, company, price, multiplier)` from Task 1
- Produces (ui.js):
  - `setJumps(possibleJumps, price, rate)`, where `possibleJumps` is an array of `{ jumpLabel: 'Single Jump' | 'Double Jump', payLabel: 'Full Pay' | 'Half Pay', multiplier: 1 | 2, analysis }`
  - `clearJumps()`

The UI has no automated tests (DOM only). Verify it manually in Step 6.

- [ ] **Step 1: Update `index.html`**

Change `<span class="input-group__label">Double Jump</span>` to:

```html
        <span class="input-group__label">Stock Jumps</span>
```

Change `<div id="double-jump"></div>` to:

```html
      <div id="jumps"></div>
```

- [ ] **Step 2: Update `src/style.css`**

Replace:

```css
#double-jump {
  margin-top: 16px;
}

#double-jump:empty {
  display: none;
}
```

with:

```css
#jumps {
  margin-top: 16px;
}

#jumps:empty {
  display: none;
}

.dj__none {
  color: #777;
  font-style: italic;
}
```

- [ ] **Step 3: Update `src/ui.js`**

Replace `clearDoubleJump`:

```js
export function clearJumps() {
  document.getElementById('jumps').innerHTML = ''
}
```

Delete `renderDJImpossibleBody` entirely (from `function renderDJImpossibleBody(analysis, revenueLabel) {` through its closing `}`).

Replace `renderDJCard` and `setDoubleJumps` with:

```js
function renderJumpCard({ jumpLabel, payLabel, multiplier, analysis }, price, rate) {
  return `
    <div class="dj__card">
      <div class="dj__header dj__header--ok">
        <span class="dj__title">${jumpLabel} — ${payLabel} (≥ $${price * multiplier} total)</span>
        <span class="dj__status--ok">Possible ✓</span>
      </div>
      <div class="dj__body">${renderDJPossibleBody(analysis, rate)}</div>
    </div>`
}

export function setJumps(possibleJumps, price, rate) {
  document.getElementById('jumps').innerHTML = possibleJumps.length
    ? possibleJumps.map(jump => renderJumpCard(jump, price, rate)).join('')
    : '<div class="dj__none">No jumps possible</div>'
}
```

Leave `renderDJPossibleBody` and `fmtSigned` unchanged.

- [ ] **Step 4: Update `src/main.js`**

In the ui.js import line, replace `setDoubleJumps, clearDoubleJump` with `setJumps, clearJumps`. Replace both `clearDoubleJump()` calls with `clearJumps()`.

Add this helper above `update()`:

```js
const JUMP_COMBINATIONS = [
  { jumpLabel: 'Double Jump', payLabel: 'Full Pay', multiplier: 2, analyze: fullPayJumpAnalysis },
  { jumpLabel: 'Double Jump', payLabel: 'Half Pay', multiplier: 2, analyze: halfPayJumpAnalysis },
  { jumpLabel: 'Single Jump', payLabel: 'Full Pay', multiplier: 1, analyze: fullPayJumpAnalysis },
  { jumpLabel: 'Single Jump', payLabel: 'Half Pay', multiplier: 1, analyze: halfPayJumpAnalysis },
]

function possibleJumps(revenue, company, price) {
  return JUMP_COMBINATIONS
    .map(({ analyze, ...combo }) => ({ ...combo, analysis: analyze(revenue, company, price, combo.multiplier) }))
    .filter(jump => jump.analysis.possible)
}
```

Replace the `if (price > 0) { ... } else { ... }` block at the end of `update()` with:

```js
  if (price > 0) {
    setJumps(possibleJumps(revenue, company, price), price, rate)
  } else {
    clearJumps()
  }
```

- [ ] **Step 5: Run tests and build**

Run: `npm test && npm run build`
Expected: all tests PASS; the build succeeds with no errors.

- [ ] **Step 6: Manual check in the browser**

Run: `npm run dev` and open the printed URL. With 10 shares, treasury 0, cash 0, loans 0, rate $5:
- Price — and revenue $100 → the jumps section is hidden.
- Price $50, revenue $100 → cards are shown in this order: Double — Full Pay, Single — Full Pay, Single — Half Pay. Double — Half Pay is absent: half pay is only $50 and needs the price at $25, which isn't reachable.
- Price $600, revenue $10 → shows "No jumps possible".
- Revenue cleared → the section is hidden.

- [ ] **Step 7: Commit**

```bash
git add index.html src/style.css src/ui.js src/main.js
git commit -m "feat: show possible single and double jumps for full and half pay"
```
