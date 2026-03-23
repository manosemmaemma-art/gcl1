# GritCore v0.25 — UI/UX Overhaul Design Spec

**Date:** 2026-03-21
**Status:** Approved for implementation
**Files affected:** `gritcore-app/www/index.html`, `gritcore-app/www/gritcore.css`

---

## Context

The app is functional and has a strong design language (dark marble, frosted glass, Cormorant Garamond + Josefin Sans, `--heat` gold system). This overhaul addresses three gaps:

1. The **Report tab feels sparse** — the heatmap alone doesn't fill the screen or tell a rich enough story.
2. The **toast notification blocks tapping** — sitting above the tab bar, it covers content mid-action.
3. The **tab bar active state** is subtle (small dot) and the overall UI has small QOL gaps that keep it feeling prototype-like rather than a finished product.

**Constraint (non-negotiable):** Every new element must feel native to the existing design. Use existing CSS variables (`--heat`, `--gold`, `--cbor`, `--card-shadow`, `--ctd`, `--ctdd`), existing card patterns (`.card`, `.shdr`), existing fonts, and existing spacing conventions (6px / 9px / 14px / 18px grid). Nothing foreign.

---

## 1. Report Tab — New Layout

### What changes
The tab gains four new sections inserted between the existing stat row and the heatmap.

### New layout order (top to bottom)
```
[ Tier ] [ 7 Day ] [ Streak ]               ← existing .rpt-stat-card row (unchanged)
[ Personal Bests — 4-card 2×2 grid ]        ← NEW
[ Last 7 Days — mini bar chart ]             ← NEW
[ This Month vs Last Month — 2-card row ]    ← NEW
[ 52-Week Heatmap ]                          ← existing (unchanged)
[ Category Bars ]                            ← existing (unchanged)
[ Profile / Settings / About icon row ]      ← existing (unchanged)
```

### Personal Bests (4-card 2×2 grid)
- Section header: `.shdr` — "PERSONAL BESTS"
- 4 cards in a 2×2 CSS grid, same `.rpt-stat-card` class and padding as existing stat cards
- Stats: **Best Streak** (all-time best streak days), **All-time** (total logged disciplines ever), **Best Month** (highest monthly % ever), **Best Week** (highest weekly % ever)
- Values derived from iterating `logs{}` object — no new storage needed
- Gold `var(--heat)` color for values, `var(--ctdd)` for labels
- If no data: show `—` placeholder

**Computation definitions:**
- **Best Month:** For each calendar month (Jan–Dec) in `logs{}`, compute `(days with ≥1 'done' log) / (days in that month)`. The current incomplete month is **excluded** — only fully elapsed months count. Best = highest % across all elapsed months.
- **Best Week:** Calendar week = Mon–Sun. For each full Mon–Sun week in `logs{}`, compute `(days with ≥1 'done' log) / 7`. Only fully elapsed weeks (Sunday already passed) count. Current partial week excluded. Best = highest % across all elapsed weeks.
- Both require at least 1 elapsed month/week respectively; otherwise show `—`.

### Last 7 Days Bar Chart
- Section header: `.shdr` — "LAST 7 DAYS"
- 7 vertical bars in a flex row, labels below (Mon/Tue/Wed... abbreviated)
- Bar heights proportional to daily completion % (0–100%)
- Today's bar uses full `var(--gold)` fill; past bars use `rgba(212,160,23,0.35)`
- Zero-day bars: `rgba(255,255,255,0.06)` (empty, not absent)
- Contained in a `.card` wrapper with same border/shadow as existing cards
- Data derived from last 7 entries in `logs{}`
- **Zero data:** If `habits[]` is empty or no logs exist for the 7-day window, render all 7 bars at zero height with the empty color — section header still shows, no hidden sections

### This Month vs Last Month
- Section header: `.shdr` — "MONTH OVER MONTH"
- Two cards side by side (2-col grid), same `.rpt-stat-card` style
- Left card (current month): gold-tinted border `rgba(212,160,23,0.3)`, shows month name + % + "X days in"
- Right card (previous month): standard card style, shows month name + % + "X days"
- % = days with ≥1 log / days in month (or days elapsed for current)
- Derived from `logs{}` — no new storage
- **Zero data:** If no logs exist for either month, show `—` for % and `0 days` — both cards always render (never hidden)

---

## 2. Toast → Top Banner Drop

### What changes
The `#toast` element moves from `bottom: calc(72px + safe-area)` to just below the header. The banner is richer — it shows a sub-line with today's progress count.

