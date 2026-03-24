# Forge Ring v0.30 — Swipeable Pie Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3D tilt ring with a flat swipeable pie wheel on the Record tab, flatten the terrain strip, and polish all transitions.

**Architecture:** Rewrite `drawRing()` to render flat SVG wedges with day numbers, replace `initRingTilt()` with `initWheelSwipe()` for pointer-based rotation + snap, flatten terrain by removing 3D perspective transforms. All work in two files: `index.html` (JS) and `gritcore.css`.

**Tech Stack:** Vanilla JS, SVG, CSS transitions, Pointer Events API

**Spec:** `docs/superpowers/specs/2026-03-24-forge-ring-v030-swipeable-wheel-design.md`

**No automated tests** — GritCore is a no-build-step vanilla JS app. Each task ends with a visual verification step on the phone via live server at `http://192.168.178.202:8080`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `gritcore-app/www/index.html` | Modify (lines 675–1400) | All JS: ring rendering, swipe interaction, terrain, month nav |
| `gritcore-app/www/gritcore.css` | Modify (lines 1041–1094) | All CSS: ring scene, wheel, terrain, day detail |
| `gritcore-app/www/index.pre-v030.html` | Create | Backup before changes |
| `gritcore-app/www/gritcore.pre-v030.css` | Create | Backup before changes |

---

### Task 1: Create Backups

**Files:**
- Create: `gritcore-app/www/index.pre-v030.html` (copy of current `index.html`)
- Create: `gritcore-app/www/gritcore.pre-v030.css` (copy of current `gritcore.css`)

Note: v0.29 backups already exist. These are named `pre-v030` to avoid overwriting them.

- [ ] **Step 1: Copy current files as pre-v030 backups**

```bash
cp gritcore-app/www/index.html gritcore-app/www/index.pre-v030.html
cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.pre-v030.css
```

- [ ] **Step 2: Commit backups**

```bash
git add gritcore-app/www/index.pre-v030.html gritcore-app/www/gritcore.pre-v030.css
git commit -m "chore: create pre-v030 backups before Forge Ring swipeable wheel rewrite"
```

---

### Task 2: Update CSS — Remove 3D, Add Flat Wheel Classes

**Files:**
- Modify: `gritcore-app/www/gritcore.css:1041-1094`

**What to change:**

- [ ] **Step 1: Remove 3D from `.fr-ring-scene`**

Line 1047 — remove `perspective:480px` from `.fr-ring-scene`. Keep `flex:1;min-height:280px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;background:...`.

- [ ] **Step 2: Replace `.fr-ring-tilt` with `.fr-wheel-wrap`**

Lines 1049-1050 — replace the two `.fr-ring-tilt` rules with:

```css
.fr-wheel-wrap{position:relative;z-index:1;user-select:none;-webkit-user-select:none;touch-action:none;transition:transform 280ms cubic-bezier(0.25,1,0.5,1);}
.fr-wheel-wrap.scaled{transform:scale(1.12);}
```

- [ ] **Step 3: Update `#fr-ring-svg`**

Line 1051 — replace heavy drop-shadow with lighter one:

```css
#fr-ring-svg{display:block;overflow:visible;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.25));}
```

- [ ] **Step 4: Add new wedge state classes**

After the SVG rule, add:

```css
.fr-wedge--selected{opacity:1;transition:opacity 280ms cubic-bezier(0.25,1,0.5,1),filter 280ms cubic-bezier(0.25,1,0.5,1);}
.fr-wedge--dimmed{opacity:0.7;transition:opacity 280ms cubic-bezier(0.25,1,0.5,1);}
.fr-day-num{font-family:'Cormorant Garamond',serif;font-size:7px;fill:rgba(245,242,236,0.25);pointer-events:none;}
.fr-swipe-hint{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-family:'Josefin Sans',sans-serif;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(201,168,76,0.25);pointer-events:none;transition:opacity 280ms ease;}
```

- [ ] **Step 5: Flatten terrain CSS**

Line 1071 — `.fr-terrain-section`: change `height:220px` → `height:300px`.

Line 1076 — `.fr-terrain-stage`: remove `perspective:500px;perspective-origin:50% 40%`. Keep `width:100%;height:calc(100% - 26px);cursor:grab;overflow:hidden;`.

Line 1077 — (if it exists) remove `:active{cursor:grabbing;}` — actually keep this one.

