# Collapse/Expand Payout Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a chevron toggle button to the Full Pay and Half Pay result headers that collapses/expands the share payout table, defaulting to collapsed, persisting state across re-renders.

**Architecture:** A module-level `tableState` object in `ui.js` tracks `{ full: boolean, half: boolean }` (false = collapsed). Toggle buttons in the HTML header wire to a `toggleTable()` helper that flips the state, swaps CSS classes, and updates `aria-expanded`. `setShareTables()` temporarily un-hides elements before measuring for chunk-fitting, then re-applies the collapsed state. Toggle buttons are hidden when there is no table to show (revenue=0, shares=2).

**Tech Stack:** Vanilla JS (ES modules), Vite, CSS (no frameworks).

## Global Constraints

- No new dependencies — vanilla JS and CSS only.
- Follow existing code style in `ui.js` (no semicolons at start of statements except chained arrays, template literals for HTML, exported functions for public API).
- Do not modify `calculator.js` or `calculator.test.js` — those are pure logic and unaffected.

---

### Task 1: CSS — Toggle Button Styles and Collapsed Class

**Files:**
- Modify: `src/style.css`

**Interfaces:**
- Produces: `.result__share-table--collapsed`, `.result__toggle`, `.result__toggle--expanded` — used by Tasks 2 and 3.

- [ ] **Step 1: Add styles to `src/style.css`**

Append the following at the end of `src/style.css`:

```css
.result__share-table--collapsed {
  display: none;
}

.result__toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: #555;
  flex-shrink: 0;
  margin-right: 8px;
}

.result__toggle svg {
  transition: transform 0.15s ease;
}

.result__toggle--expanded svg {
  transform: rotate(90deg);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "style: add toggle button and collapsed table styles"
```

---

### Task 2: HTML — Add Chevron Toggle Buttons

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `.result__toggle`, `.result__toggle--expanded` (CSS from Task 1)
- Produces: `#toggle-full`, `#toggle-half` DOM elements — referenced by Task 3.

- [ ] **Step 1: Add toggle button to the Full Pay header**

In `index.html`, replace the Full Pay `.result__header` block (lines 63–69) with:

```html
          <div class="result__header">
            <button class="result__toggle" id="toggle-full" aria-expanded="false" aria-controls="result-full-table" aria-label="Toggle full pay table">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="result__label">Full Pay</span>
            <div class="result__right">
              <span class="result__value" id="result-full">—</span>
              <div class="result__breakdown" id="result-full-breakdown"></div>
            </div>
          </div>
```

- [ ] **Step 2: Add toggle button to the Half Pay header**

Replace the Half Pay `.result__header` block (lines 74–80) with:

```html
          <div class="result__header">
            <button class="result__toggle" id="toggle-half" aria-expanded="false" aria-controls="result-half-table" aria-label="Toggle half pay table">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="result__label">Half Pay</span>
            <div class="result__right">
              <span class="result__value" id="result-half">—</span>
              <div class="result__breakdown" id="result-half-breakdown"></div>
            </div>
          </div>
```

- [ ] **Step 3: Run dev server and verify buttons render**

```bash
npm run dev
```

Open the browser. Check:
- A small right-pointing chevron appears to the left of "Full Pay" and "Half Pay" labels.
- The chevron has pointer cursor on hover.
- The share tables still show (JS not wired yet, so no collapse behavior).
- The Withhold row has no chevron.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add chevron toggle buttons to full pay and half pay headers"
```

---

### Task 3: JS — Wire State, Toggle Logic, and Persist Across Re-renders

**Files:**
- Modify: `src/ui.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `#toggle-full`, `#toggle-half`, `#result-full-table`, `#result-half-table` (DOM from Task 2); `.result__share-table--collapsed`, `.result__toggle--expanded` (CSS from Task 1)
- Produces: `initToggleButtons()` export — called by `main.js`

- [ ] **Step 1: Add `tableState` module variable to `ui.js`**

After the `SHARE_TABLE_MAX` constant (line 48 of current `src/ui.js`), add:

```js
const tableState = { full: false, half: false }
```

- [ ] **Step 2: Add `toggleTable` private function to `ui.js`**

After the `tableState` line, add:

```js
function toggleTable(which) {
  tableState[which] = !tableState[which]
  const tableEl = document.getElementById(`result-${which}-table`)
  const btnEl = document.getElementById(`toggle-${which}`)
  tableEl.classList.toggle('result__share-table--collapsed', !tableState[which])
  btnEl.classList.toggle('result__toggle--expanded', tableState[which])
  btnEl.setAttribute('aria-expanded', String(tableState[which]))
}
```