### Behaviour
- Slides down from `translateY(-100%)` to `translateY(0)` in 0.25s with `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring feel)
- Exits by fading opacity to 0 in 0.2s after 1800ms display
- Position: `fixed`, `top: calc(header-height + 8px)`, `left: 12px`, `right: 12px` (full-width minus margins)
- Style: same frosted glass (`backdrop-filter: blur(16px)`), `rgba(25,25,25,0.95)` background, `1px solid rgba(212,160,23,0.35)` border, 12px border-radius
- Layout: flex row — `✦` icon | message text | sub-text (e.g. "4 of 6 today")
- Sub-text only shown when marking done/failed (not for "Exported", "Removed", etc.)
- `showToast(msg, sub)` — add optional `sub` param; sub defaults to `null`

### Header height detection
Use `document.getElementById('hdr').offsetHeight` at call time — not hardcoded — so it adapts to any safe-area changes. If `offsetHeight` returns `0` (header not yet painted), fall back to `56px`.

---

## 3. Tab Bar — Gold Pill Active State

### What changes
The active tab button gets a gold pill background instead of the small dot indicator below the icon.

### CSS changes to `.bni.on`
```css
.bni.on {
  background: rgba(212, 160, 23, 0.12);
  border: 1px solid rgba(212, 160, 23, 0.22);
  border-radius: 12px;
}
```
- Remove existing `.bni-dot` visibility rule for active state (dot hidden for all states)
- All other `.bni` styles (padding, gap, font) unchanged
- Existing tap pop animation (`.tap` class) stays completely untouched
- Pill border-radius matches the existing card language (12px)

---

## 4. QOL Changes

All QOL items must use existing CSS variables and feel like they were always part of the app.

> **Note:** Items `d` (streak milestone toasts) and `f` (week summary row) were reviewed and removed from scope for this version.

### a. Perfect Day Glow
**Trigger:** `updateHeat()` detects `completed === total && total > 0`
**Effect:**
- `#heat-veil` opacity goes to its maximum (`--heat-overlay-alpha: 0.18`) with a 1s ease transition
- A "Perfect Day" banner appears: same style as `#ach-banner` (achievement banner), text "Perfect Day — Iron Discipline", auto-dismisses after 3s
- Reuses the existing `#ach-banner` element — just set different text and trigger `.show`
- Does not re-trigger if already shown today (store flag in `sessionStorage`)
- **Collision rule:** If `#ach-banner` is already visible (has `.show` class) when Perfect Day triggers, skip the Perfect Day banner entirely — the achievement takes priority. The heat veil glow still applies.