Line 1078 — `.fr-terrain-floor`: replace `transform:rotateX(46deg);transform-origin:50% 100%;` with nothing. Keep `width:100%;height:100%;display:flex;align-items:flex-end;`.

Line 1080 — `.fr-t-col`: keep as-is.

Line 1082 (approx) — `.fr-t-bar`: add `border-radius:3px 3px 0 0;`.

- [ ] **Step 6: Verify CSS changes render (phone check)**

Open `http://192.168.178.202:8080`, go to Record tab. The ring will look broken (JS still references old classes) — that's expected. Verify: no CSS parse errors, terrain section is taller, terrain bars sit flat (no 3D tilt).

- [ ] **Step 7: Commit CSS changes**

```bash
git add gritcore-app/www/gritcore.css
git commit -m "style: remove 3D transforms, add flat wheel classes, flatten terrain"
```

---

### Task 3: Update `renderForgeRing()` Template + Rewrite `drawRing()` (Combined)

**IMPORTANT:** These must be done in a single commit. The HTML template and `drawRing()` reference each other — changing one without the other crashes the app.

**Files:**
- Modify: `gritcore-app/www/index.html:710-762` (renderForgeRing template)
- Modify: `gritcore-app/www/index.html:763-921` (drawRing function)

**Key reference:** Spec Section 2 (The Wheel) + Section 4 (Center Content)

- [ ] **Step 1a: Update the innerHTML template in `renderForgeRing()`**

Replace `.fr-ring-tilt` wrapper with `.fr-wheel-wrap`. Add swipe hint element. Add SVG filter `<defs>` for wedge glow. Replace `initRingTilt()` call with `initWheelSwipe()`.

```html
<div class="fr-wheel-wrap" id="fr-wheel-wrap">
  <svg id="fr-ring-svg" viewBox="0 0 256 256" width="256" height="256" aria-label="Discipline ring">
    <defs>
      <filter id="wedge-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="rgba(201,168,76,0.6)"/>
      </filter>
    </defs>
  </svg>
  <div class="fr-ring-center" id="fr-ring-center">...</div>
  <div class="fr-day-detail" id="fr-day-detail" style="display:none;opacity:0;">...</div>
</div>
<div class="fr-swipe-hint" id="fr-swipe-hint">swipe around the ring</div>
```

- [ ] **Step 1b: Rewrite `drawRing(mode)`**

Replace the entire `drawRing` function (line 763 to ~line 921) with a new implementation that:

1. Gets month data from `monthList[currentMonthIdx]`
2. Computes `sliceAngle = (2 * Math.PI) / daysInMonth` (recomputed each call, not cached)
3. Gap = `1.5 * Math.PI / 180`
4. For each day 1..daysInMonth:
   - Build SVG arc `<path>` from inner radius (82) to outer radius (122)
   - Set fill based on completion %: 100%→`rgba(201,168,76,0.50)`, 80%+→0.40, 60%+→0.30, 40%+→0.20, 20%+→0.12, 0%→0.05
   - Today's wedge: add `stroke-dasharray="4 2"` + `stroke="rgba(201,168,76,0.4)"`
   - Future days: fill `rgba(201,168,76,0.02)`, skip day number
   - Add `<text>` element with day number (Cormorant Garamond, 7px, opacity 0.25) positioned at midpoint of wedge arc, midway between inner and outer radius
   - Add click listener → `tapWedge(day, dateStr, pct, isToday)`
   - Add `role="button"`, `tabindex="0"`, `aria-label`
5. Draw center circle: `<circle cx="128" cy="128" r="80" fill="rgba(10,8,6,0.92)"/>`
6. Update center content (month summary): existing `fr-rc-pct`, `fr-rc-word`, `fr-rc-days` elements
7. Handle animation modes:
   - `'assemble'` → staggered wedge fade-in using **CSS opacity transitions** (not the old `wedgeIn` keyframe). Set each path `opacity:0` initially, then in a rAF set `opacity:1` with a staggered `transition-delay: ${i * 20}ms`
   - `'transition'` → crossfade (opacity 0→1 on the whole SVG content)
   - `false` → instant (no animation)

**Day number position formula:**
```javascript
const midAngle = startAngle + (sliceAngle - gap) / 2;
const textR = (82 + 122) / 2; // midpoint between inner and outer radius
const tx = 128 + textR * Math.cos(midAngle);
const ty = 128 + textR * Math.sin(midAngle);
```

