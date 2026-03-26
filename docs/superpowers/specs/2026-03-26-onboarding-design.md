# GritCore Onboarding — Design Spec

**Date:** 2026-03-26
**Version:** v0.32 (planned)
**Status:** Approved — awaiting implementation plan

---

## Overview

A 3-screen cinematic fullscreen onboarding experience for first-time users. Returning users go straight to Today tab. Includes Forge tab category management upgrade and a dev button in Settings.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Aha moment | Atmosphere first, then action (D) | Brief brand moment → guided first discipline |
| Screen count | 3 screens | Enough for wow without too much friction |
| Visual style | Cinematic Fullscreen (A) | Full-bleed marble, big centered text, like movie credits |
| Returning users | No daily splash (D) | App itself is the daily motivation (streaks, heat, PD) |
| Screen 3 creation | Hybrid with suggestions + custom (C) | 5 chips for quick start, text input for personal touch |
| Screen 3 complexity | Lighter with Forge link (A) | Keep onboarding elegant, push full CRUD to Forge tab |
| Suggestion chips | Exercise, Meditate, Read, Wake Early, Journal | Universal, bold, 5 is clean |

---

## Screen 1 — Brand Reveal

**Purpose:** Atmospheric brand moment. Set the tone.

**Content:**
- Full-bleed dark marble background (existing `body::before`)
- "GRITCORE" wordmark — centered, gold, 12px letter-spacing
- "FORGE YOUR DISCIPLINE" tagline — smaller, dimmed
- Subtle gold radial glow pulsing behind text
- Progress bars at bottom (3 bars, first is gold)

**Animations:**
- Wordmark fades in: opacity 0→1 over 0.8s
- Tagline fades in: 0.4s delay after wordmark
- Gold radial glow: subtle pulse (3s infinite)

**Interaction:** Tap anywhere or swipe left to advance.

---

## Screen 2 — The Forge Metaphor

**Purpose:** Introduce the core identity. "This isn't a habit app."

**Content:**
- Hammer icon (⚒) centered, gold drop-shadow
- Headline: "Habits are temporary. Disciplines are forged."
- Subtext: "Track what matters. Build streaks of iron. Watch your progress burn brighter every day."
- Progress bars at bottom (second is gold)
- "Skip" link in top-right corner

**Animations:**
- Hammer icon drops in with slight bounce
- Headline fades up from below (translateY 20px → 0)
- Subtext fades in 0.3s after headline

**Interaction:** Tap or swipe to advance. "Skip" dismisses onboarding, sets `gc:onboarded`, lands on Today tab.

---

## Screen 3 — Forge Your First Discipline

**Purpose:** Get the user to create their first discipline. Quick start with room for personalization.

**Content (top to bottom):**
1. **Title:** "Choose your first discipline"
2. **Subtitle:** "Tap suggestions or type your own"
3. **Suggestion chips:** Exercise, Meditate, Read, Wake Early, Journal
   - Multi-select: tapping toggles gold border + ✓
   - Deselecting removes the ✓
4. **Custom text input:** Placeholder "e.g. Cold Shower"
   - Typing a name adds it alongside selected chips
5. **Category dropdown:** Optional
   - Default: "Uncategorized"
   - Shows existing categories (if any from chips' defaults)
   - "Create new..." option at bottom opens inline input
   - Category applies to custom-typed discipline only (chips get sensible defaults or Uncategorized)
6. **"BEGIN FORGING" button:** Primary gold CTA
   - Creates all selected + typed disciplines
   - Sets `gc:onboarded` to "1" in localStorage
   - Dismisses onboarding with 0.4s fade-out
   - Lands on Today tab
7. **Forge hint:** "Want full control? Go to Forge →"
   - Dismisses onboarding, sets `gc:onboarded`, lands on Forge tab
8. **Progress bars** at bottom (third is gold)
9. **"Skip" link** in top-right corner

**Animations:**
- Chips stagger in (60ms delay each)
- Input and button fade up

---

## Forge Tab — Category Management (New Feature)

**Purpose:** Full CRUD for categories. Power user territory.

**Location:** New "Categories" section above the discipline input on Forge tab.

### Category List
- Each row shows: drag handle (☰) | category name | discipline count | rename (✎) | delete (✕)
- Rows are reorderable via drag handle (same drag system as discipline reorder)

### Create Category
- "+ Add Category" button with dashed border at bottom of category list
- Tapping opens an inline text input field in-place
- Enter/blur saves the category

### Rename Category
- Tap ✎ icon → category name becomes an editable inline text field
- Enter/blur saves

### Delete Category
- Tap ✕ → confirmation dialog: "Delete [name]? Disciplines will move to Uncategorized."
- On confirm: disciplines in that category get `cat: ''` (Uncategorized)
- Save and re-render

### Move Discipline to Category
- Long-press on a discipline card → category picker bottom sheet appears
- Sheet lists all categories + "Uncategorized"
- Tapping one reassigns the discipline and closes the sheet

### Default Categories
- No default categories are pre-created
- Suggestion chip disciplines are created as "Uncategorized" unless user picks a category on Screen 3

---

## Settings — Dev Button

**Purpose:** Replay onboarding for development/testing without clearing all data.

**Location:** Bottom of Settings sheet, after existing rows.

**UI:**
- Row with wrench icon (🔧)
- Label: "Show Onboarding"
- Sublabel: "Dev: replay the intro flow"

**Behavior:**
- Removes `gc:onboarded` from localStorage
- Immediately shows the onboarding overlay
- Does NOT clear habits, logs, milestones, or any other data

---

## Technical Details

### localStorage
- **New key:** `gc:onboarded` — value `"1"` when onboarding is complete
- **Gate:** On app init (`initApp()`), check `gc:onboarded`. If not set → show onboarding overlay.

### Overlay
- `position: fixed; inset: 0; z-index: 500` (matches existing `#onboarding` CSS)
- Covers entire viewport including nav bar
- Contains 3 screen panels, only one visible at a time

### Navigation
- Swipe left/right (touch events) to move between screens
- Tap to advance (screen 1 and 2 only)
- Arrow keys for keyboard navigation
- Progress bars indicate current position (3 thin bars)

### Accessibility
- Focus trap within onboarding overlay
- `role="dialog"` and `aria-modal="true"` on overlay
- `aria-label` on each screen
- Arrow key navigation between screens
- "Skip" link is focusable
- `prefers-reduced-motion`: fade-ins still work, skip translate/bounce/glow animations

### Dismiss Animation
- 0.4s opacity fade-out on the entire overlay
- After animation completes: remove overlay from DOM, render Today/Forge tab

### Replaces
- The existing `showOnboarding()` / `beginApp()` functions and `#onboarding` / `#onboarding-card` CSS
- The existing onboarding is a simple brand card + "Begin" button — this replaces it entirely

---

## Out of Scope

- Daily returning user splash/greeting (decided: no daily splash)
- Paywall integration on onboarding
- Analytics/tracking of onboarding completion
- A/B testing different onboarding flows
- Animated forge particles (future polish — keep it achievable for v1)
