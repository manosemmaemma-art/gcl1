# GritCore v0.26 — Design Spec
> Status: APPROVED | Date: 2026-03-22 | Approach: A (Fix-First, Then Delight)

## Overview
Dark-only marble aesthetic. No light/dark theming. Three phases: foundation fixes, motion polish, delight features. All vanilla JS/CSS — no libraries, no build step.

**Files:** `gritcore-app/www/index.html` + `gritcore-app/www/gritcore.css`
**Backup before starting:** `index.0.25.html`, `gritcore.0.25.css` already exist. Create `index.0.26.html`, `gritcore.0.26.css` before first change.

---

## Phase 1 — Foundation

### 1.0 — Commit Rollback
Commit current working copy as first v0.26 commit:
- Removes `getDarkPct()`, `applyDarkness()`, `setInterval(applyDarkness)`, `body.dark` CSS
- Adds `devResetDate()` to dev console
- Adds `.rpt-section-hdr` CSS class (replaces 4 inline-styled section headers in `renderReport()`)
- Abandons `index.0.26.html` draft

### 1.1 — Token Unification
**Problem:** `gritcore.css` defines 11 `--color-*` vars that conflict with `index.html`'s `--ct/--cs/--gold` system, causing 14 `!important` overrides.

**Fix:** In `gritcore.css`, replace every `--color-*` reference with the matching `index.html` token:
| Old (gritcore.css) | New (index.html token) |
|---|---|
| `--color-surface` | `--bg` |
| `--color-card` | `--cs` |
| `--color-card-border` | `--cbor` |
| `--color-nav` | `--cs` |
| `--color-text-hi` | `--ct` |
| `--color-text-mid` | `--cts` |
| `--color-text-lo` | `--ctd` |
| `--color-gold` | `--gold` |
| `--color-silver` | `--cts` |
| `--color-blood` | `--blood` |
| `--color-blood-dim` | `--bloodb` |

After replacement: delete all `--color-*` definitions. Delete all 14 `!important` overrides.

### 1.2 — Spacing Scale
Add to `:root` in `index.html`:
```css
--sp-xs:4px; --sp-sm:8px; --sp-md:16px; --sp-lg:24px; --sp-xl:32px;
```
Audit and normalize padding/margin/gap across all 4 tabs in both files. Replace raw pixel values with scale tokens. Inconsistencies to fix:
- Today tab: card padding, gap between cards, header margin
- Record tab: grid cell spacing, month nav padding
- Report tab: section spacing, bar chart margins
- Forge tab: form field spacing, button padding

### 1.3 — Typography Lift
Minimum font size: **11px**. Lift all instances below threshold:
`6.5px→11px`, `7px→11px`, `7.5px→11px`, `8px→11px`, `8.5px→11px`, `9px→11px`
Labels stay `text-transform:uppercase` + `letter-spacing` — just readable.

### 1.4 — Inline Style Cleanup
Extract top 20 repeated inline styles to named CSS classes. Target patterns:
- Section header labels (`font-size`, `letter-spacing`, `text-transform`, `color:var(--ctdd)`)
- Card row layouts (`display:flex`, `align-items:center`, `gap`)
- Stat value + label pairs

### 1.5 — A11y: div→button
Convert 8 `<div onclick>` elements to `<button>` elements. Apply `background:none; border:none; cursor:pointer; padding:0` reset. No visual change.

---

## Phase 2 — Polish + Motion

### 2.1 — Staggered Card Entrance
On every `sw()` tab switch, discipline cards animate in:
- `@keyframes cardIn`: `opacity 0→1` + `translateY(8px→0)` over `0.25s ease-out`
- JS in `renderToday()`: assign `style="animation-delay: ${i*40}ms"` per card
- Subtle — not bouncy, no spring

### 2.2 — Progress Bar Transition
Today completion bar: add `transition: width 0.4s cubic-bezier(0.25,1,0.5,1)` to the bar element CSS. Smooth fill on every `markH()` call.