**Wedge path formula (arc from inner to outer):**
```javascript
function wedgePath(i) {
  const a1 = i * sliceAngle + gap / 2;
  const a2 = (i + 1) * sliceAngle - gap / 2;
  const ox1 = CX + R * Math.cos(a1), oy1 = CY + R * Math.sin(a1);
  const ox2 = CX + R * Math.cos(a2), oy2 = CY + R * Math.sin(a2);
  const ix1 = CX + RI * Math.cos(a2), iy1 = CY + RI * Math.sin(a2);
  const ix2 = CX + RI * Math.cos(a1), iy2 = CY + RI * Math.sin(a1);
  const large = (a2 - a1 > Math.PI) ? 1 : 0;
  return `M${ox1},${oy1} A${R},${R} 0 ${large} 1 ${ox2},${oy2} L${ix1},${iy1} A${RI},${RI} 0 ${large} 0 ${ix2},${iy2} Z`;
}
```

- [ ] **Step 2: Verify ring renders (phone check)**

Open Record tab. Confirm: flat pie wheel visible with day numbers, no 3D tilt, wedges colored by completion, today's wedge has dashed stroke. Center shows month summary.

- [ ] **Step 3: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: rewrite drawRing() for flat pie wheel with day numbers"
```

---

### Task 4: Implement `initWheelSwipe()` — Core Swipe Interaction

**Files:**
- Modify: `gritcore-app/www/index.html` — replace `initRingTilt()` (lines 923-934) with `initWheelSwipe()`

This is the largest and most critical task. The function handles:
- Pointer tracking (angle from center)
- Wheel rotation via CSS transform
- Snap-to-nearest-wedge on release
- Selection state (pop wedge, scale wheel, update center)

- [ ] **Step 1: Write `initWheelSwipe()` function**

Replace `initRingTilt()` at line 923. Key implementation details:

```javascript
function initWheelSwipe() {
  const wrap = document.getElementById('fr-wheel-wrap');
  const svg = document.getElementById('fr-ring-svg');
  if (!wrap || !svg) return;

  let activePointerId = null;
  let startAngle = 0;
  let currentRotation = 0;  // degrees, persists across swipes
  let targetRotation = 0;
  let selectedDay = null;

  // Compute initial rotation: today (or last data day) at 12 o'clock
  const m = monthList[currentMonthIdx];
  const sliceAngle = 360 / m.daysInMonth;
  const today = getDate();
  const isCurrentMonth = (m.prefix === today.slice(0, 7));
  const targetDay = isCurrentMonth ? parseInt(today.slice(8)) : m.daysInMonth;
  // Day 1 starts at SVG 0° (3 o'clock). 12 o'clock = -90°.
  // To put targetDay at 12 o'clock:
  currentRotation = -90 - (targetDay - 1) * sliceAngle - sliceAngle / 2;
  svg.style.transform = `rotate(${currentRotation}deg)`;

  function getAngle(e) {
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }

  function snapToNearest() {
    const sliceDeg = 360 / monthList[currentMonthIdx].daysInMonth;
    // Which wedge is at 12 o'clock? Solve: currentRotation + (day-1)*sliceDeg + sliceDeg/2 ≡ -90 (mod 360)
    // Normalize rotation, find nearest wedge center
    const offset = ((-90 - currentRotation) % 360 + 360) % 360;
    const dayIdx = Math.round(offset / sliceDeg) % monthList[currentMonthIdx].daysInMonth;
    targetRotation = -90 - dayIdx * sliceDeg - sliceDeg / 2;
    // Minimize travel distance
    while (targetRotation - currentRotation > 180) targetRotation -= 360;
    while (targetRotation - currentRotation < -180) targetRotation += 360;
    svg.style.transition = 'transform 280ms cubic-bezier(0.25,1,0.5,1)';
    svg.style.transform = `rotate(${targetRotation}deg)`;
    currentRotation = targetRotation;
    // Select that day
    selectDay(dayIdx + 1);
    setTimeout(() => { svg.style.transition = ''; }, 300);
  }

  function selectDay(day) { /* see Step 2 */ }
  function deselectDay() { /* see Step 2 */ }

  wrap.addEventListener('pointerdown', (e) => {
    if (activePointerId !== null) return;
    activePointerId = e.pointerId;
    wrap.setPointerCapture(e.pointerId);
    startAngle = getAngle(e) - currentRotation;
    svg.style.transition = '';
  });

  wrap.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointerId) return;
    currentRotation = getAngle(e) - startAngle;
    svg.style.transform = `rotate(${currentRotation}deg)`;
  });

  wrap.addEventListener('pointerup', (e) => {
    if (e.pointerId !== activePointerId) return;
    wrap.releasePointerCapture(e.pointerId);
    activePointerId = null;
    snapToNearest();
  });

  wrap.addEventListener('pointercancel', (e) => {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    snapToNearest();
  });

  // Expose for month changes
  wrap._resetRotation = function(newMonth) {
    selectedDay = null;
    deselectDay();
    const nm = monthList[currentMonthIdx];
    const sd = 360 / nm.daysInMonth;
    const td = nm.prefix === getDate().slice(0,7) ? parseInt(getDate().slice(8)) : nm.daysInMonth;
    currentRotation = -90 - (td - 1) * sd - sd / 2;
    svg.style.transition = 'transform 280ms cubic-bezier(0.25,1,0.5,1)';
    svg.style.transform = `rotate(${currentRotation}deg)`;
    setTimeout(() => { svg.style.transition = ''; }, 300);
  };
}
```

- [ ] **Step 2: Implement `selectDay()` and `deselectDay()` inside `initWheelSwipe()`**

```javascript
function selectDay(day) {
  if (selectedDay === day) {
    // Second tap on same day → open full detail
    const m = monthList[currentMonthIdx];
    const ds = `${m.prefix}-${String(day).padStart(2,'0')}`;
    const pct = dayPct(ds, effH(), effL());
    const isToday = (ds === getDate());
    tapWedge(day, ds, pct, isToday);
    return;
  }
  selectedDay = day;
  const paths = svg.querySelectorAll('path[data-day]');
  const sliceDeg = 360 / monthList[currentMonthIdx].daysInMonth;
  paths.forEach(p => {
    const d = parseInt(p.dataset.day);
    if (d === day) {
      // Pop outward 8px along radial axis
      const midAngle = ((d - 1) * sliceDeg + sliceDeg / 2) * Math.PI / 180;
      const dx = Math.cos(midAngle) * 8;
      const dy = Math.sin(midAngle) * 8;
      p.setAttribute('transform', `translate(${dx},${dy})`);
      p.style.filter = 'url(#wedge-glow)';
      p.classList.add('fr-wedge--selected');
      p.classList.remove('fr-wedge--dimmed');
    } else {
      p.removeAttribute('transform');
      p.style.filter = '';
      p.classList.add('fr-wedge--dimmed');
    }
  });
  // Scale wheel
  wrap.classList.add('scaled');
  // Hide swipe hint
  const hint = document.getElementById('fr-swipe-hint');
  if (hint) hint.style.opacity = '0';
  // Update center with day info
  const m = monthList[currentMonthIdx];
  const ds = `${m.prefix}-${String(day).padStart(2,'0')}`;
  const pct = dayPct(ds, effH(), effL());
  const isToday = (ds === getDate());
  showDayInfo(day, ds, pct, isToday);
}

