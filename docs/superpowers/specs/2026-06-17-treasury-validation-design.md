# Treasury Shares Validation Design

**Date:** 2026-06-17

## Goal

Ensure the treasury shares input only produces valid values in calculations: a non-negative integer no greater than `shares - 2`.

## Current State

- `input.min="0"` is set in HTML
- `input.max` is dynamically set to `shares - 2` in JS
- Value is clamped to new max when share count changes
- Gap: user can type a decimal (e.g. `1.5`) or negative (e.g. `-1`), which passes through `Number()` to the calc functions unchanged

## Changes

### index.html

Add `step="1"` to the treasury input:

```html
<input id="treasury" type="number" min="0" max="8" step="1" value="0" />
```

This tells the browser the field only accepts integers. Browsers show a native validation hint (e.g. "Please enter a valid value") when the user tabs away with a fractional value, making the constraint self-documenting without custom UI.

### main.js

Replace the current treasury clamp:

```js
const t = shares === 2 ? 0 : treasury
```

With a full clamp that handles negatives, decimals, and out-of-range values:

```js
const t = shares === 2 ? 0 : Math.max(0, Math.min(Math.floor(treasury), shares - 2))
```

- `Math.floor`: truncates decimals (1.9 → 1)
- `Math.max(0, ...)`: floors at 0 (negatives → 0)
- `Math.min(..., shares - 2)`: caps at legal maximum

## What Is Not Changing

- No error messages or validation UI — silent correction matches the app's current style
- `updateTreasuryVisibility` clamping logic (`input.value = input.max` on share change) is unchanged
- No changes to `calculator.js` or `ui.js`
