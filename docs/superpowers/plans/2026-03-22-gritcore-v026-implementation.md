# GritCore v0.26 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the foundation (token unification, spacing, typography, a11y), add motion polish, and ship 5 delight features — all on the dark marble aesthetic, no libraries, no build step.

**Architecture:** Single-file vanilla JS app (`index.html`, 1521 lines) with a CSS override file (`gritcore.css`, 811 lines). All CSS lives in a `<style>` block inside `index.html`; `gritcore.css` adds/overrides. No framework, no bundler. Verification is visual — open in browser and use `devAddTestData()` in dev console.

**Tech Stack:** Vanilla JS, CSS custom properties, Capacitor 6 iOS wrapper. No test runner — every task ends with a visual verify step and a git commit.

**Spec:** `docs/superpowers/specs/2026-03-22-gritcore-v026-design.md`
**Resume:** `docs/superpowers/plans/v0.26-plan.md`

---

## Pre-flight

Before starting any task:
```bash
cd C:/Users/emman/Desktop/gritcore/clkaude/gritcore-app/www
cp index.html index.0.26.html
cp gritcore.css gritcore.0.26.css
git add index.0.26.html gritcore.0.26.css
git commit -m "chore: backup v0.25 before v0.26 work"
```

---

## Phase 1 — Foundation

---

### Task 1: Commit the Rollback

**Files:**
- Modify (already done): `gritcore-app/www/index.html`

The working copy already has the correct state — light/dark theming removed, `devResetDate()` added, `.rpt-section-hdr` class added.

- [ ] **Step 1: Verify working copy state**

```bash
cd C:/Users/emman/Desktop/gritcore/clkaude
git diff HEAD --stat
```
Expected: shows changes to `index.html`, `gritcore.css`, and `.claude/settings.local.json`

- [ ] **Step 2: Verify no getDarkPct / applyDarkness in working copy**

```bash
grep -c "getDarkPct\|applyDarkness\|body\.dark" gritcore-app/www/index.html
```
Expected: `0`

- [ ] **Step 3: Commit**

```bash
cd C:/Users/emman/Desktop/gritcore/clkaude
git add gritcore-app/www/index.html gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.25.css gritcore-app/www/index.0.25.html
git commit -m "fix: revert light/dark theming — dark-only for v0.26"
```

---

### Task 2: Token Unification

**Files:**
- Modify: `gritcore-app/www/gritcore.css` — replace all `--color-*` vars with `index.html` tokens, delete definitions, delete !importants

- [ ] **Step 1: Find all --color-* usages in gritcore.css**

```bash
grep -n "\-\-color-" gritcore-app/www/gritcore.css
```
Note every line number. You will replace each one.

- [ ] **Step 2: Apply the token mapping**

In `gritcore.css`, do a find-and-replace for each:
| Find | Replace |
|------|---------|
| `var(--color-surface)` | `var(--bg)` |
| `var(--color-card)` | `var(--cs)` |
| `var(--color-card-border)` | `var(--cbor)` |
| `var(--color-nav)` | `var(--cs)` |
| `var(--color-text-hi)` | `var(--ct)` |
| `var(--color-text-mid)` | `var(--cts)` |
| `var(--color-text-lo)` | `var(--ctd)` |
| `var(--color-gold)` | `var(--gold)` |
| `var(--color-silver)` | `var(--cts)` |
| `var(--color-blood)` | `var(--blood)` |
| `var(--color-blood-dim)` | `var(--bloodb)` |
| `var(--color-veil)` | `rgba(0,0,0,0.30)` (hardcode — no token equivalent) |

- [ ] **Step 3: Delete --color-* definitions**

Find and delete the `:root { --color-surface: ...; --color-veil: ...; ... }` block at the top of `gritcore.css`. It defines all the old tokens — remove the whole block.

- [ ] **Step 4: Delete all !important overrides**

```bash
grep -n "!important" gritcore-app/www/gritcore.css
```
For each result: remove the `!important` from that line (keep the rule, just remove the override keyword).

- [ ] **Step 5: Verify**

