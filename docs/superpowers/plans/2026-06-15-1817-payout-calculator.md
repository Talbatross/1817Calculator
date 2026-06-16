# 1817 Payout Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based dividend payout calculator for 1817 that shows per-share payouts for full pay, half pay, and withhold given a revenue amount and share count.

**Architecture:** Vite + vanilla JS single-page app. Calculation logic lives in a pure module (`calculator.js`) with no DOM access, wired to the UI via `main.js`. This keeps the logic independently testable with Vitest.

**Tech Stack:** Vite 5, Vitest 1, vanilla JS (ES modules), plain CSS.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Page markup, input elements, result display elements |
| `src/calculator.js` | Pure functions: `fullPay`, `halfPay`, `withhold` |
| `src/calculator.test.js` | Vitest unit tests for calculator functions |
| `src/ui.js` | DOM read (`getInputs`) and write (`setResults`) |
| `src/main.js` | Wires input events → calculator → ui |
| `src/style.css` | All styles |
| `package.json` | npm scripts and dependencies |
| `vite.config.js` | Vite + Vitest configuration |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "1817-calculator",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  test: {}
})
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json vite.config.js package-lock.json
git commit -m "chore: scaffold Vite + Vitest project"
```

---

## Task 2: Calculator Logic (TDD)

**Files:**
- Create: `src/calculator.js`
- Create: `src/calculator.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/calculator.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { fullPay, halfPay, withhold } from './calculator.js'

describe('fullPay', () => {
  it('divides revenue evenly by share count', () => {
    expect(fullPay(70, 10)).toBe(7)
    expect(fullPay(60, 5)).toBe(12)
    expect(fullPay(40, 2)).toBe(20)
  })
})

describe('halfPay', () => {
  it('rounds withheld down to nearest $10 for 10-share companies', () => {
    // $70: withheld = floor(70/20)*10 = $30, payout = $40, per share = $4
    expect(halfPay(70, 10)).toBe(4)
    // $60: withheld = $30, payout = $30, per share = $3
    expect(halfPay(60, 10)).toBe(3)
    // $80: withheld = $40, payout = $40, per share = $4
    expect(halfPay(80, 10)).toBe(4)
    // $90: withheld = $40, payout = $50, per share = $5
    expect(halfPay(90, 10)).toBe(5)
  })

  it('splits evenly for 5-share companies', () => {
    expect(halfPay(60, 5)).toBe(6)
    expect(halfPay(100, 5)).toBe(10)
  })

  it('splits evenly for 2-share companies', () => {
    expect(halfPay(60, 2)).toBe(15)
    expect(halfPay(40, 2)).toBe(10)
  })
})

describe('withhold', () => {
  it('always returns 0', () => {
    expect(withhold()).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './calculator.js'`

- [ ] **Step 3: Implement `src/calculator.js`**

```js
export function fullPay(revenue, shares) {
  return revenue / shares
}

export function halfPay(revenue, shares) {
  if (shares === 10) {
    const withheld = Math.floor(revenue / 20) * 10
    return (revenue - withheld) / 10
  }
  return revenue / 2 / shares
}

export function withhold() {
  return 0
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calculator.js src/calculator.test.js
git commit -m "feat: add payout calculation logic with tests"
```

---

## Task 3: HTML Markup

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>1817 Payout Calculator</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div class="container">
      <h1>1817 Payout Calculator</h1>
      <div class="inputs">
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
      </div>
      <div class="results">
        <div class="result result--full">
          <span class="result__label">Full Pay</span>
          <span class="result__value" id="result-full">—</span>
        </div>
        <div class="result result--half">
          <span class="result__label">Half Pay</span>
          <span class="result__value" id="result-half">—</span>
        </div>
        <div class="result result--withhold">
          <span class="result__label">Withhold</span>
          <span class="result__value" id="result-withhold">—</span>
        </div>
      </div>
    </div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add HTML markup for calculator"
```

---

## Task 4: Styles

**Files:**
- Create: `src/style.css`

- [ ] **Step 1: Create `src/style.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
}

.container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  width: 100%;
  max-width: 400px;
}

h1 {
  font-size: 1.25rem;
  margin-bottom: 20px;
  color: #111;
}

.inputs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: #555;
  flex: 1;
}

input,
select {
  font-size: 1rem;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

.results {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.result + .result {
  border-top: 1px solid #ddd;
}

.result--full     { background: #e8f5e9; }
.result--half     { background: #fff8e1; }
.result--withhold { background: #fbe9e7; }

.result__label { color: #333; }
.result__value { font-weight: bold; font-size: 1.1rem; color: #111; }
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat: add styles"
```

---

## Task 5: UI Module

**Files:**
- Create: `src/ui.js`

- [ ] **Step 1: Create `src/ui.js`**

```js
export function getInputs() {
  return {
    revenue: Number(document.getElementById('revenue').value),
    shares: Number(document.getElementById('shares').value),
  }
}

export function setResults(full, half, hold) {
  document.getElementById('result-full').textContent = full
  document.getElementById('result-half').textContent = half
  document.getElementById('result-withhold').textContent = hold
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui.js
git commit -m "feat: add UI read/write module"
```

---

## Task 6: Main Wiring

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Create `src/main.js`**

```js
import { fullPay, halfPay, withhold } from './calculator.js'
import { getInputs, setResults } from './ui.js'

function update() {
  const { revenue, shares } = getInputs()

  if (!revenue) {
    setResults('—', '—', '—')
    return
  }

  setResults(
    `$${fullPay(revenue, shares)}/share`,
    `$${halfPay(revenue, shares)}/share`,
    `$${withhold()}/share`
  )
}

document.getElementById('revenue').addEventListener('input', update)
document.getElementById('shares').addEventListener('change', update)

update()
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: wire inputs to calculator and display"
```

---

## Task 7: Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected output includes a local URL like `http://localhost:5173`

- [ ] **Step 2: Verify these cases in the browser**

Open the URL. Test each case manually:

| Revenue | Shares | Full Pay | Half Pay | Withhold |
|---|---|---|---|---|
| 0 | 10 | — | — | — |
| 70 | 10 | $7/share | $4/share | $0/share |
| 60 | 10 | $6/share | $3/share | $0/share |
| 60 | 5 | $12/share | $6/share | $0/share |
| 40 | 2 | $20/share | $10/share | $0/share |

- [ ] **Step 3: Stop the dev server**

Press `Ctrl+C` in the terminal.
