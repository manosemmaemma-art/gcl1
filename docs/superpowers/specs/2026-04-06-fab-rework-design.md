# FAB Rework — Design Spec
**Date:** 2026-04-06
**Branch:** feature/ios-a11y-v031
**Scope:** Visual rework of the FAB button + FAB bottom sheet

---

## Summary

Rework the FAB from a solid heat-colored circle into a premium frosted-glass button with heat-reactive golden tinting. Simultaneously update the FAB bottom sheet with a progress bar, completion count, and strikethrough state for done/failed disciplines. The FAB icon rotates from `+` to `×` when the sheet is open.

---

## FAB Button

### Current state
- `60×60px` solid circle, `background: var(--heat)` (silver→gold fill)
- Plain `+` text at `28px`, color `#111`
- Heat glow via `box-shadow: 0 0 16px var(--heat)`
- No open/close state visual feedback

### Target state
- **Size:** `60×60px` (unchanged)
- **Background:** `rgba(var(--accent-r),var(--accent-g),var(--accent-b), calc(var(--heat-glow-a) * 0.28))` — glass base, never opaque
- **Border:** `1.5px solid rgba(var(--accent-r),var(--accent-g),var(--accent-b), max(0.12, var(--heat-glow-a)))` — scales with heat
- **Glow:** `box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 calc(var(--heat-glow-a) * 28px) rgba(var(--accent-r),var(--accent-g),var(--accent-b),calc(var(--heat-glow-a)*0.55))` — outer drop shadow stays dark (iOS-safe), inner glow scales with heat
- **Icon:** `+` retained, color `rgba(220,190,90, max(0.45, var(--heat-glow-a)))` — faint when cold, vivid when hot
- **Open state:** `+` rotates `45deg` → visually becomes `×`. Uses `transform: rotate(45deg)` on the icon `<span>` (GPU-safe, no layout shift)
- **Transition:** `0.35s cubic-bezier(0.22, 1, 0.36, 1)` on box-shadow, background, icon color, and rotation

### Heat thresholds (driven by existing CSS vars — no new JS)
`--heat-glow-a` is already set by `updateHeat()` in JS (ranges 0→~0.8). `--accent-r/g/b` are set on body.
No new variables or JS hooks needed.

| State | --heat-glow-a approx | Border opacity | Glow spread | Icon opacity |
|---|---|---|---|---|
| Cold (0 done) | 0 | 0.12 (min-clamped) | 0px | 0.45 (min-clamped) |
| Warm (some done) | ~0.4 | 0.40 | ~11px | ~0.82 |
| Hot (all done) | ~0.8 | ~0.80 | ~22px | 1.00 |

### iOS safety rules
- No `transition` on `background-color` with `rgba` — use `opacity` trick or `box-shadow` instead
- Dark shadow base (`rgba(0,0,0,...)`) for glow — no colored shadow on the outer drop shadow
- `transform: rotate()` is GPU-safe and fine on fixed elements
- No change to `touch-action`, `overflow`, or scroll behavior

---

## FAB Sheet

### Current state
- Header: "Today's Disciplines" title only, no count
- List items: plain text rows — no visual state for done/failed/pending
- No progress indicator
- `+` rotates to `×` on open: **not implemented**

### Target state

#### Header
- Left: `"TODAY"` label — `11px`, `letter-spacing: 0.13em`, uppercase, `rgba(255,255,255,0.4)`
- Right: `"X/Y"` count — `22px bold`, `rgba(220,185,80,0.95)`, turns fully gold when X === Y

#### Progress bar
- `2px` tall track below header: `background: rgba(255,255,255,0.06)`
- Fill: `linear-gradient(90deg, rgba(201,168,76,0.55), rgba(240,208,100,0.95))`
- Fill `width` = `(done / total) * 100%`
- Transitions: `width 0.4s cubic-bezier(0.22, 1, 0.36, 1)` — animates after each `markH()` call
- Margin: `0 18px` — inset from edges

#### Discipline rows
Each row: `dot` + `name` + `status icon`

| State | Dot | Name | Status |
|---|---|---|---|
| Pending | `border: 1.5px solid rgba(255,255,255,0.18)` | Normal | — |
| Done | Gold fill + subtle glow | Strikethrough, gold-muted | `✓` |
| Failed | Red fill | Strikethrough, red-muted | `✗` |

- Strikethrough color: `rgba(201,168,76,0.3)` for done, `rgba(180,60,60,0.3)` for failed
- Row border-bottom: `1px solid rgba(255,255,255,0.04)` — subtle divider
- ✓ and ✗ tap animations: **preserved** — `markH()` already fires these; sheet rows call the same function

#### "Add a Discipline" row
- Unchanged position (bottom of list)
- Styling: faint dashed circle `+` icon + label, `rgba(255,255,255,0.22)`

---

## Interactions

### FAB open/close
- **Open:** `openFabSheet()` — add `.rotating` class to FAB icon span → `transform: rotate(45deg)`
- **Close:** `closeFabSheet()` — remove `.rotating` class → rotates back to `0deg`
- The sheet spring animation (`cubic-bezier(0.22, 1, 0.36, 1)`) is unchanged

### Sheet discipline tap
- Tapping a discipline row calls `markH(id, 'done'|'failed', btn, evt)` — existing function, unchanged
- After `markH()` resolves, call `updateSheetProgress()` — a new small helper that:
  1. Recounts done disciplines from `effL()`
  2. Updates `#sheet-count` text
  3. Animates `#sheet-progress-fill` width
  4. Updates dot + name CSS classes for that row

### No new localStorage keys. No new global state.

---

## Files to change
- `gritcore-app/www/index.html` — FAB button structure (add icon `<span>`), sheet header (add count + progress bar), sheet row structure (add dot + status elements)
- `gritcore-app/www/gritcore.css` — FAB glass treatment, rotation, sheet header styles, row dot/name/status styles, progress bar
- `gritcore-app/www/index.html` (JS) — `openFabSheet()` / `closeFabSheet()` add/remove `.rotating`, `renderSheetList()` outputs new row HTML, new `updateSheetProgress()` helper

## Backup files required
Before changes: `index.0.31.html`, `gritcore.0.31.css` (or current version backups if not yet done)

---

## Out of scope
- Sheet emoji/avatar icons per discipline (deferred)
- Sheet streak counts per row (deferred)
- Speed-dial / multi-action FAB (deferred)
- FAB position change (stays centered above nav bar)
