# Treasury Shares Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the treasury shares input only produces valid values — a non-negative integer no greater than `shares - 2`.

**Architecture:** Two small edits: add `step="1"` to the treasury HTML input (browser-level integer hint), and tighten the `t` clamp in `main.js` to floor and bound the value before it reaches any calc function. No new files, no new UI.

**Tech Stack:** Vanilla JS (ES modules), Vite, Vitest

---

### Task 1: Add step="1" to treasury input and tighten clamp in main.js

**Files:**
- Modify: `index.html`
- Modify: `src/main.js`

These two changes are a single logical unit and ship together.

- [ ] **Step 1: Add `step="1"` to the treasury input in `index.html`**

Find this line:

```html
<input id="treasury" type="number" min="0" max="8" value="0" />
```

Replace with:

```html
<input id="treasury" type="number" min="0" max="8" step="1" value="0" />
```

- [ ] **Step 2: Tighten the treasury clamp in `src/main.js`**

Find this line inside `update()`:

```js
const t = shares === 2 ? 0 : treasury
```

Replace with:

```js
const t = shares === 2 ? 0 : Math.max(0, Math.min(Math.floor(treasury), shares - 2))
```

This handles:
- Decimals: `Math.floor(1.9)` → `1`
- Negatives: `Math.max(0, -1)` → `0`
- Over-max: `Math.min(8, 10)` → `8` (for a 10-share company `shares - 2 = 8`)

- [ ] **Step 3: Run tests to confirm no regressions**

```
npm test
```

Expected output:
```
✓ src/calculator.test.js (13 tests)

Test Files  1 passed (1)
      Tests  13 passed (13)
```

- [ ] **Step 4: Commit**

```bash
git add index.html src/main.js
git commit -m "feat: validate treasury shares input"
```