```bash
grep -c "\-\-color-\|!important" gritcore-app/www/gritcore.css
```
Expected: `0`

- [ ] **Step 6: Visual verify**
Open `index.html` in browser. Open all 4 tabs. Confirm nothing is broken (colors, cards, heat system). Use `devAddTestData()` to populate data.

- [ ] **Step 7: Commit**

```bash
git add gritcore-app/www/gritcore.css
git commit -m "refactor: unify CSS token system — replace --color-* with --ct/--cs/--gold tokens"
```

---

### Task 3: Spacing Scale

**Files:**
- Modify: `gritcore-app/www/index.html` — add spacing tokens to `:root`, normalize spacing in `<style>` block
- Modify: `gritcore-app/www/gritcore.css` — normalize spacing

- [ ] **Step 1: Add spacing tokens to :root in index.html**

In `index.html`, find the `:root {` block (near top of `<style>`). Add after the last existing var:
```css
--sp-xs:4px; --sp-sm:8px; --sp-md:16px; --sp-lg:24px; --sp-xl:32px;
```

- [ ] **Step 2: Audit spacing in Today tab**

Search for hardcoded spacing in `.hcard`, `.hbtn`, `.progress-wrap`, `.hcard-streak` CSS rules. Replace:
- `padding: 4px` or `gap: 4px` → `var(--sp-xs)`
- `padding: 8px` or `gap: 8px` → `var(--sp-sm)`
- `padding: 16px` or `gap: 16px` → `var(--sp-md)`
- `padding: 24px` or `gap: 24px` → `var(--sp-lg)`

- [ ] **Step 3: Audit spacing in Record tab**

Search for hardcoded spacing in `.rec-month-nav`, `.rec-day-row`, `.rec-day-bar`, `.hm-cell` rules. Apply same substitution.

- [ ] **Step 4: Audit spacing in Report tab**

Search for hardcoded spacing in `.rpt-bests-grid`, `.rpt-week-wrap`, `.rpt-month-row`, `.rpt-section-hdr`. Apply substitution.

- [ ] **Step 5: Audit spacing in Forge tab**

Search for hardcoded spacing in `.forge-*`, `.fab-sheet`, `.add-form` rules. Apply substitution.

- [ ] **Step 6: Apply same to gritcore.css**

```bash
grep -n "padding:\|margin:\|gap:" gritcore-app/www/gritcore.css | grep -v "var("
```
Replace hardcoded values that match the scale.

- [ ] **Step 7: Visual verify**

Open all 4 tabs. Check for layout breakage. Spacing should feel consistent — no jarring gaps or cramped sections.

- [ ] **Step 8: Commit**

```bash
git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
git commit -m "refactor: introduce spacing scale tokens --sp-xs through --sp-xl"
```

---

### Task 4: Typography Lift

**Files:**
- Modify: `gritcore-app/www/index.html` — lift all font-sizes below 11px
- Modify: `gritcore-app/www/gritcore.css` — lift any below 11px

- [ ] **Step 1: Find all sub-threshold font sizes in index.html**

```bash
grep -n "font-size:\s*[6-9]\(\.[0-9]*\)\?px" gritcore-app/www/index.html
```
Note every line.

- [ ] **Step 2: Lift each to 11px**

For every result from Step 1: change the value to `11px`. Keep all other properties (`letter-spacing`, `text-transform`, `font-weight`) unchanged.

Sizes to lift: `6.5px`, `7px`, `7.5px`, `8px`, `8.5px`, `9px`, `9.5px` → all become `11px`.

**Exception:** `.bni-lbl` (tab bar labels, added in Task 12) stays at `8px`.

- [ ] **Step 3: Check gritcore.css**

```bash
grep -n "font-size:\s*[6-9]\(\.[0-9]*\)\?px" gritcore-app/www/gritcore.css
```
Lift any found (same rule, same exception).

- [ ] **Step 4: Visual verify**

Open app. Check every tab. Labels should be readable on device — especially Record heatmap dates, Report section headers, toast sub-text. Nothing should overflow its container.

- [ ] **Step 5: Commit**

```bash
git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
git commit -m "fix: lift all font sizes to 11px minimum (typography a11y)"
```

