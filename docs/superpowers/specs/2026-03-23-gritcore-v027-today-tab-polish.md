# GritCore v0.27 — Today Tab Polish Spec

**Date:** 2026-03-23
**Scope:** Today tab only — no changes to Record, Report, Forge, header structure, tab bar, or FAB.

## Problem Statement

At 100% completion, the Today tab becomes a uniform gold wall where every card looks identical. The quote occupies prime real estate above disciplines. Score cards have cramped typography. A horizontal scrollbar bug breaks the native feel. Category "C4" renders raw instead of resolving.

## Changes

### 1. Fix horizontal scrollbar (bug)
- Add `overflow-x: hidden` to `.content` and `#app` in `gritcore.css`
- Root cause: likely a child element slightly wider than the container

### 2. Restructure Today tab vertical order
- **Before:** Quote → Scores → Section Header → Disciplines → Footer
- **After:** Scores → Section Header → Disciplines → Quote → Footer
- Edit `renderToday()` in `index.html` to reorder the HTML blocks
- The quote becomes a contemplative reward at the bottom, not a barrier to interaction

### 3. Score card typography overhaul
- `.sc-num`: increase to `font-size: 26px`, `font-weight: 700`
- Word label (`.sc-word`): decrease to `font-size: 9px`, color `var(--ctdd)`
- Category label (`.sc-lbl`): use `var(--ctdd)` for less visual competition
- Card padding: increase vertical padding by `8px`
- These changes go in `gritcore.css` overrides

### 4. Done-state card differentiation
- Reduce done-state gold border to `opacity: 0.18` (subtler)
- Graduated gold wash: `.hcard.done:nth-child(1)` through `:nth-child(n)` with increasing `--goldb` alpha
- Add a small `✓` checkmark badge in top-right of done cards via CSS pseudo-element
- Cards retain individual identity even when all are completed

### 5. Fix C4 category bug
- Investigate `getCatName()` — the category ID "C4" is not resolving to a name
- Likely a user-created category where the ID doesn't match any entry in `cats[]`
- Fix: ensure `getCatName` returns a fallback or the category was properly saved

### 6. Streak pill repositioning
- Move `.hcard-streak` from inline with buttons to below `.hcard-cat` (under category label)
- Declutters the action area on the right side of each card

### 7. Section header simplification
- Change "DISCIPLINES — {date}" to "TODAY'S DISCIPLINES"
- Date is already in the header — showing it twice is redundant

## Files Modified
- `gritcore-app/www/index.html` — `renderToday()`, `renderHabits()`, score card rendering
- `gritcore-app/www/gritcore.css` — score card styles, done-state styles, overflow fix

## Out of Scope
- Header layout, tab bar, FAB, other tabs
- Heat system logic (stays as-is)
- Marble backdrop, ambient veil
- Any localStorage schema changes
