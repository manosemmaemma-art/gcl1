# GritCore Polish Plan — Design Spec
**Date:** 2026-03-20
**Version target:** v0.17 → v0.23
**Goal:** Self-contained, polished app that feels 100% ready. No external dependencies, no revenue systems.

---

## Overview

GritCore is a discipline-tracking iOS app (Capacitor 6, vanilla JS, no build step). The current codebase at v0.16 is functionally complete but needs a polish pass, several feature upgrades, and removal of all external dependencies. The build follows a feature-by-feature approach — one change per version bump, test between each step.

---

## Constraints

- Vanilla JS / HTML / CSS — no frameworks, no build step
- No external API calls, no RevenueCat, no paywall
- All data stored in localStorage (`gc1:habits`, `gc1:logs`, custom key for categories)
- Single `index.html` + `gritcore.css` — no new files unless absolutely necessary
- Existing design language preserved: black marble, frosted glass, Cormorant Garamond + Josefin Sans, heat system

---

## Build Order

7 steps, each gets its own version bump and test before proceeding.

---

## Step 1 — Strip External Dependencies (v0.17)

**What:** Remove all RevenueCat/paywall code. Make the app fully self-contained.

**Changes:**
- Delete `paywall.js` import and all `paywall.*` calls from `index.html`
- Remove `config.js` import (RevenueCat API key config)
- Remove `marble-interpolator.js` import (preserved untouched for v2, just not loaded)
- Remove any `gc:purchased`, `gc:trial_start` localStorage checks
- `showOnboarding()` / `beginApp()` flow simplified — no trial gate, just straight into app
- `@revenuecat/purchases-capacitor` remains in `package.json` (don't touch native layer), just unused in web layer

**Success:** App loads, onboarding works, all 4 tabs functional, no console errors about missing modules.

---

## Step 2 — Dev Console (v0.18)

**What:** A fully-featured tester drawer accessible from any screen via a small corner icon. Does not interfere with the app layout.

**UI:**
- Small `⚙` icon fixed at `bottom-right`, above the nav bar, always visible
- Tapping it opens a bottom drawer (slides up, does not cover nav)
- Drawer has a drag handle at top, title "Dev Console"
- Closes on tap outside or swipe down

**Dev console buttons (2-column grid):**
| Button | Action |
|--------|--------|
| +1 Day | Advance simulated date by 1 |
| -1 Day | Rewind simulated date by 1 |
| All Done | Mark all today's disciplines as done |
| All Failed | Mark all today's disciplines as failed |
| Set Streak… | Prompt to enter a streak number, simulate it |
| Add Test Data | Populate with sample disciplines + 30 days of log data |
| Onboarding | Reset onboarding flag, reload to show onboarding again |
| Reset All | Clear all localStorage, reload |

**Implementation notes:**
- Corner icon uses `position: fixed`, `z-index: 999`, small (24×24px), subtle opacity
- Drawer uses same bottom-sheet pattern as FAB sheet (existing CSS reusable)
- "Add Test Data" generates realistic varied data across all 4 default categories
- "Set Streak…" prompts for a number N, then writes N consecutive days of fully-completed log entries into `gc1:logs` ending yesterday, then reloads. Does not use `gc:sim_date`.
- Reset All shows a confirm dialog before executing

**Success:** Drawer opens/closes smoothly, all 8 buttons work correctly, no layout shift on any screen.

---

## Step 3 — Heatmap Upgrade (v0.19)

**What:** Replace the Record tab's 30-day grid with a GitHub-style 52-week heatmap.

**Layout:**
- 7 rows (Mon–Sun) × 52 columns (weeks) = 364 cells
- Each cell colored by day completion percentage:
  - Empty/no data: `rgba(255,255,255,0.04)`
  - 1–49%: dim amber `rgba(201,168,76,0.25)`
  - 50–79%: mid amber `rgba(201,168,76,0.55)`
  - 80–99%: bright amber `rgba(201,168,76,0.85)`
  - 100%: gold `#c9a84c` + subtle glow
- Cells are small squares (~10×10px) with 2px gap
- Day labels (M/W/F) on left, month labels along top
- Tap a cell → small tooltip showing date + completion %
- Scrollable horizontally; on load, auto-scrolls so the current week column is at the right edge (most recent week visible)

**Implementation notes:**
- `last365()` helper generates date array (extend existing `last30()` pattern)
- Render as a single `<div>` grid using CSS Grid
- Reuse existing `dayPct()` function for color mapping
- Keep the existing 30-day score cards above the heatmap (today%, 7-day%)

**Success:** Heatmap renders correctly, colors match data, current week visible on load, tap tooltip works.

---

## Step 4 — Report Redesign (v0.20)

**What:** Replace the old Report layout (category bars + focus timer) with a new hub layout.

**New layout (top to bottom):**

### Stats Row (two equal cards side by side)
**Left — Next Milestone:**
- Current streak number (large, Cormorant Garamond, heat-colored)
- Current tier name below
- Thin progress bar showing % to next tier
- "X days to [Next Tier]" label

**Right — Lifetime Stats:**
- Total completions (large number)
- "perfect days" count below
- Best discipline name (most completions)

### Category Bars
- One bar per category (user's custom categories, see Step 5)
- Auto-calculated: `completions in category / total possible × 100`
- Bar + percentage label + category name
- Only shows categories that have at least 1 discipline assigned

### Icon Row (4 icons, evenly spaced)
| Icon | Label | Action |
|------|-------|--------|
| 👤 | Profile | Opens simple name/avatar sheet (future — shows "Coming soon" for now) |
| ⚙️ | Settings | Opens settings sheet (see below) |
| 📤 | Export | Triggers existing `exportData()` |
| ◆ | About | Shows app version + "Forge your discipline." tagline |

**Settings sheet (minimal for now):**
- Reset today's log
- Clear all data (with confirm)
- App version number

**Remove:** Focus timer entirely (`bpmTimer`, `bpmRunning`, `startBpm()`, all BPM state)

**Note:** `exportData()` is not touched by Step 1 and survives intact to this step.

**Success:** Report tab renders cleanly, stats are accurate, icon row opens correct sheets, no timer code remains.

---

## Step 5 — Custom Categories (v0.21)

**What:** Let users create, rename, and delete their own discipline categories. Defaults pre-loaded, all editable.

**Rules:**
- Default categories: Body · Mind · Craft · Ritual (pre-loaded on first run)
- Maximum 8 categories at any time
- Minimum 1 category (cannot delete the last one)
- Category name: max 20 characters, trimmed
- Categories stored in localStorage key `gc1:cats` as JSON array of `{id, name}`

**UI (Forge tab — new "Categories" section above discipline list):**
- Section header "Categories" with small `+` button (disabled when at 8)
- Each category shown as a pill: name + edit pencil + delete ×
- Delete × disabled/hidden if only 1 category remains, or if disciplines are assigned to it (show tooltip: "Remove disciplines first")
- Tapping edit pencil → inline rename input
- Add new → inline input appears, tap confirm or press Enter
- Any category CRUD operation (add/rename/delete) immediately re-renders the category selector in Forge and the category bars in Report

**Discipline assignment:**
- When forging a discipline, category selector shows user's custom categories (not hardcoded CATS array)
- `selCat` defaults to first category in user's list

**Report auto-calculation:**
- `catStats()` reads from `gc1:cats` instead of hardcoded `CATS`
- Only renders bars for categories that have ≥1 discipline assigned with log data

**Migration:**
- On first load after update, if `gc1:cats` doesn't exist, seed it from `CATS` defaults

**Success:** Users can add/rename/delete categories, discipline assignment uses custom list, Report bars update automatically.

---

## Step 6 — Quote Card Upgrade (v0.22)

**What:** Make the quote card on Today tab visually premium and auto-rotate daily.

**Visual changes:**
- Full-width card, taller (no fixed small height)
- Larger quote text (Cormorant Garamond italic, ~18px)
- Author attribution smaller, spaced below, Josefin Sans caps
- Subtle left border accent in heat color
- Frosted glass background, slightly more opaque than other cards
- No tap-to-cycle UI (auto-rotates daily)

**Rotation logic:**
- `Math.floor(Date.now() / 86400000) % QUOTES.length` — deterministic, same quote all day
- No localStorage needed
- On date change (midnight), naturally shows next quote

**Quote pool:**
- Expand existing `QUOTES` array to at least 60 entries
- All discipline/stoic/focus themed (Marcus Aurelius, Seneca, Goggins, Jocko, etc.)

**Tap behavior:**
- Tapping the card still works as a "preview next" — shows tomorrow's quote for 3 seconds then reverts. Makes the daily rotation feel discoverable.

**Success:** Quote changes each day, looks premium, tap preview works, no jank.

---

## Step 7 — Final CSS Polish Sweep (v0.23)

**What:** A comprehensive pass to eliminate all visual glitches, inconsistencies, and rough edges.

**Checklist:**
- [ ] All transitions use consistent easing (`cubic-bezier(0.4, 0, 0.2, 1)` or `ease`)
- [ ] No layout shift on any user action (streak badge, score cards, header)
- [ ] Tap/press states on all interactive elements (`active` scale + opacity)
- [ ] Toast notifications: smooth in/out, never overlaps nav
- [ ] FAB sheet: smooth open/close, backdrop fade, no jitter
- [ ] Streak panel: open/close animation clean, height transition smooth
- [ ] Heat veil: gradual transitions, no flash on load
- [ ] Heatmap: scrolls smoothly, tooltip doesn't clip edges
- [ ] Dev drawer: opens/closes with same feel as FAB sheet
- [ ] All cards have consistent border-radius, padding, glass effect
- [ ] Empty states styled consistently (no raw "No data" text) — views with empty states: Today (no disciplines), Record/Heatmap (no log data, all cells empty), Report (no categories with log data)
- [ ] Onboarding flow: transitions smooth, no blank flash

**Success:** App feels smooth end-to-end with no rough edges. Ready for a human tester to walk through every screen without finding a visual glitch.

---

## Data Model

| Key | Type | Contents |
|-----|------|----------|
| `gc1:habits` | JSON array | `[{id, name, cat, created}]` |
| `gc1:logs` | JSON object | `{date: {habitId: 'done'|'failed'}}` |
| `gc1:cats` | JSON array | `[{id, name}]` — user's custom categories |
| `gc:sim_date` | string | Simulated date for dev (YYYY-MM-DD). Intentionally uses `gc:` prefix (not `gc1:`) to distinguish dev/test keys from user data keys. |

---

## What's Preserved Unchanged

- `marble-interpolator.js` — untouched, not loaded (v2 feature)
- Black marble background, frosted glass cards, heat system
- Cormorant Garamond + Josefin Sans fonts
- `markH()`, `updateHeat()`, `calcStreak()`, `getTier()`, `flameData()` core logic
- Streak tiers and flame animation system
- FAB + bottom sheet pattern
- Versioning convention: backup before each step, bump version number

---

## Out of Scope (this phase)

- Native iOS features (notifications, haptics, widgets)
- User accounts or cloud sync
- RevenueCat / paywall — **deferred to a future phase**, not permanently removed. Step 1 strips the active integration so the app runs standalone; the paywall system will be re-introduced later as a separate build phase.
- marble-interpolator time-of-day theming (v2)
- Profile/avatar (icon present, "Coming soon" sheet)
