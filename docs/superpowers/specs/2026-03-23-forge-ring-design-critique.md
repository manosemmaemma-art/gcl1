# GritCore v0.28 Forge Ring — Design Director Critique
*Generated 2026-03-23 against spec + overdrive-3d.html mockup*

Issues ordered: BLOCKING → IMPORTANT → MINOR

---

## BLOCKING

### B1 — box-shadow on bars inside rotateX(46deg) 3D context
**What:** `.tb-best`, `.tb-high`, and `@keyframes activeGlow` all use `box-shadow`. The terrain bars live inside `.terrain-floor { transform: rotateX(46deg) }` with `transform-style: preserve-3d`. Box-shadow is computed in the element's local plane and does not project correctly in 3D — it will appear clipped, offset, or invisible entirely on real iOS Safari.
**Why it matters:** The "best month" bar and active-month pulse are the primary visual payoff of the terrain. If the glow is broken, the terrain reads as a flat dead chart.
**Fix:** Replace all `box-shadow` on `.tb-best`, `.tb-high`, `.tb-active`, and `@keyframes activeGlow` with `filter: drop-shadow(...)`. Example:
```css
/* Replace: box-shadow: 0 0 18px rgba(255,200,60,.65) */
filter: drop-shadow(0 0 10px rgba(255,200,60,0.7));
```
Note: `filter` on elements inside `preserve-3d` contexts also has caveats — test on device. If `filter` also breaks, apply the glow to a `::after` pseudo-element positioned behind the bar using `position:absolute` and no 3D context.

