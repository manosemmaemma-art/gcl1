# GritCore v0.28 — Record Tab: The Forge Ring
**Spec date:** 2026-03-23
**Status:** Approved for implementation

---

## 1. Context & Goal

The current Record tab is split into two disconnected views: a GitHub-style heatmap (current month) and a plain day-list with progress bars (past months). It feels cold, static, and redundant with the Report tab.

**Goal:** Replace the entire Record tab with a single, immersive, 3D-interactive screen called **The Forge Ring**. It must feel alive, gamified, and unlike anything else in the app — the visual record of a warrior's discipline history, not a stats dashboard.

---

## 2. Design Overview

Two vertically stacked zones, each interactive:

```
┌────────────────────────────────┐
│  ‹   MARCH 2026   ›            │  ← minimal sticky header, 52px
├────────────────────────────────┤
│                                │
│   [ghost month name, 96px]     │
│                                │
│       ╭── Iron Ring ──╮        │  ← draggable 3D tilt, 310px
│      /  31 wedge segs  \       │     tap wedge → day detail
│     |    68%  Forged    |      │     today wedge pulses
│      \                /        │
│       ╰───────────────╯        │
│                                │
├──── History ───────────────────│  ← 1px divider
│  ▌▌▌▌▌▌▌ terrain strip ▌▌▌   │  ← 3D perspective bars, ~190px
│  Sep Oct Nov Dec Jan Feb Mar   │     draggable with momentum
└────────────────────────────────┘
│  Today │ Forge │ Record │ Report│  ← existing nav (unchanged)
```

**Total height used:** 52 (header) + 360 (ring zone) + 8 (sep) + 16 (label) + 190 (terrain) + 66 (nav) = 692px — fills a 690–750px phone perfectly.

---

## 3. Zone A — The Iron Ring

### Layout
- SVG-based radial ring, 256×256px, centered in a 360px-tall zone
- Outer radius R=122, inner radius ri=82 → ring band width = 40px
- 31 (or 28/30) path segments (wedges), one per day of the month
- Ghost month name behind ring: `font-size: 96px`, Cormorant Garamond italic, `rgba(201,168,76,0.045)`, `translateZ(-20px)` — parallax depth layer

### Ring Center (default state)
- `%` number: Cormorant Garamond 46px bold, `#c9a84c`
- Word label: "Forged / Holding / Wavering / Broken" — 9px Josefin, `#7a7060`
- Day count: "22 days logged" — 8px, `#4a4038`

### Wedge States
| State | Fill color | Notes |
|-------|-----------|-------|
| 100% Perfect | `rgba(201,168,76,0.93)` | Brightest gold |
| 70–99% | `rgba(201,168,76,0.60)` | Rich gold |
| 40–69% | `rgba(201,168,76,0.32)` | Mid amber |
| 1–39% | `rgba(200,50,40,0.45)` | Crimson — failed |
| 0% / no data | `rgba(255,255,255,0.025)` | Near invisible |
| Future | `rgba(255,255,255,0.02)` | Ghosted, no interaction |
| Today | `#e8c84c` | Pulsing glow animation |
| null (no habits) | `rgba(255,255,255,0.02)` | Empty spacer |

### Today Wedge Animation
```css
@keyframes todayWedge {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(255,220,70,0.9)); }
  50%       { filter: drop-shadow(0 0 16px rgba(255,220,70,1)); }
}
```
Applied as SVG `<style>` inline, 2.5s ease-in-out infinite.

### 3D Tilt Interaction
- The ring lives inside `.ring-tilt-wrap` with `transform-style: preserve-3d`
- On `mousedown`/`touchstart`: capture pointer
- On `move`: compute `dx`/`dy` delta → apply `rotateX(-dy*factor) rotateY(dx*factor)`, clamped ±22°/±18°
- On `release`: exponential damping via `requestAnimationFrame` (`velocity *= 0.88` per frame) until `|v| < 0.05`
- Ghost name also tilts (same container) creating parallax depth
- Parent `perspective: 700px` on `.ring-scene`