function deselectDay() {
  selectedDay = null;
  const paths = svg.querySelectorAll('path[data-day]');
  paths.forEach(p => {
    p.removeAttribute('transform');
    p.style.filter = '';
    p.classList.remove('fr-wedge--dimmed');
    p.classList.remove('fr-wedge--selected');
  });
  wrap.classList.remove('scaled');
  const hint = document.getElementById('fr-swipe-hint');
  if (hint) hint.style.opacity = '';
  // Restore month summary in center
  showMonthSummary();
}
```

- [ ] **Step 3: Implement `showDayInfo()` and `showMonthSummary()` helpers**

These handle the center crossfade. **Place them as module-level functions** near `tapWedge()` (around line 1033). They must be module-level because `closeDetail()` also needs to call `showMonthSummary()`, and `tapWedge()` needs `showDayInfo()`. Do NOT place them inside `initWheelSwipe()` — that would make them inaccessible to other functions.

```javascript
function showDayInfo(day, dateStr, pct, isToday) {
  const center = document.getElementById('fr-ring-center');
  if (!center) return;
  const d = new Date(dateStr + 'T00:00:00');
  const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateText = `${mn[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const word = isToday ? 'In progress…' : scoreWord(pct || 0);
  const hh = effH(), ll = effL();
  const dayLog = ll[dateStr] || {};
  const doneCount = hh.filter(h => dayLog[h.id] === 'done').length;

  center.style.transition = 'opacity 130ms ease-in';
  center.style.opacity = '0';
  setTimeout(() => {
    document.getElementById('fr-rc-pct').textContent = `${pct || 0}%`;
    document.getElementById('fr-rc-word').textContent = word;
    document.getElementById('fr-rc-days').textContent = `${doneCount} of ${hh.length} done`;
    // Add date above percentage
    let dateEl = document.getElementById('fr-rc-date');
    if (!dateEl) {
      dateEl = document.createElement('div');
      dateEl.id = 'fr-rc-date';
      dateEl.style.cssText = 'font-family:"Josefin Sans",sans-serif;font-size:8px;letter-spacing:0.12em;opacity:0.35;text-transform:uppercase;margin-bottom:2px;';
      center.insertBefore(dateEl, center.firstChild);
    }
    dateEl.textContent = dateText;
    dateEl.style.display = '';
    center.style.transition = 'opacity 220ms cubic-bezier(0.25,1,0.5,1)';
    requestAnimationFrame(() => center.style.opacity = '1');
  }, 140);
}

function showMonthSummary() {
  const center = document.getElementById('fr-ring-center');
  if (!center) return;
  const m = monthList[currentMonthIdx];
  center.style.transition = 'opacity 130ms ease-in';
  center.style.opacity = '0';
  setTimeout(() => {
    const dateEl = document.getElementById('fr-rc-date');
    if (dateEl) dateEl.style.display = 'none';
    document.getElementById('fr-rc-pct').textContent = (m.hasData && m.pct != null) ? `${m.pct}%` : '—';
    document.getElementById('fr-rc-word').textContent = (m.hasData && m.word) ? m.word : 'No data';
    document.getElementById('fr-rc-days').textContent = (m.hasData && m.daysWithData != null) ? `${m.daysWithData} of ${m.daysInMonth} days` : '';
    center.style.transition = 'opacity 220ms cubic-bezier(0.25,1,0.5,1)';
    requestAnimationFrame(() => center.style.opacity = '1');
  }, 140);
}
```

- [ ] **Step 4: Verify swipe works (phone check)**

Open Record tab. Test:
- Swipe finger around wheel → wheel rotates following finger
- Lift finger → snaps to nearest wedge
- Selected wedge pops out, wheel scales up
- Center shows day info
- Swipe again → new wedge selected
- Today's wedge has dashed stroke

- [ ] **Step 5: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: implement initWheelSwipe() with pointer tracking, snap, and selection"
```

---

### Task 5: Delete `initRingTilt()` and Clean Up `animFrame()`

**Files:**
- Modify: `gritcore-app/www/index.html:923-934` (initRingTilt) and `1299-1340` (animFrame)

- [ ] **Step 1: Remove `initRingTilt()` entirely**

It was already replaced by `initWheelSwipe()` in Task 4. Delete the old function body if any remnant exists.

- [ ] **Step 2: Clean up `animFrame()`**

Remove the ring tilt physics portion from `animFrame()`. Keep any terrain-related animation logic. If `animFrame()` only handled ring tilt, remove it and `startAnimFrame()` entirely.

- [ ] **Step 3: Verify no JS errors (phone check)**

Open Record tab, check browser console for errors. Confirm terrain still animates correctly.

- [ ] **Step 4: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "fix: remove initRingTilt() and clean up animFrame()"
```

---

### Task 6: Update `tapWedge()` and `closeDetail()`

**Files:**
- Modify: `gritcore-app/www/index.html:1033-1087`

- [ ] **Step 1: Update `tapWedge()`**

Modify `tapWedge()` to work with the new wheel. When called (from `selectDay()` on second tap, or from wedge click):
- Keep existing day detail crossfade logic
- Add: rotate wheel to bring tapped wedge to 12 o'clock if called from a direct wedge click (not from swipe selection)

- [ ] **Step 2: Update `closeDetail()`**

Modify `closeDetail()` to also deselect the wedge:
- After hiding day detail and showing center: call `deselectDay()` (need to expose it from `initWheelSwipe`)
- Scale wheel back to 1.0, retract popped wedge
- Restore swipe hint opacity

Expose deselect by storing it on the wrap element:
```javascript
// In initWheelSwipe():
wrap._deselectDay = deselectDay;

// In closeDetail():
const wrap = document.getElementById('fr-wheel-wrap');
if (wrap && wrap._deselectDay) wrap._deselectDay();
```

- [ ] **Step 3: Verify tap-to-detail flow (phone check)**

Test: tap a wedge → day info in center → tap center or wedge again → full detail overlay → close → back to month summary, wedge deselected.

- [ ] **Step 4: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: update tapWedge/closeDetail for swipeable wheel selection model"
```

---

### Task 7: Update `changeMonth()` and `jumpToMonth()` — Reset Rotation

**Files:**
- Modify: `gritcore-app/www/index.html:1134-1400`

- [ ] **Step 1: Add rotation reset to `changeMonth()`**

At the start of `changeMonth()`, before calling `drawRing('transition')`:
```javascript
const wrap = document.getElementById('fr-wheel-wrap');
if (wrap && wrap._resetRotation) wrap._resetRotation();
```

- [ ] **Step 2: Add rotation reset to `jumpToMonth()`**

Same pattern at the start of `jumpToMonth()`:
```javascript
const wrap = document.getElementById('fr-wheel-wrap');
if (wrap && wrap._resetRotation) wrap._resetRotation();
```

- [ ] **Step 3: Verify month navigation (phone check)**

Test: select a wedge on current month → tap terrain bar for a different month → wheel rebuilds with correct days, rotation reset to today/last day, no selection state carried over. Also test header arrows.

- [ ] **Step 4: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "fix: reset wheel rotation and selection on month change"
```

---

### Task 8: Flatten `buildTerrain()`

**Files:**
- Modify: `gritcore-app/www/index.html:1151-1222`

- [ ] **Step 1: Update bar height calculation**

In `buildTerrain()`, change the bar height formula:
```javascript
// OLD:
const barH = Math.max(14, Math.round((m.pct / 100) * (isActive ? 160 : 130)));
// NEW:
const barH = Math.max(14, Math.round((m.pct / 100) * 200));
```

No more active/inactive height distinction — all bars use the same max (200px). The active bar is distinguished by color/border, not height.

- [ ] **Step 2: Add border-radius to bar creation**

In the bar element creation, add:
```javascript
bar.style.borderRadius = '3px 3px 0 0';
```

- [ ] **Step 3: Update gap**

In `.fr-terrain-inner` CSS or inline, ensure gap is `8px` (was 7px).

- [ ] **Step 4: Verify flat terrain (phone check)**

Open Record tab. Terrain should be taller (300px), bars flat (no 3D tilt), rounded top corners, active month highlighted with gold border. Drag scroll still works.

- [ ] **Step 5: Commit**

```bash
git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
git commit -m "feat: flatten terrain strip, taller bars, no 3D perspective"
```

---

### Task 9: Keyboard Accessibility + Reduced Motion

**Files:**
- Modify: `gritcore-app/www/index.html` (inside `initWheelSwipe`)
- Modify: `gritcore-app/www/gritcore.css`

- [ ] **Step 1: Add arrow key navigation**

Inside `initWheelSwipe()`, add a `keydown` listener on `.fr-wheel-wrap`:
```javascript
wrap.addEventListener('keydown', (e) => {
  const daysInMonth = monthList[currentMonthIdx].daysInMonth;
  const sliceDeg = 360 / daysInMonth;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    // Compute current day at 12 o'clock, advance by 1
    const offset = ((-90 - currentRotation) % 360 + 360) % 360;
    const curIdx = Math.round(offset / sliceDeg) % daysInMonth;
    const nextIdx = (curIdx + 1) % daysInMonth;
    currentRotation = -90 - nextIdx * sliceDeg - sliceDeg / 2;
    svg.style.transition = 'transform 280ms cubic-bezier(0.25,1,0.5,1)';
    svg.style.transform = `rotate(${currentRotation}deg)`;
    selectDay(nextIdx + 1);
    setTimeout(() => { svg.style.transition = ''; }, 300);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    const offset = ((-90 - currentRotation) % 360 + 360) % 360;
    const curIdx = Math.round(offset / sliceDeg) % daysInMonth;
    const prevIdx = (curIdx - 1 + daysInMonth) % daysInMonth;
    currentRotation = -90 - prevIdx * sliceDeg - sliceDeg / 2;
    svg.style.transition = 'transform 280ms cubic-bezier(0.25,1,0.5,1)';
    svg.style.transform = `rotate(${currentRotation}deg)`;
    selectDay(prevIdx + 1);
    setTimeout(() => { svg.style.transition = ''; }, 300);
  }
  if (e.key === 'Escape') {
    deselectDay();
  }
});
wrap.setAttribute('tabindex', '0');
wrap.setAttribute('role', 'group');
wrap.setAttribute('aria-label', 'Monthly discipline wheel — use arrow keys to navigate days');
```

- [ ] **Step 2: Add reduced motion support**

In the inline `<style>` block (where `prefers-reduced-motion` rules live), add:

```css
@media(prefers-reduced-motion:reduce){
  .fr-wheel-wrap, #fr-ring-svg, .fr-wedge--dimmed, .fr-wedge--selected {
    transition-duration: 0ms !important;
  }
}
```

- [ ] **Step 3: Verify keyboard nav (desktop browser)**

Tab to the wheel, use arrow keys to navigate wedges. Verify Escape deselects.

- [ ] **Step 4: Commit**

```bash
git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
git commit -m "a11y: add arrow key navigation and reduced motion support for wheel"
```

---

### Task 10: Remove Inline Keyframes for Old Ring Animations

**Files:**
- Modify: `gritcore-app/www/index.html` (inline `<style>` block, lines ~25-50)

- [ ] **Step 1: Remove old ring-specific keyframes**

Remove `@keyframes wedgeIn`, `@keyframes barRise`, `@keyframes activeGlow`, `@keyframes ghostSlide` if they exist in the inline style block. Keep all other keyframes (f1-f12 flame animations, heatPulse, etc.).

**Check first:** grep for these keyframe names to see if they're referenced anywhere else. If `barRise` is used by terrain, keep it. Only remove keyframes that were exclusively for the 3D ring.

- [ ] **Step 2: Verify no animation breaks (phone check)**

Check: Today tab flame animations still work, terrain bar rise animation still works, no console errors.

- [ ] **Step 3: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "fix: remove unused 3D ring keyframes"
```

---

### Task 11: Update Version Strings + Final Polish

**Files:**
- Modify: `gritcore-app/www/index.html` (version strings)
- Modify: `gritcore-app/www/gritcore.css` (any remaining tweaks)

- [ ] **Step 1: Update version strings from 0.29 to 0.30**

Search for version references in `index.html` and update:
```javascript
// Find and replace version strings
// e.g., in settings panel or about section
```

- [ ] **Step 2: Final visual check (phone check)**

Complete walkthrough on phone:
1. Open Record tab → flat wheel with day numbers visible
2. Swipe around → wheel follows finger, snaps smoothly
3. Selected wedge pops, wheel scales, center shows day info
4. Tap center → full day detail with habits list
5. Close detail → back to month summary
6. Tap header arrows → month changes, rotation resets
7. Tap terrain bar → jumps to that month
8. Drag terrain → momentum scroll works
9. Switch to Today tab and back → Record tab re-renders correctly
10. Check no horizontal overflow or layout breaks

- [ ] **Step 3: Update CLAUDE.md with v0.30 changes**

Add v0.30 section documenting new APIs (`initWheelSwipe`, `showDayInfo`, `showMonthSummary`), removed functions (`initRingTilt`), and CSS changes.

- [ ] **Step 4: Final commit**

```bash
git add gritcore-app/www/index.html gritcore-app/www/gritcore.css CLAUDE.md
git commit -m "feat: Forge Ring v0.30 — swipeable pie wheel, flat terrain, visual polish"
```

---

## Task Dependency Graph

```
Task 1 (backups)
  └─→ Task 2 (CSS changes)
        └─→ Task 3 (template + drawRing rewrite — single commit)
              └─→ Task 4 (initWheelSwipe) ← CRITICAL PATH
                    ├─→ Task 5 (delete initRingTilt)
                    ├─→ Task 6 (tapWedge/closeDetail)
                    ├─→ Task 7 (changeMonth/jumpToMonth)
                    └─→ Task 8 (flatten terrain)
                          └─→ Task 9 (a11y + reduced motion)
                                └─→ Task 10 (remove old keyframes)
                                      └─→ Task 11 (version + polish)
```

Tasks 5, 6, 7 can be parallelized after Task 4. Task 8 can run in parallel with 5-7.