### B2 — ghost name overflow on 320px–375px phones
**What:** `.ghost-name` is `font-size: 96px; white-space: nowrap; letter-spacing: -3px`. Month names like "September" or "December" at 96px italic bold will exceed 375px viewport width with no overflow handling. The element is `position:absolute; left:50%; transform:translate(-50%,-50%)` which means it can bleed outside `.ring-scene` and trigger horizontal scroll.
**Why it matters:** The app explicitly requires no horizontal scroll. One month name breaks the layout for 30% of the user base.
**Fix:** Add `overflow: hidden` to `.fr-ring-scene` (or the ghost name's containing block), AND add a font-size clamp:
```css
.fr-ghost-name {
  font-size: clamp(52px, 20vw, 96px);
  overflow: hidden;
  max-width: 100%;
}
```

---

## IMPORTANT

### I1 — .dim has no opacity defined in spec; mockup uses 0.2
**What:** The spec lists `.fr-hdr-arrow.dim` as a class but never states the opacity. The mockup sets `opacity: 0.2`. At 0.2, the arrow is barely perceptible against the dark background — it may not be obvious the button is merely disabled vs. absent.
**Why it matters:** Users may not understand they're at the current month boundary; they'll tap the dim arrow repeatedly thinking it's broken.
**Fix:** Set `opacity: 0.3` minimum (WCAG guidance for disabled controls is ≥ 0.3 for affordance legibility). Add `cursor: not-allowed` for desktop. Update spec to codify the value.

### I2 — SVG wedges have no gap — jagged seams at shared edges
**What:** The mockup draws all wedge `<path>` elements with `stroke="rgba(7,6,5,0.85)" stroke-width="1.5"`. While a dark stroke is present, adjacent wedges share the same stroke edge — each wedge draws its own 1.5px stroke, so the gap is actually doubled to ~3px at the seam, and the stroke color composites incorrectly at wedge boundaries on translucent fills.
**Why it matters:** On the crimson (failed) and low-gold fills, the doubled seam creates a hard visual artifact — the ring looks segmented rather than continuous. At 31 segments, the seam count is high enough to be distracting.
**Fix:** Use a small padding angle of 1°–1.5° between wedges (reduce each wedge's arc sweep by the padding amount). Remove the per-path `stroke` entirely and rely on the dark background showing through the padding gap. This gives a clean, intentional look — like links in a chain.

### I3 — Day detail overlay has no overflow handling for long discipline names
**What:** `.dd-lbl` has `font-size: 8px; text-align: left` but no `overflow: hidden`, `text-overflow: ellipsis`, or `max-width`. The day detail overlay is 140px wide (hardcoded `width:140px`). A discipline name like "Evening meditation & journaling" at 8px still wraps across 2–3 lines, causing the overlay to push outside the ring's center hole (inner radius 82px → usable diameter ~154px with padding).
**Why it matters:** With multiple wrapping discipline names, the day detail overflows the ring center on any month with 5+ disciplines.
**Fix:**
```css
.dd-lbl {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 96px; /* ring center minus icon + gap */
}
```
Also cap `.fr-day-detail` at `max-height: 120px; overflow-y: auto` with a custom scrollbar style (thin, gold-tinted).

### I4 — Terrain drag discoverability: hint fades out in 2s, nothing replaces it
**What:** `.terrain-drag-hint` with `animation: hintOut 2s 2s ease both` fades out after 4 seconds total (2s delay + 2s fade). After that, there is no affordance that the terrain is scrollable. The ring's tilt interaction also has no persistent hint.
**Why it matters:** First-time users who don't happen to swipe within 4 seconds will see a static terrain and a static ring — neither element communicates interactivity. This is a first-time developer's app; the audience may not assume everything is draggable.
**Fix:** Two options — (A) add a subtle looping scroll-bounce animation to the terrain (shifts the inner content 4px right/left once, on a 6s interval, after the initial hint fades) or (B) add a permanent `overflow: scroll` scrollbar on desktop (still hidden on iOS but gives mouse users a clue). For the ring, consider a very subtle ambient tilt (±2° oscillation, 8s, reduced-motion off) that communicates tiltability.

### I5 — Color is the only differentiator between 40–69% and 1–39% wedges on low-brightness displays
**What:** Mid-amber (`rgba(201,168,76,0.32)`) vs. crimson (`rgba(200,50,40,0.45)`) are the only visual distinctions between a struggling day and a failed day. No texture, shape, or icon difference.
**Why it matters:** WCAG 1.4.1 — color must not be the sole means of conveying information. On low-brightness or grayscale-accessibility mode, these two states are indistinguishable.
**Fix:** Add a subtle radial pattern or reduced-opacity `✕` at the center of failed-day wedges (rendered as an SVG `text` element inside the wedge arc). This also reinforces the emotional language — a marked failure is more motivating than a colored segment.

### I6 — rAF tilt loop and terrain momentum loop can run simultaneously
**What:** The JS has two independent rAF loops: `rafTilt` for ring damping and `terrRaf` for terrain momentum. Both can run concurrently with no shared budget or priority. Additionally, the `ringAmb` (ambient ring glow) and `activeGlow` (terrain pulse) are CSS `animation` loops running permanently on top of this.
**Why it matters:** On older iPhones (SE gen 1, iPhone 8) running Capacitor, simultaneous rAF + multiple CSS animation loops cause frame drops during scroll. The terrain momentum loop triggers `rAF` even when velocity is near-zero (`> 0.5`) — should threshold to `> 1.0` to avoid unnecessary frames.
**Fix:** Raise the momentum cutoff: `if (Math.abs(terrVel) > 1.0)`. Combine tilt damping into a single shared rAF loop that handles both tilt and terrain momentum per frame. Cancel `ringAmb` CSS animation when the Record tab is not visible (tab visibility check).

---

## MINOR

### M1 — Year boundary markers absent from mockup; spec requires `.fr-t-year-mark` rotated labels at 8px
**What:** The spec describes rotated 90° year labels (e.g. "2025") at `font-size: 8px`. The mockup's terrain has no year markers — the mock data spans Sep 2025–Mar 2026 across one month boundary but shows no visual divider. 8px rotated text is at the very edge of legibility, particularly in the 3D perspective where text farther from camera is perspective-foreshortened.
**Fix:** Use 9px minimum for year labels. Apply `font-size: clamp(8px, 2.2vw, 10px)`. Verify legibility at the perspective angle (46° rotateX foreshortens vertical text by ~cos(46°) ≈ 69% — so an 8px label effectively reads as ~5.5px). Consider using a short divider line + the year above the terrain (not inside the 3D floor) to sidestep the foreshortening problem.

### M2 — Ghost name color is near-invisible (opacity 0.042)
**What:** The mockup renders the ghost name at `rgba(201,168,76, 0.042)` — 4.2% opacity. This is essentially invisible against the dark background, making the typography decorative to the point of nonexistence.
**Why it matters:** The spec intended the ghost name as atmosphere and visual anchor for the month. At 4.2% it contributes nothing visually — the 96px letterforms are wasted.
**Fix:** Increase to `rgba(201,168,76, 0.08)` at minimum, `0.12` preferred. This is consistent with GritCore's existing ghost typography pattern. The number should be visible as subtle atmosphere but not compete with the ring.

### M3 — Theming: hardcoded hex values not using CSS variables
**What:** The mockup uses raw `#c9a84c` (gold), `rgba(201,168,76,...)` (gold), `rgba(200,50,40,...)` (crimson), and `rgba(7,6,5,...)` (near-black) throughout. GritCore's existing codebase uses `var(--gold-true)`, `var(--blood)`, `var(--ctd)` CSS variables.
**Why it matters:** If the app ever adjusts theme values (e.g. for future "Silver" or "Obsidian" theme tiers), the Forge Ring will be out of sync.
**Fix:** Replace all hardcoded gold, crimson, and background values with the established CSS variables in `gritcore.css`. For the SVG fill colors (which need RGBA values), use JS-side color constants that reference the CSS variable computed value rather than raw hex.

### M4 — Today wedge aria-label says "in progress" but is never updated to show actual completion
**What:** Spec: `aria-label="Today, in progress"` on the today wedge. This is static — it doesn't reflect how many disciplines are done. A VoiceOver user navigating the ring can't get live progress from the today wedge.
**Fix:** Update to `aria-label="Today: ${completed} of ${total} done"` and mark it `aria-live="polite"` so screen readers announce updates when disciplines are marked.

### M5 — Emotional tone: the center default state reads clinical
**What:** The ring center shows `"68% / Forged / 22 days logged"`. "22 days logged" is a data label — it sounds like a database report, not a warrior forge aesthetic.
**Fix:** Replace "days logged" with the word "days forged" or simply omit the count. The month word ("Forged", "Holding", "Wavering") should be the dominant element — bump it to Cormorant Garamond, increase opacity. The percentage should be secondary. The label text should feel earned, not counted.

### M6 — No visual distinction between "0% / no data" and "future" wedge states
**What:** "0% / no data" = `rgba(255,255,255,0.07)`. "Future" = `rgba(255,255,255,0.04)`. These two states are a 3% opacity difference — indistinguishable on real screens. Both appear as near-invisible grey.
**Fix:** Give "future" wedges a distinct visual treatment: a very subtle `stroke-dasharray` pattern (dashed outline) at `rgba(255,255,255,0.08)` with no fill, so they read as "not yet" rather than "empty data." Past-with-no-data stays as a faint solid fill.

---

## SUMMARY TABLE

| # | Severity | Issue | Fix complexity |
|---|----------|-------|---------------|
| B1 | BLOCKING | box-shadow broken in 3D transform context | Medium |
| B2 | BLOCKING | Ghost name overflows on narrow phones | Low |
| I1 | IMPORTANT | .dim opacity unspecified, 0.2 is too low | Low |
| I2 | IMPORTANT | SVG wedge seams doubled at shared edges | Medium |
| I3 | IMPORTANT | Day detail discipline names overflow ring center | Low |
| I4 | IMPORTANT | Terrain + ring drag has no persistent affordance | Medium |
| I5 | IMPORTANT | Color is sole differentiator for failed vs. struggling | Medium |
| I6 | IMPORTANT | Dual rAF loops + CSS animations = perf risk | Medium |
| M1 | MINOR | Year labels at 8px foreshortened in 3D perspective | Low |
| M2 | MINOR | Ghost name at 4.2% opacity is effectively invisible | Low |
| M3 | MINOR | Hardcoded hex bypasses CSS variable system | Low |
| M4 | MINOR | Today wedge aria-label is static, not live | Low |
| M5 | MINOR | "days logged" copy is clinical, not forge-toned | Low |
| M6 | MINOR | 0%-no-data and future wedges indistinguishable | Low |