### Wedge Tap — Day Detail
When user taps a past/logged wedge:
1. `.ring-center` fades out (`opacity: 0`)
2. `.day-detail` fades in (`opacity: 1`) inside the ring center
3. Shows: date string, `%` + word, per-discipline rows (✓ done / ✗ failed / · skipped)
4. "✕ close" tap restores ring center
5. Today wedge tap shows "In progress…" with current state

Day detail data: look up `logs[dateStr]` for each habit in `effH()`.

### Month Entry Animation
On `drawRing()` with `animate=true`, each wedge gets:
```css
animation: wedgeIn 0.06s calc(i * 14ms) cubic-bezier(0.22,1,0.36,1) both
```
All 31 wedges stagger in over ~450ms total — a ring that assembles itself.

### Month Navigation
- `‹ ›` arrows in header
- Tapping: ghost name fades + slides (`opacity:0`, `translateX(±30px)`) → ring redraws → ghost slides back in
- `›` disabled (`.dim`) when on current month
- No future months allowed

---

## 4. Zone B — The Forge Terrain

### Layout
- Fixed-height strip: ~190px total, 150px for the 3D floor
- `perspective: 450px`, `perspective-origin: 50% 50%`
- Inner floor: `rotateX(46deg)`, `transform-origin: 50% 100%`
- One column per month, `min-width: 34px`, `gap: 7px`
- Left/right fog gradients mask edges (40px each)
- Bottom fog masks the vanishing point

### Column Heights
```js
const barH = Math.max(12, Math.round((month.pct / 100) * (isActive ? 140 : 115)));
```
Active (current selected) month: taller max height for visual prominence.

### Column States
| State | Class | Notes |
|-------|-------|-------|
| Active month | `.tb-active` | Bright gold, `activeGlow` pulse animation |
| ≥80% | `.tb-best` | Full gold gradient + glow shadow |
| 60–79% | `.tb-high` | Rich amber gradient |
| 40–59% | `.tb-mid` | Muted amber |
| <40% | `.tb-low` | Crimson gradient |

### Rise Animation
Each bar animates in on render:
```css
@keyframes barRise {
  from { transform: scaleY(0); opacity: 0; transform-origin: bottom; }
  to   { transform: scaleY(1); opacity: 1; transform-origin: bottom; }
}
```
Staggered: `animation-delay: index * 55ms`

### Drag-to-Scroll (Horizontal, with Momentum)
- `touchstart`/`mousedown` → capture `startX`, record `velocity`
- `move` → `offset += dx`, clamped `[-(total_cols * col_width - viewport), 0]`
- `release` → momentum loop: `velocity *= 0.88` per `rAF` frame until `|v| < 0.5`
- `terrain-inner` uses `transform: translateX(offset)` — no `scrollLeft`, no layout reflow

### Tap to Jump Month
Tapping any terrain column calls `jumpToMonth(idx)`:
```js
function jumpToMonth(idx) {
  currentMonthIdx = idx;
  drawRing(true);
  buildTerrain();
  updateHeader();
  // ghost name animation fires inside drawRing/updateHeader same as changeMonth
}
```
This sets `currentMonthIdx` directly (no delta calculation) then redraws exactly the same way as `changeMonth`. The ghost name slide animation is triggered by `updateHeader()` in both paths.

---

## 5. Data Flow

All functions use existing GritCore globals — no new localStorage keys needed.

```js
// For each day in the displayed month:
const hh = effH();
const ll = effL();
const dateStr = /* YYYY-MM-DD for that day */;
const pct = dayPct(dateStr, hh, ll); // null | 0–100

// For day detail overlay:
const dayLog = ll[dateStr] || {};
hh.forEach(habit => {
  const status = dayLog[habit.id]; // 'done' | 'failed' | undefined
});

// Month-level % for terrain:
// Average dayPct across all logged days in that month
```

### Month Score Word
```js
function scoreWord(pct) {
  if (pct >= 80) return 'Forged';
  if (pct >= 60) return 'Holding';
  if (pct >= 40) return 'Wavering';
  return 'Broken';
}
```