### 2.3 — Heat Veil Ambient Pulse
When `--heat > 0.7`: `#heat-veil` gets class `.pulsing` → CSS `@keyframes heatPulse` oscillates opacity ±0.04 over 3s infinite. Removed when heat drops below 0.7.

---

## Phase 3 — Delight + Features

### 3.1 — Perfect Day Moment
Triggered in `updateHeat(n, n)` when `completed === total && total > 0`.
- Full-gold `#heat-veil` flash: opacity → 0.35 over 0.3s, then fade back over 0.9s
- Unique motivation line: *"Perfect. Every discipline. Today you forged something real."*
- Confetti burst: 12 particles, pure CSS `@keyframes confettiFall`. Gold (`#c9a84c`) + white (`rgba(255,255,255,0.8)`). 1–1.4s fall, random x-spread. Injected into `<body>`, removed after animation.
- Only fires once per calendar day (track in `sessionStorage` key `gc:perfectFired:YYYY-MM-DD`)

### 3.2 — Streak Milestone Toasts
In `markH()`, after computing new streak via `calcHabitStreak(id)`:
Check milestones `[7, 14, 30, 100]`. If hit, call `showToast()` with forge-voice message:
- 7: *"Seven days. The forge is lit."*
- 14: *"Two weeks. Discipline compounds."*
- 30: *"Thirty days. You're forged."*
- 100: *"One hundred. Unbreakable."*

Debounce: only once per habit per milestone (track in `localStorage` `gc1:milestones` as `{habitId: [7,14]}` reached array).

### 3.3 — Tab Bar Labels
Add `<span class="bni-lbl">Today</span>` etc. below each tab icon in HTML.
CSS: `font-size:8px; letter-spacing:1.2px; text-transform:uppercase; opacity: inherited from .bni`.
Labels: Today · Record · Report · Forge.

### 3.4 — Settings Icon
**Location:** Top-right of `#hdr` header, replacing or alongside the streak display.
**Element:** `<button id="settings-btn">⚙</button>` — opens `#settings-sheet` bottom sheet.
**Sheet:** Reuses `.fab-sheet` pattern + spring cubic-bezier open animation.
**Contents (v0.26 scope):**
- Notification reminder time (stores to `localStorage` `gc1:notif-time`)
- "Reset all data" danger button (calls `devResetAll()` with confirm)
- Version label: *GritCore v0.26*

### 3.5 — Discipline Reorder (Hold + Drag)
**Storage:** `localStorage` key `gc1:order` — array of habit IDs in user-defined order.
**effH() update:** merge `habits` with `gc1:order` — return habits sorted by order array, new habits appended at end.
**Interaction:**
1. `pointerdown` on `.hcard` → start 500ms long-press timer
2. If held: card gets class `.dragging` (scale 1.02, enhanced shadow, cursor grab)
3. `pointermove`: calculate drag delta, reorder adjacent cards visually using `translateY`
4. `pointerup` / `pointercancel`: commit new order to `gc1:order`, re-render, cancel if tap (< 500ms)
**Edge cases:** Disabled during mark-done/fail (pointer must hit `.hbtn` not card body). Placeholder mode: no-op.

---

## Data Storage Summary
| Key | Type | Purpose |
|---|---|---|
| `gc1:habits` | Array | Habit definitions (existing) |
| `gc1:logs` | Object | Daily logs (existing) |
| `gc1:order` | Array of IDs | Discipline display order (NEW) |
| `gc1:milestones` | Object `{id:[7,14]}` | Streak milestones reached (NEW) |
| `gc1:notif-time` | String HH:MM | Notification time (NEW) |
| `gc:perfectFired:DATE` | sessionStorage | Perfect day once-per-day gate (NEW) |

---

## What Does NOT Change
- Heat system (`--heat`, `updateHeat()`, `#heat-veil`) — preserved
- All v0.25 features (month nav, 7-day bars, month-over-month, Record tab) — preserved
- Ripple animation, spring sheet, top-banner toast — preserved
- `marble-interpolator.js` — untouched (v2 feature)
- Dev console — preserved (gains `devResetDate()`)
- `paywall.js`, `config.js` — untouched