---

### Task 5: Inline Style Cleanup

**Files:**
- Modify: `gritcore-app/www/index.html` — extract top inline styles to CSS classes

Target: the 4 `rpt-section-hdr` uses are already done. Extract the next highest-repetition patterns.

- [ ] **Step 1: Find most-repeated inline style patterns**

```bash
grep -o 'style="[^"]*"' gritcore-app/www/index.html | sort | uniq -c | sort -rn | head -20
```
Note the top patterns.

- [ ] **Step 2: Extract pattern — stat value rows**

Find any inline `style="display:flex;align-items:center;..."` on stat rows. Add to `<style>` block:
```css
.stat-row{display:flex;align-items:center;gap:var(--sp-sm);}
.stat-val{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:var(--ct);}
.stat-lbl{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ctdd);}
```
Replace matching inline styles with the class.

- [ ] **Step 3: Extract pattern — section dividers / labels**

`.rpt-section-hdr` is already done. Look for any remaining `style="font-size:11px;letter-spacing:..."` label patterns and consolidate.

- [ ] **Step 4: Extract pattern — flex spacers**

Any `style="flex:1"` or `style="display:flex;flex:1"` one-liners → replace with class `.flex-fill{flex:1;}` and `class="flex-fill"`.

- [ ] **Step 5: Visual verify**

Open all tabs. Confirm no visual regression.

- [ ] **Step 6: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "refactor: extract repeated inline styles to CSS classes"
```

---

### Task 6: A11y — div→button

**Files:**
- Modify: `gritcore-app/www/index.html` — convert 8 div+onclick to button elements

- [ ] **Step 1: Find all div+onclick**

```bash
grep -n "<div[^>]*onclick" gritcore-app/www/index.html
```
Note all 8 lines.

- [ ] **Step 2: Convert each**

For each `<div ... onclick="fn()">`, change to:
```html
<button ... onclick="fn()" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;width:100%;">
```
Adjust `text-align` and `width` to match the original div's layout role.

- [ ] **Step 3: Add button reset class**

Add to `<style>` block (one-time):
```css
.btn-reset{background:none;border:none;cursor:pointer;padding:0;color:inherit;font:inherit;text-align:inherit;width:100%;}
```
Then replace the inline style with `class="btn-reset"` on each converted button.

- [ ] **Step 4: Visual verify**

Open app. Tap each converted element — confirm they still work. Check no layout shift.

- [ ] **Step 5: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "fix: convert 8 div+onclick to button elements (a11y)"
```

---

## Phase 2 — Polish + Motion

---

### Task 7: Staggered Card Entrance

**Files:**
- Modify: `gritcore-app/www/index.html` — add `@keyframes cardIn`, update `renderToday()` to assign animation-delay

- [ ] **Step 1: Add CSS keyframe**

In `<style>` block, add:
```css
@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.hcard{animation:cardIn 0.25s ease-out both;}
```

- [ ] **Step 2: Update renderToday() to assign delays**

Find `renderToday()` in `index.html`. In the section that builds each `.hcard` HTML string, add `animation-delay` inline:
```js
// Change the hcard opening tag in the template literal from:
`<div class="hcard" ...>`
// To:
`<div class="hcard" style="animation-delay:${i*40}ms" ...>`
```
Where `i` is the index of the habit in the loop.

- [ ] **Step 3: Prevent re-animation on re-render**

The animation runs on `renderToday()` call. This is correct — it fires on tab switch. No extra work needed since `sw()` calls `render()` which calls `renderToday()`.

- [ ] **Step 4: Visual verify**

Switch to Today tab several times. Cards should stagger in — not all at once. Feels smooth, not bouncy.