### Building Month List
Generate month objects dynamically from earliest log date to current month:
```js
function getMonthList() {
  const ll = effL(), hh = effH();
  const today = getDate(); // 'YYYY-MM-DD'
  const logKeys = Object.keys(ll).sort(); // ascending order
  const earliest = logKeys[0] || today;   // 'YYYY-MM-DD'

  // Walk month-by-month from earliest → today
  let [ey, em] = earliest.slice(0,7).split('-').map(Number);
  const [ty, tm] = today.slice(0,7).split('-').map(Number);
  const months = [];
  while (ey < ty || (ey === ty && em <= tm)) {
    const daysInMonth = new Date(ey, em, 0).getDate();
    const startDow = new Date(ey, em - 1, 1).getDay(); // 0=Sun
    const prefix = `${ey}-${String(em).padStart(2,'0')}`;
    // Compute month avg pct — skip null days (no habits on that day)
    const dayPcts = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${prefix}-${String(d).padStart(2,'0')}`;
      const p = dayPct(ds, hh, ll);
      if (p !== null) dayPcts.push(p); // null = no habits, skip
    }
    const hasData = dayPcts.length > 0;
    const avg = hasData ? Math.round(dayPcts.reduce((a,b)=>a+b,0)/dayPcts.length) : 0;
    months.push({ year:ey, month:em, prefix, daysInMonth, startDow, pct:avg, hasData, word:scoreWord(avg) });
    em++; if (em > 12) { em = 1; ey++; }
  }
  return months;
}
```
**Key rule:** `dayPct()` returns `null` when no habits existed on a given day. These days are **excluded** from the monthly average — only days with at least one logged habit count. This prevents early months (before habits were set up) from dragging the average to 0.

---

## 6. Files Modified

| File | Change type |
|------|-------------|
| `gritcore-app/www/index.html` | Replace `renderRecord()`, `goRecordMonth()`, `hmTap()` with new JS. Add `renderForgeRing()`, `drawRing()`, `buildTerrain()`, `changeMonth()`, `tapWedge()`, `closeDetail()`, `scoreWord()`, `getMonthList()` |
| `gritcore-app/www/gritcore.css` | Remove all `.rec-*`, `.hm-*` classes. Add `.forge-ring-*`, `.fr-terrain-*`, `.fr-hdr-*` classes |

### Existing functions to REMOVE
- `renderRecord(monthOffset)` — replaced entirely
- `goRecordMonth(delta)` — replaced by `changeMonth(delta)`
- `hmTap(cell)` — replaced by `tapWedge(dayIdx, pct)`
- `recordMonthOffset` module variable — replaced by `currentMonthIdx`

### Existing functions to KEEP/REUSE
- `effH()`, `effL()` — used for all data access
- `dayPct(dateStr, hh, ll)` — used per-day pct
- `getDate()` — today's date string
- `sw(view, el)` — tab switching; **one line must change inside `sw()`**: the existing `recordMonthOffset=0` reset (line ~862) must be replaced with `currentMonthIdx = monthList.length - 1`. **`monthList` must be a module-level variable** (declared as `let monthList = []` alongside `let currentMonthIdx = 0`). Call `monthList = getMonthList()` at the top of `renderForgeRing()` to populate it before use.

---

## 7. CSS Classes (New)

### Header
- `.fr-hdr` — sticky top bar, 52px
- `.fr-hdr-arrow` — nav arrow button
- `.fr-hdr-arrow.dim` — disabled state
- `.fr-month-title` — month label text

### Ring Zone
- `.fr-ring-scene` — outer container, `perspective: 700px`
- `.fr-ring-tilt` — 3D tilt wrapper, `transform-style: preserve-3d`
- `.fr-ghost-name` — background month typography
- `.fr-ring-center` — default center info
- `.fr-day-detail` — tap-reveal day detail panel
- `.fr-rc-pct`, `.fr-rc-word`, `.fr-rc-days` — center info elements

### Terrain Zone
- `.fr-terrain-section` — outer container
- `.fr-terrain-stage` — perspective container
- `.fr-terrain-floor` — rotateX wrapper
- `.fr-terrain-inner` — scrollable flex row of columns
- `.fr-t-col` — month column
- `.fr-t-bar` — bar element
- `.fr-t-bar--active`, `--best`, `--high`, `--mid`, `--low` — BEM modifier states
- `.fr-t-bar--empty` — month with no logged data (near-invisible, `rgba(255,255,255,0.025)`; applied when `hasData === false`)
- `.fr-t-lbl`, `.fr-t-lbl--active` — month label

### Keyframes (inline `<style>` in index.html)
```css
@keyframes wedgeIn {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}
/* Applied on the <g> or <path> wrapping each wedge via SVG <style> */

