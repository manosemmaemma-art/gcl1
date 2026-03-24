# Forge Ring v0.30 — Swipeable Pie Wheel

**Date:** 2026-03-24
**Status:** Approved
**Scope:** Record tab — replace 3D tilt ring with flat swipeable pie wheel, flatten terrain strip

---

## 1. Overview

Replace the current 3D tilt/drag ring interaction with a flat, swipeable pie wheel. Each wedge represents a day of the month with a faint day number inside. The user swipes around the wheel to rotate it; on release, the nearest wedge snaps to the selected position. The terrain history strip below loses its 3D perspective and becomes a taller flat bar chart.

## 2. The Wheel

### SVG Structure
- ViewBox: `0 0 256 256`
- Center: `(128, 128)`
- Outer radius: `122`
- Inner radius: `82`
- Gap between wedges: `1.5°` (in radians: `1.5 * Math.PI / 180`)
- Each wedge: arc path from inner to outer radius, one per day of the month

### Day Numbers
- Font: Cormorant Garamond, 7px
- Color: `rgba(245, 242, 236, 0.25)` — faint, never dominant
- Position: centered radially within each wedge (midpoint between inner and outer radius, at wedge's angular center)

### Wedge Fill (Heat-Mapped)
- 100% completion: `rgba(201, 168, 76, 0.50)` (strong gold)
- 80%+: `rgba(201, 168, 76, 0.40)`
- 60%+: `rgba(201, 168, 76, 0.30)`
- 40%+: `rgba(201, 168, 76, 0.20)`
- 20%+: `rgba(201, 168, 76, 0.12)`
- 0% / no data: `rgba(201, 168, 76, 0.05)`
- Today wedge: dashed stroke `rgba(201, 168, 76, 0.4)` to distinguish
- Future days (current month only): `rgba(201, 168, 76, 0.02)`, no day number

### Wedge Stroke
- `rgba(10, 8, 6, 0.6)`, 0.5px — thin dark separator between wedges

### Center Hole
- Fill: `rgba(10, 8, 6, 0.92)` — near-black, matches app background
- Border: none (the wedge inner edges form the visual boundary)

### Ghost Month Name
- Unchanged from v0.28: large faint italic Cormorant Garamond behind the ring
- `clamp(48px, 18vw, 88px)`, `rgba(201, 168, 76, 0.18)`

### No 3D
- Remove `.fr-ring-tilt` wrapper's `transform-style: preserve-3d` and `perspective`
- Ring sits flat in the page — no tilt, no grab cursor for tilt
- Keep the ring scene container for layout (`flex`, `align-items: center`)

## 3. Swipe Interaction

### Initial Rotation
- On first render, rotate the wheel so **today's wedge** (or the last day with data if viewing a past month) sits at 12 o'clock
- Day 1 starts at the standard SVG 0° (3 o'clock) and wedges proceed clockwise; the initial CSS rotation offsets this so the target day lands at top-center
- Wedge angle is recomputed per month: `sliceAngle = 2π / daysInMonth`, gap = `1.5° * π/180` — never cached as a constant

### Touch/Mouse Tracking
1. On `pointerdown` inside ring scene: call `setPointerCapture(e.pointerId)` and store `activePointerId`; record initial angle from touch point to SVG center
2. On `pointermove`: **ignore if `e.pointerId !== activePointerId`**; calculate current angle, compute delta from initial angle
3. Apply delta as CSS `transform: rotate(Xdeg)` on the SVG element
4. The entire wheel rotates — all wedges, day numbers, everything moves together
5. On `pointerup`: release pointer capture, clear `activePointerId`; snap to nearest wedge center angle

### Snap Behavior
- Calculate which wedge center is closest to current rotation
- Animate to that position using `280ms cubic-bezier(0.25, 1, 0.5, 1)`
- No momentum — wheel stops where finger stops, then snaps
- No overshoot — the easing curve settles smoothly without bounce

### Selection State
- The wedge at the 12 o'clock position (top center) is the "selected" wedge
- After snap: that wedge pops outward ~8px along its radial axis (translate toward outer edge)
- Wheel scales from `1.0` → `1.12` (CSS `transform: scale(1.12)`)
- Selected wedge: brighter fill (`+0.15` opacity), subtle gold glow via SVG `<filter>` (drop-shadow) — not CSS `box-shadow` which doesn't work on SVG paths
- Selected wedge pop: computed in JS as `transform="translate(dx, dy)"` on the `<path>` element where `dx = cos(midAngle) * 8` and `dy = sin(midAngle) * 8` — this is per-wedge since each has a different radial direction. Not a CSS class.
- Other wedges: dim to `opacity: 0.7`
- All transitions: `280ms cubic-bezier(0.25, 1, 0.5, 1)`

### Deselection
- Tap the selected wedge again, or tap the center → deselect
- Wheel scales back to `1.0`, wedge retracts, center returns to month summary
- Same easing curve for all reverse transitions

### Tap Support
- Tapping a wedge directly (without swiping) rotates the wheel so that wedge lands at 12 o'clock, then selects it
- Combined rotation + selection animation

### Month Change During Selection
- When `changeMonth()` or `jumpToMonth()` fires while a wedge is selected: **reset rotation to 0** (today/last-data-day at 12 o'clock for new month), **clear selection state** (scale back to 1.0, retract any popped wedge, return center to month summary), then rebuild SVG via `drawRing()`
- This prevents rotation state from pointing to a day that doesn't exist in the new month (e.g., day 31 in February)

## 4. Center Content

### Idle State (Month Summary)
- **Percentage**: Cormorant Garamond, 28px, opacity 0.95
- **Score word**: Josefin Sans, 9px, uppercase, letter-spacing 0.15em, opacity 0.4
- **Day count**: Josefin Sans, 8px, opacity 0.25 (e.g., "24 of 31 days")
- **CTA text**: "swipe around the ring" — 8px, opacity 0.25, positioned inside `.fr-ring-scene` below the SVG (absolute positioned at bottom of the scene container, not inside the center hole)
- Empty state: "—" for %, "No data" for word, CTA link to Forge tab

### Selected State (Day Info)
- Crossfade from month summary (130ms fade out → 220ms fade in)
- **Date**: Josefin Sans, 8px, uppercase, tracking 0.12em, opacity 0.35 (e.g., "Mar 14, 2026")
- **Percentage**: Cormorant Garamond, 26px, opacity 0.95
- **Score word**: Josefin Sans, 9px, uppercase, tracking 0.12em, opacity 0.45
- **Habit count**: Josefin Sans, 8px, opacity 0.3 (e.g., "4 of 5 done")
- Today indicator: append "— In progress…" to score line

### Full Day Detail (Tap to Expand)
- Tapping the center (or tapping the selected wedge a second time) opens the full day detail
- Uses existing `fr-day-detail` overlay pattern: crossfade, shows complete habits list
- Each habit: `✓` (done, gold), `✗` (failed, dim red), `·` (skipped, dim)
- Close button: "✕ close" — returns to month summary

## 5. Terrain Strip

### Layout Changes
- Height: `220px` → `300px`
- Remove 3D perspective: no `rotateX(46deg)` on `.fr-terrain-floor`
- Bars sit flat, aligned to bottom of container
- Floor element becomes a simple flex container (`align-items: flex-end`)

### Bar Styling
- Width: `36px` (unchanged)
- Gap: `8px` (was 7px)
- Border-radius: `3px 3px 0 0` (rounded top corners)
- Max bar height: `200px` (up from ~160px, uses more vertical space)
- Min bar height: `14px` (unchanged)
- Active month: gold border `1px solid rgba(201, 168, 76, 0.4)` + brighter fill
- Color tiers: same as current (best/high/mid/low/empty)

### Labels
- Month labels: Josefin Sans, 8px (unchanged)
- Active month label: gold color, font-weight 600
- Year boundary markers: unchanged

### Interaction
- Horizontal drag scroll with momentum: keep `initTerrainDrag()` as-is
- Tapping a bar: `jumpToMonth(idx)` — switches wheel with smooth crossfade
- Fade edges (left/right gradient overlays): unchanged
- Auto-scroll to active month on render: unchanged

## 6. Functions to Modify

### Remove Entirely
- `initRingTilt()` — 3D tilt/drag interaction (~100 lines)
- Ring tilt portion of `animFrame()` — 3D spring-back physics

### Rewrite
- `drawRing(mode)` — new flat pie wheel with day numbers, no 3D transforms
- `renderForgeRing()` — remove `initRingTilt()` call, add `initWheelSwipe()` call, update HTML template (remove `.fr-ring-tilt` wrapper)
- `buildTerrain()` — remove 3D bar height scaling, use flat layout, taller bars

### New Function
- `initWheelSwipe()` — pointer tracking, angle calculation, rotation, snap-to-wedge logic

### Modify
- `tapWedge()` — add rotation animation to bring tapped wedge to 12 o'clock before selecting
- `closeDetail()` — also deselect wedge (scale back, retract pop)
- CSS: remove 3D rules, add flat wheel rules, update terrain height/layout

## 7. CSS Changes

### Remove
- `.fr-ring-tilt` — `transform-style: preserve-3d`, `cursor: grab/grabbing`
- `.fr-terrain-floor` — `rotateX(46deg)`, `transform-origin`
- `.fr-terrain-stage` — `perspective: 500px`, `perspective-origin`
- `#fr-ring-svg` — `drop-shadow` filter (replace with lighter shadow)

### Add
- `.fr-wheel-wrap` — container for the rotatable SVG, `transition: transform 280ms cubic-bezier(0.25, 1, 0.5, 1)`, `touch-action: none` (prevents browser scroll/pan from competing with swipe rotation on iOS/WKWebView)
- `.fr-wedge--selected` — brighter fill, gold glow via SVG filter; radial pop is JS-computed `transform` attribute (not CSS class), see Section 3
- `.fr-wedge--dimmed` — `opacity: 0.7` for non-selected wedges
- `.fr-wheel--scaled` — `transform: scale(1.12)` when a wedge is selected
- `.fr-day-num` — SVG text styling for day numbers inside wedges

### Modify
- `.fr-ring-scene` — remove `perspective: 480px`, keep flex centering
- `.fr-terrain-section` — `height: 300px`
- `.fr-terrain-floor` — remove transform, just `display: flex; align-items: flex-end`
- `.fr-terrain-stage` — remove perspective properties
- `.fr-t-bar` — increase max height range, add `border-radius: 3px 3px 0 0`

## 8. Accessibility

- Wedges keep `role="button"`, `tabindex="0"`, `aria-label` with day + completion info
- Keyboard: Enter/Space to select a wedge (no swipe needed)
- Arrow keys to move between wedges when ring is focused
- `prefers-reduced-motion`: disable rotation animation, use instant snap
- Terrain bars: unchanged accessibility (role, tabindex, aria-label)

## 9. Typography Summary

| Element | Font | Size | Weight | Opacity | Tracking |
|---------|------|------|--------|---------|----------|
| Day numbers (wedge) | Cormorant Garamond | 7px | 400 | 0.25 | — |
| Center % (idle) | Cormorant Garamond | 28px | 400 | 0.95 | — |
| Center % (selected) | Cormorant Garamond | 26px | 400 | 0.95 | — |
| Score word | Josefin Sans | 9px | 400 | 0.40–0.45 | 0.15em |
| Date | Josefin Sans | 8px | 400 | 0.35 | 0.12em |
| Day count | Josefin Sans | 8px | 400 | 0.25–0.30 | — |
| Ghost month | Cormorant Garamond | clamp(48–88px) | 400 | 0.18 | — |
| Terrain labels | Josefin Sans | 8px | 400/600 | 0.30/0.70 | — |
| Section headers | Josefin Sans | 11px | 400 | 0.45 | 0.18em |

## 10. Animation Easing

All transitions use: `280ms cubic-bezier(0.25, 1, 0.5, 1)`
- Smooth, quick out, gentle settle
- No bounce, no overshoot
- Applied to: wheel rotation snap, wedge pop, wheel scale, center crossfade, terrain bar transitions

Exception: center content crossfade uses split timing (130ms out + 220ms in) for crisp swap.