- [ ] **Step 5: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: staggered card entrance animation on tab switch (v0.26)"
```

---

### Task 8: Progress Bar Transition

**Files:**
- Modify: `gritcore-app/www/index.html` — add transition to progress bar CSS

- [ ] **Step 1: Find progress bar CSS**

```bash
grep -n "progress\|prog-bar\|prog-fill" gritcore-app/www/index.html | head -20
```
Note the class name used for the fill element.

- [ ] **Step 2: Add transition**

Find the CSS rule for the progress fill element. Add:
```css
transition: width 0.4s cubic-bezier(0.25,1,0.5,1);
```

- [ ] **Step 3: Visual verify**

Mark a discipline done. Progress bar should smoothly fill to the new percentage. Mark another — smooth fill again.

- [ ] **Step 4: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: smooth progress bar fill transition on mark (v0.26)"
```

---

### Task 9: Heat Veil Ambient Pulse

**Files:**
- Modify: `gritcore-app/www/index.html` — add `@keyframes heatPulse`, update `updateHeat()`

- [ ] **Step 1: Add pulse keyframe and class**

In `<style>` block:
```css
@keyframes heatPulse{0%,100%{opacity:var(--veil-base,0)}50%{opacity:calc(var(--veil-base,0) + 0.04)}}
#heat-veil.pulsing{animation:heatPulse 3s ease-in-out infinite;}
```

- [ ] **Step 2: Update updateHeat()**

Find `updateHeat(completed, total)`. After the line that sets `--heat`, add:
```js
const heatVal = total > 0 ? completed/total : 0;
const veil = document.getElementById('heat-veil');
if(veil){
  const baseOpacity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--heat-overlay-alpha')) || 0.08; // fallback ensures visible pulse
  document.documentElement.style.setProperty('--veil-base', baseOpacity);
  veil.classList.toggle('pulsing', heatVal >= 0.7);
}
```

- [ ] **Step 3: Visual verify**

Use `devAddTestData()`. Mark enough disciplines to get above 70% (heat > 0.7). The gold veil overlay should gently pulse. Below 70% — no pulse.

- [ ] **Step 4: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: ambient heat veil pulse at 70%+ completion (v0.26)"
```

---

## Phase 3 — Delight + Features

---

### Task 10: Perfect Day Moment

**Files:**
- Modify: `gritcore-app/www/index.html` — update `updateHeat()`, add confetti CSS + JS

- [ ] **Step 1: Add confetti CSS**

In `<style>` block:
```css
@keyframes confettiFall{0%{opacity:1;transform:translateY(-10px) rotate(0deg)}100%{opacity:0;transform:translateY(100vh) rotate(720deg)}}
.confetti-particle{position:fixed;top:0;width:6px;height:6px;border-radius:1px;pointer-events:none;z-index:999;animation:confettiFall 1.2s ease-in forwards;}
```

- [ ] **Step 2: Add confetti launch function**

After the closing `}` of `showToast()`, add:
```js
function launchConfetti(){
  const colors=['#c9a84c','rgba(255,255,255,0.85)','#e8d48b','rgba(201,168,76,0.6)'];
  for(let i=0;i<12;i++){
    const p=document.createElement('div');
    p.className='confetti-particle';
    p.style.left=(10+Math.random()*80)+'vw';
    p.style.background=colors[i%colors.length];
    p.style.animationDuration=(1+Math.random()*0.4)+'s';
    p.style.animationDelay=(Math.random()*0.3)+'s';
    document.body.appendChild(p);
    p.addEventListener('animationend',()=>p.remove());
  }
}
```

- [ ] **Step 3: Update updateHeat() for perfect day**

In `updateHeat(completed, total)`, add after the heat calculation:
```js
if(completed === total && total > 0){
  const today = getDate();
  const key = 'gc:perfectFired:'+today;
  if(!sessionStorage.getItem(key)){
    sessionStorage.setItem(key,'1');
    // Gold flash
    const veil = document.getElementById('heat-veil');
    if(veil){
      veil.style.transition='opacity 0.3s ease';
      veil.style.opacity='0.35';
      setTimeout(()=>{ veil.style.transition='opacity 0.9s ease'; veil.style.opacity=''; },300);
    }
    // Confetti
    launchConfetti();
    // Special motivation line (updateMotivation handles this via heat=1, but override for perfect day)
    const ml = document.getElementById('motivation-line');
    if(ml) ml.textContent = 'Perfect. Every discipline. Today you forged something real.';
  }
}
```

- [ ] **Step 4: Visual verify**

Use `devAddTestData()`. Mark ALL disciplines done. Gold flash + confetti should fire once. Refresh and mark all again — should NOT fire again (sessionStorage gate). Next day (or clear sessionStorage) — fires again.

- [ ] **Step 5: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: perfect day celebration moment — flash + confetti + special motivation (v0.26)"
```