@keyframes todayWedge {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(255,220,70,0.9)); }
  50%       { filter: drop-shadow(0 0 16px rgba(255,220,70,1)); }
}

@keyframes barRise {
  from { transform: scaleY(0); opacity: 0; transform-origin: bottom; }
  to   { transform: scaleY(1); opacity: 1; transform-origin: bottom; }
}

@keyframes activeGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(201,168,76,0.5); }
  50%       { box-shadow: 0 0 20px rgba(201,168,76,0.9); }
}

@keyframes ghostSlide {
  from { opacity: 0; transform: translateX(var(--ghost-dx, 30px)) translateZ(-20px); }
  to   { opacity: 1; transform: translateX(0) translateZ(-20px); }
}
```

---

## 8. Animations Summary

| Element | Animation | Trigger |
|---------|-----------|---------|
| Ring wedges | Stagger assemble (31 × 14ms) | Month load / navigate |
| Today wedge | Breathing glow pulse (2.5s loop) | Always |
| Ghost month name | Slide + fade (0.5s) | Month navigate |
| Day detail | Fade in (0.22s) | Wedge tap |
| Terrain bars | Rise from floor (stagger 55ms) | Month load |
| Active terrain bar | Gold glow pulse (2.2s loop) | Always |
| Ring tilt | Physics damping (rAF, ×0.88) | Drag release |
| Terrain scroll | Momentum (rAF, ×0.88) | Drag release |

---

## 9. Responsive / Safe Area

- Max-width: 430px (matches existing `#app` constraint)
- **Ring zone: `flex: 1` (not fixed height)** — grows to fill remaining space between header and terrain, so it adapts to iPhone SE (667px), standard (812px), and Face ID devices with `env(safe-area-inset-top)` without overflowing
- Terrain: `190px` fixed with `overflow: hidden` — never grows, never clips nav
- Layout structure: `#record-tab` uses `display: flex; flex-direction: column; height: 100%` so ring zone absorbs all available space naturally
- `env(safe-area-inset-top)` absorbed by the existing header `padding: max(14px, env(safe-area-inset-top) + 8px)` pattern — no change needed

---

## 10. Accessibility

- Ring wedges: `role="button" tabindex="0" aria-label="Day {n}: {pct}% — {word}"` on each tappable `<path>` (SVG paths are not natively interactive; both attributes required for VoiceOver/iOS)
- Today wedge: `role="button" tabindex="0" aria-label="Today, in progress"`
- Future/null wedges: `aria-hidden="true"` (no interaction, not focusable)
- Header arrows: existing `aria-label` pattern
- Day detail close: `aria-label="Close day detail"`
- `prefers-reduced-motion`: disable `wedgeIn` stagger, `todayWedge` pulse, `barRise` stagger — use instant opacity instead

---

## 11. Backup & Versioning

Before implementation:
- Copy `index.html` → `index.0.28.html`
- Copy `gritcore.css` → `gritcore.0.28.css`

This is the v0.28 feature. Git commit after completion.

---

## 12. Verification Checklist

- [ ] Record tab fills full screen, no scroll bars, no dead space
- [ ] Ring draws with stagger animation on tab entry
- [ ] Tapping gold wedge shows discipline detail in ring center
- [ ] Today wedge pulses and shows in-progress state on tap
- [ ] Dragging ring tilts it in 3D with spring-back on release
- [ ] Terrain bars rise with stagger on load
- [ ] Active month terrain bar pulses gold
- [ ] Dragging terrain scrolls with momentum
- [ ] Tapping terrain column jumps to that month (ring redraws)
- [ ] `‹ ›` arrows navigate months with ghost name animation
- [ ] `›` arrow disabled on current month
- [ ] No horizontal scroll on the page
- [ ] No overlap with nav bar or header
- [ ] Works with 0 habits (placeholder mode shows empty ring)
- [ ] Works with 1 month of history (single terrain column)
- [ ] `prefers-reduced-motion` disables decorative animations