- [ ] **Step 3: Add `initToggleButtons` exported function to `ui.js`**

After `toggleTable`, add:

```js
export function initToggleButtons() {
  document.getElementById('toggle-full').addEventListener('click', () => toggleTable('full'))
  document.getElementById('toggle-half').addEventListener('click', () => toggleTable('half'))
}
```

- [ ] **Step 4: Update `clearShareTables` to hide toggle buttons**

Replace the existing `clearShareTables` function:

```js
export function clearShareTables() {
  document.getElementById('result-full-table').innerHTML = ''
  document.getElementById('result-half-table').innerHTML = ''
  document.getElementById('toggle-full').hidden = true
  document.getElementById('toggle-half').hidden = true
}
```

- [ ] **Step 5: Update `setShareTables` to manage toggle visibility and preserve collapsed state**

Replace the existing `setShareTables` function:

```js
export function setShareTables(shares, fullPerShare, halfPerShare) {
  const max = SHARE_TABLE_MAX[shares]
  const fullEl = document.getElementById('result-full-table')
  const halfEl = document.getElementById('result-half-table')
  const fullBtn = document.getElementById('toggle-full')
  const halfBtn = document.getElementById('toggle-half')
  if (!max) {
    fullEl.innerHTML = ''
    halfEl.innerHTML = ''
    fullBtn.hidden = true
    halfBtn.hidden = true
    return
  }
  fullBtn.hidden = false
  halfBtn.hidden = false
  // Temporarily reveal both elements so fitShareTable can measure clientWidth correctly.
  // (display:none produces clientWidth=0, which breaks the chunk-fitting loop.)
  // No visual flash because JS runs synchronously before the browser paints.
  fullEl.classList.remove('result__share-table--collapsed')
  halfEl.classList.remove('result__share-table--collapsed')
  fitShareTable(fullEl, max, fullPerShare)
  fitShareTable(halfEl, max, halfPerShare)
  // Re-apply collapsed state from tableState
  fullEl.classList.toggle('result__share-table--collapsed', !tableState.full)
  halfEl.classList.toggle('result__share-table--collapsed', !tableState.half)
  fullBtn.classList.toggle('result__toggle--expanded', tableState.full)
  halfBtn.classList.toggle('result__toggle--expanded', tableState.half)
  fullBtn.setAttribute('aria-expanded', String(tableState.full))
  halfBtn.setAttribute('aria-expanded', String(tableState.half))
}
```

- [ ] **Step 6: Update `main.js` to import and call `initToggleButtons`**

In `src/main.js`, update the `ui.js` import line to include `initToggleButtons`:

```js
import { getInputs, setResults, setCompanyBreakdowns, clearCompanyBreakdowns, setDoubleJumps, clearDoubleJump, setShareTables, clearShareTables, initToggleButtons } from './ui.js'
```

At the end of `main.js`, after `updateTreasuryVisibility()` and `update()`, add:

```js
initToggleButtons()
```

- [ ] **Step 7: Run dev server and verify full behavior**

```bash
npm run dev
```

Check each of the following:

1. **Default collapsed:** Enter revenue (e.g. 100), select 10 shares. Share tables should be hidden — no table visible under Full Pay or Half Pay.
2. **Expand:** Click the Full Pay chevron. The table expands, chevron rotates to point down.
3. **Collapse:** Click again. Table hides, chevron returns to pointing right.
4. **State persists on re-render:** Expand Full Pay, then change revenue. Table stays expanded after re-render.
5. **Both tables independent:** Expand Full Pay, leave Half Pay collapsed. Change inputs. Full Pay stays expanded, Half Pay stays collapsed.
6. **No table = no toggle:** Select 2 shares. Both chevrons disappear (hidden). Switch back to 10 shares — chevrons reappear, tables stay collapsed.
7. **Revenue cleared:** Enter revenue then clear it (set to 0). Both chevrons hide. Re-enter revenue — chevrons reappear, tables are collapsed.
8. **Accessibility:** Inspect `aria-expanded` on `#toggle-full` — it should be `"false"` when collapsed and `"true"` when expanded.

- [ ] **Step 8: Commit**

```bash
git add src/ui.js src/main.js
git commit -m "feat: wire collapse/expand toggle logic for payout tables"
```