---

### Task 11: Streak Milestone Toasts

**Files:**
- Modify: `gritcore-app/www/index.html` — update `markH()`

- [ ] **Step 1: Add milestone check in markH()**

Find `markH(id, status, btnEl, evt)`. After `logs[t][id]` is set AND after the `showToast(...)` call (which shows "Discipline marked"), add: — the `+1` is only valid after the log write has already happened.
```js
// Milestone check (only on 'done')
if(logs[t][id]==='done'){
  const streak = calcHabitStreak(id) + 1; // +1 for today's just-logged mark
  const milestones = [7,14,30,100];
  const messages = {7:'Seven days. The forge is lit.',14:'Two weeks. Discipline compounds.',30:'Thirty days. You\'re forged.',100:'One hundred. Unbreakable.'};
  const reached = JSON.parse(localStorage.getItem('gc1:milestones')||'{}');
  const habitReached = reached[id] || [];
  const hit = milestones.find(m => streak === m && !habitReached.includes(m));
  if(hit){
    habitReached.push(hit);
    reached[id] = habitReached;
    localStorage.setItem('gc1:milestones', JSON.stringify(reached));
    setTimeout(()=>showToast(messages[hit]), 2200); // After first toast clears
  }
}
```

- [ ] **Step 2: Visual verify**

Open dev console. Run:
```js
// Simulate hitting a milestone — set a habit's streak data to 6 done days
// Then mark done on the 7th — should fire "Seven days. The forge is lit."
```
Or manually set `gc1:logs` to have 6 consecutive done days for one habit, then mark it done today.

- [ ] **Step 3: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: streak milestone toasts at 7/14/30/100 days (v0.26)"
```

---

### Task 12: Tab Bar Labels

**Files:**
- Modify: `gritcore-app/www/index.html` — add `.bni-lbl` CSS, add label spans to nav HTML

- [ ] **Step 1: Add .bni-lbl CSS**

In `<style>` block, find `.bni` CSS. Add:
```css
.bni-lbl{display:block;font-size:8px;letter-spacing:1.2px;text-transform:uppercase;margin-top:2px;font-family:'Josefin Sans',sans-serif;}
```

- [ ] **Step 2: Add label spans to nav HTML**

Find the 4 `<button class="bni"...>` elements in the nav bar HTML. Add a label span inside each:
```html
<!-- Today tab -->
<button class="bni" onclick="sw('today',this)">
  <!-- existing icon svg -->
  <span class="bni-lbl">Today</span>
</button>

<!-- Record tab -->
<button class="bni" onclick="sw('record',this)">
  <!-- existing icon svg -->
  <span class="bni-lbl">Record</span>
</button>

<!-- Report tab -->
<button class="bni" onclick="sw('report',this)">
  <!-- existing icon svg -->
  <span class="bni-lbl">Report</span>
</button>

<!-- Forge tab -->
<button class="bni" onclick="sw('forge',this)">
  <!-- existing icon svg -->
  <span class="bni-lbl">Forge</span>
</button>
```

- [ ] **Step 3: Visual verify**

Tab bar should show tiny uppercase labels below each icon. Active tab label should be gold (inherits from `.bni.on` color). Inactive tabs — dimmed.

- [ ] **Step 4: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: tab bar labels — Today / Record / Report / Forge (v0.26)"
```

---

### Task 13: Settings Icon + Sheet

**Files:**
- Modify: `gritcore-app/www/index.html` — add settings button to header, add `#settings-sheet` HTML, add CSS, add JS

- [ ] **Step 1: Add settings button CSS**