### b. Per-Discipline Streak Badge
**Location:** Inside each discipline card on the Today tab, right side beside the ✓/✕ buttons
**Display:** Small pill — e.g. `7d` in `var(--ctdd)` color, `7.5px` Josefin Sans, `letter-spacing: 1px` (matches existing `.shdr` label size — intentionally compact to match the app's existing minimal label scale)
**Only shown** when streak ≥ 2 (1-day streaks add noise, not value)
**Streak calculation:** Count consecutive days in `logs{}` where the discipline has a `'done'` entry, working backwards from yesterday (today's state doesn't count toward streak yet)
**Style:** `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 20px`, `padding: 2px 7px` — blends with existing card border style

### c. Better Empty State (Today Tab)
**Trigger:** `isPlaceholder === true` (existing flag)
**Replaces:** Current placeholder text/card
**Design:** A single `.card` with:
- Cormorant Garamond italic heading: *"Your disciplines await."* (`var(--gold)`, 20px)
- Josefin Sans body: `"Nothing is forged without a first strike. Add your first discipline to begin."` (`var(--ctd)`, 8.5px)
- A text button styled like existing secondary buttons: `"Open Forge →"` — calls `sw('forge', forgeTabEl)`
- No illustrations, no icons — text-only, matching the app's minimal luxury aesthetic

### e. Month Navigation (Record Tab)
**Location:** Header row of the Record tab — left/right chevron arrows flanking the current month/year label
**Behaviour:** Tapping `‹` goes to previous month; `›` goes forward (disabled at current month)
**State:** Module-level variable `let recordMonthOffset = 0` (0 = current month, -1 = last month, etc.)
**renderRecord() refactor:** Refactor `renderRecord()` to accept an optional `monthOffset` integer parameter (default `0`). All existing calls to `renderRecord()` pass no argument and continue to work unchanged. The month navigation arrows call `renderRecord(recordMonthOffset)` after updating `recordMonthOffset`. **All date-scoped operations inside `renderRecord()` — log lookups, day-row rendering, category bar queries, and date labels — must be computed relative to the offset month, not from `getDate()` directly.** Compute the target month as `new Date()` shifted by `monthOffset` months, then derive all day strings from that month's date range.
**Style:** Arrows use `var(--ctd)` color, `18px`, no background — same as existing icon-style buttons. Month label: Josefin Sans, `8px`, `letter-spacing: 2px`, uppercase, `var(--gold)`
**Disabled state:** `›` at current month (`recordMonthOffset === 0`) gets `opacity: 0.2`, `pointer-events: none`

### g. Tab Content Fade
**Implementation:** On `sw(view, el)` call, the `.content` div gets class `.tab-fade-in` which runs:
```css
@keyframes tabFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tab-fade-in { animation: tabFadeIn 0.2s ease-out forwards; }
```
- 4px upward drift on entry — subtle, not a full slide
- Class removed after animation ends (`animationend` listener, `{ once: true }`)
- Does not affect scroll position or layout

### h. Button Tap Ripple
**Target:** `.hbtn` buttons (the ✓ and ✕ discipline buttons)
**Implementation:** On `pointerdown`, inject a `<span class="ripple">` absolutely positioned at tap coordinates within the button, animate from `scale(0) opacity(0.4)` to `scale(2.5) opacity(0)` over 0.4s, then remove
**Style:** `background: var(--gold)`, `border-radius: 50%`, `width/height: 100%`, `position: absolute`, `pointer-events: none`
**Parent:** `.hbtn` needs `position: relative; overflow: hidden` (add only if not already set)
**Re-tap behaviour:** The ripple fires on every `pointerdown` regardless of whether the discipline is already marked — it is a pure visual feedback for the pointer event, independent of `markH()` logic

### i. Bottom Sheet Spring
**Target:** `.bs` (bottom sheet) open animation
**Current:** Likely `transform: translateY(100%)` → `translateY(0)` with a CSS transition
**Change:** Replace transition timing with `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring — same curve as toast drop)
**Duration:** 0.38s
**Close animation:** Keep existing linear/ease-out (spring only on open, not close — this is the correct UX pattern)

### j. Smooth Heat Transitions
**Implementation:** Add `transition` to all properties that reference `--heat` or `--gold`:
```css
.card           { transition: border-color 0.6s ease, box-shadow 0.6s ease; }
#heat-veil      { transition: opacity 0.6s ease; }
.bni.on         { transition: background 0.6s ease, border-color 0.6s ease; }
.heat-badge     { transition: color 0.6s ease; }
```
- Do not transition layout properties (width, height, padding) — only color/opacity
- 0.6s ease matches a natural "warmth spreading" feel

### k. Contextual Motivation Line
**Location:** Below the date string in `.hdr` (header), right column
**Logic (priority order):**
1. `completed === total && total > 0` → *"Iron discipline."*
2. `completed === 0 && total > 0` → *"Nothing logged yet. Begin."*
3. `total - completed === 1` → *"One left. Finish strong."*
4. `total - completed <= Math.ceil(total / 2)` → *"More than halfway. Push."*
5. `streak >= 30` → *"30 days forged."* (or current streak number)
6. Default → *"Stay the course."*
**Style:** Josefin Sans, `7.5px`, `letter-spacing: 1px`, `var(--ctdd)` (muted), `text-transform: uppercase` (matches existing `.shdr` label scale)
**Update:** Called at end of `updateHeat()` so it always reflects current state
**No animation** — just a text update, keeps it subtle

---

## Cohesion Checklist

Before any element is implemented, verify:
- [ ] Uses only existing CSS variables (`--heat`, `--gold`, `--cbor`, `--card-shadow`, `--ctd`, `--ctdd`, `--color-card`)
- [ ] Font is Josefin Sans (UI/labels) or Cormorant Garamond (display text) — no others
- [ ] Border-radius matches existing cards (10–14px for cards, 20px for pills)
- [ ] Spacing follows the 6/9/14/18px grid
- [ ] No hardcoded colors — all references via CSS variables
- [ ] Animations use `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring or `ease-out` for exits
- [ ] New JS functions follow existing camelCase naming (`renderReport`, `showToast`, `updateHeat`)
- [ ] No new localStorage keys — derive all new stats from existing `habits[]` and `logs{}`

---

## Verification

1. **Report tab:** Open app → tap Report → confirm all 4 new sections appear with real data (use `devAddTestData()` if needed)
2. **Toast:** Mark a discipline done → banner drops from top with sub-text → auto-dismisses → does not overlap header
3. **Tab bar:** Switch tabs → active tab shows gold pill → existing tap animation still fires
4. **Perfect day glow:** Mark all disciplines done → heat veil goes full gold → achievement banner fires once per session. To re-test: run `sessionStorage.clear()` in the browser console between runs
5. **Streak badge:** Set up disciplines with multi-day logs → cards show streak pills ≥ 2
6. **Empty state:** Clear all habits → Today tab shows encouraging card with Forge link
7. **Month nav:** Record tab → tap `‹` → previous month loads → `›` navigates forward → disabled at current month
8. **Tab fade:** Switch between tabs → content has subtle 0.2s fade-in
9. **Ripple:** Tap ✓/✕ button → gold ripple radiates from tap point
10. **Sheet spring:** Open FAB sheet → spring overshoot on open, smooth close
11. **Heat transition:** Mark disciplines progressively → gold color spreads across UI over 0.6s
12. **Motivation line:** Test each condition (0 done, partial, 1 left, all done) → correct line shows in header