In `<style>` block:
```css
#settings-btn{position:absolute;right:16px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--ctd);font-size:18px;cursor:pointer;padding:var(--sp-sm);line-height:1;z-index:10;}
#settings-btn:active{color:var(--gold);}
#settings-sheet{position:fixed;bottom:0;left:0;right:0;background:rgba(14,12,9,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(212,170,80,0.15);border-radius:20px 20px 0 0;padding:var(--sp-lg) var(--sp-md) calc(var(--sp-xl) + env(safe-area-inset-bottom,0px));z-index:200;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);}
#settings-sheet.open{transform:translateY(0);}
.settings-row{display:flex;align-items:center;justify-content:space-between;padding:var(--sp-sm) 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.settings-lbl{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--cts);font-family:'Josefin Sans',sans-serif;}
.settings-val{font-size:11px;color:var(--ctd);font-family:'Josefin Sans',sans-serif;}
.settings-title{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);font-family:'Josefin Sans',sans-serif;margin-bottom:var(--sp-md);}
.settings-version{font-size:11px;color:var(--ctdd);text-align:center;margin-top:var(--sp-lg);letter-spacing:1px;}
```

- [ ] **Step 2: Add settings button to header HTML**

Find `<div id="hdr"` in the HTML body. Inside it, add before the closing tag:
```html
<button id="settings-btn" onclick="toggleSettings()">⚙</button>
```

- [ ] **Step 3: Add settings sheet HTML**

After the `#heat-veil` div (or before the nav bar), add:
```html
<div id="settings-sheet">
  <div class="settings-title">Settings</div>
  <div class="settings-row">
    <span class="settings-lbl">Reminder Time</span>
    <input type="time" id="notif-time-input" class="settings-val"
      style="background:none;border:none;color:var(--ctd);font-family:'Josefin Sans',sans-serif;font-size:11px;"
      onchange="saveNotifTime(this.value)">
  </div>
  <div class="settings-row" style="margin-top:var(--sp-md);">
    <button class="btn-reset" style="color:#c0392b;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Josefin Sans',sans-serif;"
      onclick="if(confirm('Reset all data? This cannot be undone.'))devResetAll()">
      Reset All Data
    </button>
  </div>
  <div class="settings-version">GritCore v0.26</div>
</div>
<div id="settings-overlay" style="display:none;position:fixed;inset:0;z-index:199;" onclick="toggleSettings()"></div>
```

- [ ] **Step 4: Add settings JS functions**

After `devResetDate()`, add:
```js
function toggleSettings(){
  const s=document.getElementById('settings-sheet');
  const o=document.getElementById('settings-overlay');
  const open=s.classList.toggle('open');
  o.style.display=open?'block':'none';
  if(open){
    const saved=localStorage.getItem('gc1:notif-time')||'';
    const inp=document.getElementById('notif-time-input');
    if(inp)inp.value=saved;
  }
}
function saveNotifTime(val){
  localStorage.setItem('gc1:notif-time',val);
}
```

- [ ] **Step 5: Visual verify**

Tap ⚙ in header — settings sheet springs up from bottom. Shows reminder time input and reset button. Tap overlay or tap ⚙ again — sheet closes. Change time — persists across reload (`localStorage.getItem('gc1:notif-time')`).

- [ ] **Step 6: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: settings icon + bottom sheet with reminder time (v0.26)"
```

---

### Task 14: Discipline Reorder (Hold + Drag)

**Files:**
- Modify: `gritcore-app/www/index.html` — update `effH()`, add drag CSS, add drag JS, update `renderToday()` to attach drag handlers

- [ ] **Step 1: Update effH() with order support**

Find `effH()`. Replace its body:
```js
function effH(){
  if(isPlaceholder) return placeholderHabits;
  let order = JSON.parse(localStorage.getItem('gc1:order')||'null');
  if(!order || order.length === 0){
    order = habits.map(h=>h.id);
    localStorage.setItem('gc1:order', JSON.stringify(order));
  }
  const map = Object.fromEntries(habits.map(h=>[h.id,h]));
  const ordered = order.filter(id=>map[id]).map(id=>map[id]);
  const newOnes = habits.filter(h=>!order.includes(h.id));
  return [...ordered, ...newOnes];
}
```

- [ ] **Step 2: Add drag CSS**

In `<style>` block:
```css
.hcard.dragging{transform:scale(1.02);box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(201,168,76,0.3);z-index:50;position:relative;transition:none;}
.hcard.drag-over{opacity:0.5;}
```

- [ ] **Step 3: Add drag JS**

After `launchConfetti()`, add the full drag-reorder implementation:
```js
let dragState = null;

function initDrag(card, habitId){
  let longPressTimer = null;
  let startY = 0;

  card.addEventListener('pointerdown', e=>{
    // Don't activate if tapping the mark buttons
    if(e.target.closest('.hbtn')) return;
    startY = e.clientY;
    longPressTimer = setTimeout(()=>{
      dragState = {activeId: habitId, activeCard: card, startY: e.clientY};
      card.classList.add('dragging');
      card.setPointerCapture(e.pointerId);
    }, 500);
  });

  card.addEventListener('pointermove', e=>{
    if(!dragState || dragState.activeId !== habitId) return;
    const dy = e.clientY - dragState.startY;
    card.style.transform = `scale(1.02) translateY(${dy}px)`;

    // Find card under pointer
    const cards = [...document.querySelectorAll('.hcard:not(.dragging)')];
    cards.forEach(c=>c.classList.remove('drag-over'));
    const target = cards.find(c=>{
      const r = c.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if(target) target.classList.add('drag-over');
    dragState.overCard = target || null;
  });

  card.addEventListener('pointerup', ()=>{
    clearTimeout(longPressTimer);
    if(!dragState || dragState.activeId !== habitId) return;

    if(dragState.overCard){
      // Get current order
      const order = effH().map(h=>h.id);
      const fromIdx = order.indexOf(habitId);
      const toId = dragState.overCard.dataset.habitId;
      const toIdx = order.indexOf(toId);
      if(fromIdx !== -1 && toIdx !== -1){
        order.splice(fromIdx,1);
        order.splice(toIdx,0,habitId);
        localStorage.setItem('gc1:order', JSON.stringify(order));
      }
    }
    // Clean up
    document.querySelectorAll('.hcard').forEach(c=>{
      c.classList.remove('dragging','drag-over');
      c.style.transform='';
    });
    dragState = null;
    render();
  });

  card.addEventListener('pointercancel', ()=>{
    clearTimeout(longPressTimer);
    if(dragState && dragState.activeId===habitId){
      card.classList.remove('dragging');
      card.style.transform='';
      dragState=null;
    }
  });
}
```

- [ ] **Step 4: Attach drag handlers in renderToday()**

In `renderToday()`, after inserting the cards HTML into the DOM, add:
```js
// Attach drag handlers to each card
effH().forEach(h=>{
  const card = document.querySelector(`.hcard[data-habit-id="${h.id}"]`);
  if(card) initDrag(card, h.id);
});
```

Also ensure each `.hcard` in the HTML template has `data-habit-id="${h.id}"` attribute.

- [ ] **Step 5: Visual verify**

Open Today tab with multiple disciplines. Long-press a card (hold 0.5s) — card should lift (scale up, gold border). Drag up/down — other cards dim as you pass over. Release — card drops to new position. Order persists after reload.

Edge: Quickly tapping (< 500ms) should NOT trigger drag — just normal tap.

- [ ] **Step 6: Commit**

```bash
git add gritcore-app/www/index.html
git commit -m "feat: discipline reorder via long-press drag on Today tab (v0.26)"
```

---

## Post-Implementation

- [ ] **Create v0.26 backups (if not done in pre-flight):**
```bash
cp gritcore-app/www/index.html gritcore-app/www/index.0.26.html
cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.26.css
```

- [ ] **Update CLAUDE.md** — add new CSS classes, new localStorage keys, new functions (`toggleSettings`, `saveNotifTime`, `launchConfetti`, `initDrag`), update version to 0.27.

- [ ] **Final commit:**
```bash
git add gritcore-app/www/index.0.26.html gritcore-app/www/gritcore.0.26.css CLAUDE.md
git commit -m "chore: v0.26 complete — backups + CLAUDE.md update"
```
