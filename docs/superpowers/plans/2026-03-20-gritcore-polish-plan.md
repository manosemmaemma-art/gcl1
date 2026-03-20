# GritCore Polish Plan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform GritCore from v0.16 into a self-contained, polished, ship-ready app (v0.17–v0.23) with no external dependencies, upgraded features, and a full dev console for testing.

**Architecture:** Single `index.html` + `gritcore.css` — no build step, no framework. Each task is one version bump; backup files before every task, test in browser between tasks. All data in localStorage.

**Tech Stack:** Vanilla JS, HTML5, CSS3, Capacitor 6 (native layer untouched), Google Fonts (Cormorant Garamond + Josefin Sans)

**Dev server:** `node serve.js` in `gritcore-app/` — serves `www/` at `http://localhost:3000` (or similar)

**Spec:** `docs/superpowers/specs/2026-03-20-gritcore-polish-plan-design.md`

---

## How to verify (no build step)

There is no test runner. Each task ends with a **browser verification checklist**. Open `index.html` via the dev server and check each item. Do not proceed to the next task until every item passes.

---

## File Map

| File | Role |
|------|------|
| `gritcore-app/www/index.html` | Entire app — HTML, CSS (inline), JS. All tasks modify this. |
| `gritcore-app/www/gritcore.css` | External styles — layout, cards, animations. Some tasks modify this. |
| `gritcore-app/www/paywall.js` | Remove import only (Step 1). File stays on disk. |
| `gritcore-app/www/config.js` | Remove import only (Step 1). File stays on disk. |

**Backup convention:** Before each task, copy `index.html` → `index.0.NN.html` and `gritcore.css` → `gritcore.0.NN.css` where NN is the previous version number.

---

## Task 1 — Strip External Dependencies (v0.17)

**Files:**
- Modify: `gritcore-app/www/index.html`

- [ ] **Step 1: Write the verification checklist (before touching code)**

  Expected behavior after this task:
  ```
  [ ] App loads with no console errors
  [ ] Onboarding shows on first load (no trial gate, no paywall screen)
  [ ] All 4 tabs (Today/Record/Report/Forge) are accessible
  [ ] No "paywall", "config", "RevenueCat" references in active code paths
  [ ] Closing and reopening the app goes straight to Today tab
  ```

- [ ] **Step 2: Backup current files**

  ```bash
  cp gritcore-app/www/index.html gritcore-app/www/index.0.16.html
  cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.16.css
  ```

- [ ] **Step 3: Remove script imports**

  In `index.html`, find and remove these `<script>` tags (in the `<head>` or bottom of `<body>`):
  ```html
  <!-- REMOVE these lines: -->
  <script src="config.js"></script>
  <script src="paywall.js"></script>
  <script src="marble-interpolator.js"></script>
  ```

- [ ] **Step 4: Simplify the startup flow**

  Find `showOnboarding()` and `beginApp()`. The startup should call `beginApp()` directly without any trial/paywall gate. Look for any block like:

  ```js
  // REMOVE any code resembling:
  if (gc:purchased || withinTrial) { beginApp(); } else { showPaywall(); }
  ```

  Replace with simply:
  ```js
  beginApp();
  ```

  Also remove any localStorage reads for `gc:purchased` and `gc:trial_start` in the load/init path.

- [ ] **Step 5: Remove RevenueCat calls from JS**

  Search `index.html` for any of these and delete the containing blocks:
  - `Purchases.`
  - `RevenueCat`
  - `paywall`
  - `gc:purchased`
  - `gc:trial_start`

- [ ] **Step 6: Verify in browser**

  Start the dev server and open the app. Check every item in the Step 1 checklist. Open browser DevTools console — zero errors.

- [ ] **Step 7: Commit**

  ```bash
  git add gritcore-app/www/index.html
  git commit -m "feat: strip paywall/RevenueCat dependencies (v0.17) — deferred to future phase"
  ```

---

## Task 2 — Dev Console (v0.18)

**Files:**
- Modify: `gritcore-app/www/index.html`
- Modify: `gritcore-app/www/gritcore.css`

- [ ] **Step 1: Write the verification checklist**

  ```
  [ ] Small ⚙ icon visible bottom-right above nav bar on ALL tabs
  [ ] Tapping icon opens bottom drawer smoothly (slides up)
  [ ] Drawer does not cover the nav bar
  [ ] Drawer closes when tapping outside it
  [ ] +1 Day advances the simulated date and re-renders Today
  [ ] -1 Day rewinds the simulated date and re-renders Today
  [ ] All Done marks all today's disciplines as done, re-renders
  [ ] All Failed marks all today's disciplines as failed, re-renders
  [ ] Set Streak… prompts for a number, writes log data, streak updates
  [ ] Add Test Data populates disciplines + 30 days of varied logs
  [ ] Onboarding resets flag and reloads to show onboarding
  [ ] Reset All shows confirm dialog, clears localStorage, reloads
  [ ] No layout shift on any tab when drawer is closed
  ```

- [ ] **Step 2: Backup**

  ```bash
  cp gritcore-app/www/index.html gritcore-app/www/index.0.17.html
  cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.17.css
  ```

- [ ] **Step 3: Add dev console HTML**

  Add this HTML block just before the closing `</body>` tag (after the `<nav>` element):

  ```html
  <!-- Dev Console -->
  <button class="dev-console-btn" id="dev-console-btn" onclick="toggleDevConsole()">⚙</button>
  <div class="sheet-backdrop dev-console-backdrop" id="dev-console-backdrop" onclick="closeDevConsole()"></div>
  <div class="dev-console-drawer" id="dev-console-drawer">
    <div class="sheet-handle"></div>
    <div class="dev-console-title">Dev Console</div>
    <div class="dev-console-grid">
      <button class="dev-btn" onclick="devDayPlus()">+1 Day</button>
      <button class="dev-btn" onclick="devDayMinus()">−1 Day</button>
      <button class="dev-btn" onclick="devAllDone()">All Done ✓</button>
      <button class="dev-btn" onclick="devAllFailed()">All Failed ✗</button>
      <button class="dev-btn" onclick="devSetStreak()">Set Streak…</button>
      <button class="dev-btn" onclick="devAddTestData()">Add Test Data</button>
      <button class="dev-btn" onclick="devTriggerOnboarding()">Onboarding</button>
      <button class="dev-btn dev-btn-danger" onclick="devResetAll()">Reset All</button>
    </div>
  </div>
  ```

- [ ] **Step 4: Add dev console CSS to `gritcore.css`**

  Append to the end of `gritcore.css`:

  ```css
  /* ── Dev Console ── */
  .dev-console-btn {
    position: fixed;
    bottom: calc(64px + env(safe-area-inset-bottom) + 8px);
    right: 10px;
    width: 26px; height: 26px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    color: rgba(255,255,255,0.3);
    font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    z-index: 998;
    padding: 0;
    transition: opacity .2s;
  }
  .dev-console-btn:active { opacity: .5; }

  .dev-console-backdrop {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    z-index: 999;
  }
  .dev-console-backdrop.open { display: block; }

  .dev-console-drawer {
    position: fixed;
    bottom: 0; left: 50%; transform: translateX(-50%) translateY(100%);
    width: min(420px, 100vw);
    background: #111;
    border-top: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px 16px 0 0;
    padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
    z-index: 1000;
    transition: transform .3s cubic-bezier(0.4,0,0.2,1);
  }
  .dev-console-drawer.open { transform: translateX(-50%) translateY(0); }

  .dev-console-title {
    font-size: 8px; letter-spacing: 3px; text-transform: uppercase;
    color: #c9a84c; margin-bottom: 12px; text-align: center;
  }
  .dev-console-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  }
  .dev-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 9px 8px;
    font-size: 10px; letter-spacing: .8px;
    color: #bbb; cursor: pointer;
    font-family: 'Josefin Sans', sans-serif;
    transition: background .15s;
  }
  .dev-btn:active { background: rgba(255,255,255,0.1); }
  .dev-btn-danger { border-color: rgba(220,60,60,0.3); color: rgba(220,100,100,0.7); }
  ```

- [ ] **Step 5: Add dev console JS functions**

  Add the following JavaScript block inside the `<script>` tag in `index.html`, after the existing dev functions (`devNextStreakDay`, `devPrevStreakDay`):

  ```js
  /* ── Dev Console ── */
  let devConsoleOpen = false;

  function toggleDevConsole() {
    devConsoleOpen ? closeDevConsole() : openDevConsole();
  }
  function openDevConsole() {
    devConsoleOpen = true;
    document.getElementById('dev-console-drawer').classList.add('open');
    document.getElementById('dev-console-backdrop').classList.add('open');
  }
  function closeDevConsole() {
    devConsoleOpen = false;
    document.getElementById('dev-console-drawer').classList.remove('open');
    document.getElementById('dev-console-backdrop').classList.remove('open');
  }
  function devDayPlus() {
    const cur = getDate();
    const d = new Date(cur + 'T12:00'); d.setDate(d.getDate() + 1);
    localStorage.setItem('gc:sim_date', d.toISOString().split('T')[0]);
    closeDevConsole(); render(); updateHeader();
  }
  function devDayMinus() {
    const cur = getDate();
    const d = new Date(cur + 'T12:00'); d.setDate(d.getDate() - 1);
    localStorage.setItem('gc:sim_date', d.toISOString().split('T')[0]);
    closeDevConsole(); render(); updateHeader();
  }
  function devAllDone() {
    const today = getDate(); const hh = effH();
    if (!logs[today]) logs[today] = {};
    hh.forEach(h => { logs[today][h.id] = 'done'; });
    saveL(); closeDevConsole(); render();
  }
  function devAllFailed() {
    const today = getDate(); const hh = effH();
    if (!logs[today]) logs[today] = {};
    hh.forEach(h => { logs[today][h.id] = 'failed'; });
    saveL(); closeDevConsole(); render();
  }
  function devSetStreak() {
    const n = parseInt(prompt('Set streak to how many days?'), 10);
    if (isNaN(n) || n < 1) return;
    const hh = effH(); if (!hh.length) { showToast('Add disciplines first'); return; }
    for (let i = 1; i <= n; i++) {
      const d = daysBack(i, getDate());
      if (!logs[d]) logs[d] = {};
      hh.forEach(h => { logs[d][h.id] = 'done'; });
    }
    saveL(); closeDevConsole(); render();
  }
  function devAddTestData() {
    const testCats = ['Body','Mind','Craft','Ritual'];
    const testHabits = [
      {id:'t1',name:'Cold Shower',cat:'Body',created:daysBack(30,getDate())},
      {id:'t2',name:'Meditation',cat:'Mind',created:daysBack(30,getDate())},
      {id:'t3',name:'Deep Work',cat:'Craft',created:daysBack(30,getDate())},
      {id:'t4',name:'Evening Reflection',cat:'Ritual',created:daysBack(30,getDate())},
      {id:'t5',name:'Exercise',cat:'Body',created:daysBack(20,getDate())},
    ];
    habits = testHabits; isPlaceholder = false;
    const testLogs = {};
    for (let i = 1; i <= 30; i++) {
      const d = daysBack(i, getDate());
      testLogs[d] = {};
      testHabits.forEach(h => {
        testLogs[d][h.id] = Math.random() > 0.25 ? 'done' : 'failed';
      });
    }
    logs = testLogs;
    saveH(); saveL(); closeDevConsole(); render();
    showToast('Test data added');
  }
  function devTriggerOnboarding() {
    localStorage.removeItem('gc:onboarded');
    closeDevConsole();
    location.reload();
  }
  function devResetAll() {
    if (!confirm('Reset ALL data? This cannot be undone.')) return;
    localStorage.clear();
    location.reload();
  }
  ```

- [ ] **Step 6: Remove old dev buttons from header HTML**

  Find and remove the existing `devNextStreakDay` and `devPrevStreakDay` button elements in the header HTML (the `+1` / `-1` buttons next to the logo). They are now in the dev console.

  ```html
  <!-- REMOVE these two buttons: -->
  <button id="dev-streak-btn-minus" onclick="devPrevStreakDay()">-1</button>
  <button id="dev-streak-btn" onclick="devNextStreakDay()">+1</button>
  ```

- [ ] **Step 7: Verify in browser**

  Check every item in the Step 1 checklist. Pay special attention to:
  - Drawer doesn't clip behind nav
  - Set Streak: enter `5`, check streak badge shows 5
  - Add Test Data: switch to Record tab to confirm log data appears

- [ ] **Step 8: Commit**

  ```bash
  git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
  git commit -m "feat: add dev console bottom drawer (v0.18)"
  ```

---

## Task 3 — Heatmap Upgrade (v0.19)

**Files:**
- Modify: `gritcore-app/www/index.html` (`renderRecord()` function + `last365()` helper)
- Modify: `gritcore-app/www/gritcore.css` (heatmap styles)

- [ ] **Step 1: Write the verification checklist**

  ```
  [ ] Record tab shows a 7-row × 52-col heatmap grid
  [ ] Empty cells are near-invisible (dark)
  [ ] Cells with data are amber — 4 brightness levels by completion %
  [ ] 100% days glow gold
  [ ] Month labels visible along the top
  [ ] Day labels (M/W/F) on the left
  [ ] Grid scrolls horizontally
  [ ] Current week is visible at the right edge on load (no manual scrolling needed)
  [ ] Tapping a cell shows a tooltip: date + completion %
  [ ] Tooltip doesn't clip outside the screen edges
  [ ] Score cards (today %, 7-day %) still appear above the heatmap
  [ ] Use "Add Test Data" in dev console to verify colors render correctly
  ```

- [ ] **Step 2: Backup**

  ```bash
  cp gritcore-app/www/index.html gritcore-app/www/index.0.18.html
  cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.18.css
  ```

- [ ] **Step 3: Add `last365()` helper**

  In `index.html`, find `function last30()` and add this right after it:

  ```js
  function last365() {
    const a = [];
    for (let i = 364; i >= 0; i--) a.push(daysBack(i, getDate()));
    return a;
  }
  ```

- [ ] **Step 4: Replace `renderRecord()` with heatmap version**

  Find and replace the entire `renderRecord()` function with:

  ```js
  function renderRecord() {
    const hh = effH(), ll = effL();
    const days = last365();
    // Build week columns: pad start so day 0 = Monday
    const firstDate = new Date(days[0] + 'T12:00');
    const startPad = (firstDate.getDay() + 6) % 7; // 0=Mon
    const cells = Array(startPad).fill(null).concat(days);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    // Month labels
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let monthLabels = '';
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const m = new Date(firstDay + 'T12:00').getMonth();
        if (m !== lastMonth) { monthLabels += `<div style="grid-column:${wi+2}">${monthNames[m]}</div>`; lastMonth = m; }
        else monthLabels += `<div></div>`;
      } else monthLabels += `<div></div>`;
    });

    // Cells
    let cellsHtml = '';
    const dayLabels = ['M','','W','','F','',''];
    for (let row = 0; row < 7; row++) {
      cellsHtml += `<div class="hm-day-lbl">${dayLabels[row]}</div>`;
      weeks.forEach((week) => {
        const d = week[row];
        if (!d) { cellsHtml += `<div class="hm-cell hm-empty"></div>`; return; }
        const pct = dayPct(d, hh, ll);
        const cls = pct === null ? 'hm-empty' : pct === 100 ? 'hm-full' : pct >= 80 ? 'hm-hi' : pct >= 50 ? 'hm-mid' : 'hm-lo';
        const isToday = d === getDate();
        cellsHtml += `<div class="hm-cell ${cls}${isToday?' hm-today':''}" data-date="${d}" data-pct="${pct??''}" onclick="hmTap(this)"></div>`;
      });
    }

    // Score cards (reuse existing renderScores output)
    const scores = renderScores();

    document.getElementById('content').innerHTML = `
      ${scores}
      <div class="shdr af s1"><span class="shdr-l">52-Week Record</span></div>
      <div class="card af s2" style="padding:14px 10px 10px;overflow:hidden;">
        <div class="hm-wrap" id="hm-wrap">
          <div class="hm-grid" style="grid-template-columns:18px repeat(${weeks.length},1fr);">
            <div></div>${monthLabels}
            ${cellsHtml}
          </div>
        </div>
        <div class="hm-tooltip" id="hm-tooltip"></div>
      </div>
    `;
    // Scroll to current week (right edge)
    requestAnimationFrame(() => {
      const wrap = document.getElementById('hm-wrap');
      if (wrap) wrap.scrollLeft = wrap.scrollWidth;
    });
  }

  function hmTap(cell) {
    const d = cell.dataset.date;
    const pct = cell.dataset.pct;
    const tip = document.getElementById('hm-tooltip');
    if (!tip) return;
    tip.textContent = pct !== '' ? `${d} — ${pct}%` : `${d} — no data`;
    tip.classList.add('show');
    clearTimeout(tip._t);
    tip._t = setTimeout(() => tip.classList.remove('show'), 2000);
  }
  ```

- [ ] **Step 5: Add heatmap CSS to `gritcore.css`**

  Append to the end of `gritcore.css`:

  ```css
  /* ── Heatmap ── */
  .hm-wrap {
    overflow-x: auto; overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .hm-wrap::-webkit-scrollbar { display: none; }
  .hm-grid {
    display: grid;
    grid-template-rows: 14px repeat(7, 10px);
    gap: 2px;
    min-width: max-content;
    padding-bottom: 4px;
  }
  .hm-day-lbl {
    font-size: 7px; letter-spacing: 1px;
    color: rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: flex-end;
    padding-right: 4px; line-height: 1;
  }
  .hm-cell {
    width: 10px; height: 10px;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity .15s;
  }
  .hm-cell:active { opacity: .6; }
  .hm-empty  { background: rgba(255,255,255,0.04); }
  .hm-lo     { background: rgba(201,168,76,0.25); }
  .hm-mid    { background: rgba(201,168,76,0.55); }
  .hm-hi     { background: rgba(201,168,76,0.85); }
  .hm-full   { background: #c9a84c; box-shadow: 0 0 4px rgba(201,168,76,0.6); }
  .hm-today  { outline: 1px solid rgba(255,255,255,0.4); outline-offset: 1px; }
  .hm-tooltip {
    font-size: 9px; letter-spacing: .8px;
    color: #c9a84c; text-align: center;
    padding: 6px 0 0;
    opacity: 0; transition: opacity .2s;
    pointer-events: none;
  }
  .hm-tooltip.show { opacity: 1; }
  /* Month labels row */
  .hm-grid > div:not(.hm-cell):not(.hm-day-lbl) {
    font-size: 7px; letter-spacing: .8px;
    color: rgba(255,255,255,0.25);
    white-space: nowrap; overflow: hidden;
    display: flex; align-items: center;
  }
  ```

- [ ] **Step 6: Verify in browser**

  Use "Add Test Data" from the dev console first, then switch to Record tab. Check all items in the Step 1 checklist.

- [ ] **Step 7: Commit**

  ```bash
  git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
  git commit -m "feat: replace 30-day grid with 52-week heatmap on Record tab (v0.19)"
  ```

---

## Task 4 — Report Redesign (v0.20)

**Files:**
- Modify: `gritcore-app/www/index.html` (`renderReport()` function, remove BPM code)
- Modify: `gritcore-app/www/gritcore.css` (report layout styles)

- [ ] **Step 1: Write the verification checklist**

  ```
  [ ] Report tab shows two side-by-side stat cards at top
  [ ] Left card: current streak number (large), tier name, progress bar, "X days to next tier"
  [ ] Right card: total completions (large), perfect days count, best discipline name
  [ ] Category bars below — one per category, shows name + bar + percentage
  [ ] Category percentages are accurate (verify with "All Done" dev tool for a few days)
  [ ] Only categories with disciplines assigned appear in bars
  [ ] Icon row at bottom: Profile · Settings · Export · About — all 4 visible
  [ ] Export opens file download (existing exportData() behavior)
  [ ] Settings opens a sheet with: Reset today's log, Clear all data, App version
  [ ] About shows version number and "Forge your discipline." tagline
  [ ] Profile shows "Coming soon"
  [ ] No focus timer code or UI anywhere
  [ ] No console errors
  ```

- [ ] **Step 2: Backup**

  ```bash
  cp gritcore-app/www/index.html gritcore-app/www/index.0.19.html
  cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.19.css
  ```

- [ ] **Step 3: Remove BPM timer code**

  In `index.html`, delete:
  - `let bpmTimer=null,bpmTotal=0,bpmLeft=0,bpmMins=25,bpmRunning=false;` (variable declarations)
  - The entire `startBpm()` function
  - The entire `renderBpm()` function (if separate)
  - Any BPM-related HTML in the existing `renderReport()` output

- [ ] **Step 4: Replace `renderReport()` function**

  Find and replace the entire `renderReport()` function:

  ```js
  function renderReport() {
    const hh = effH(), ll = effL();
    const streak = calcStreak();
    const tier = getTier(streak);
    const nextTier = TIERS.find(t => t.min > streak);
    const daysToNext = nextTier ? nextTier.min - streak : 0;
    const tierPct = nextTier ? Math.round(((streak - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

    // Lifetime stats
    let totalDone = 0, perfectDays = 0;
    const bestCount = {};
    Object.entries(ll).forEach(([date, dayLog]) => {
      let dayDone = 0;
      hh.forEach(h => {
        if (dayLog[h.id] === 'done') { totalDone++; dayDone++; bestCount[h.id] = (bestCount[h.id]||0)+1; }
      });
      if (hh.length && dayDone === hh.length) perfectDays++;
    });
    const bestId = Object.entries(bestCount).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const bestName = hh.find(h=>h.id===bestId)?.name || '—';

    // Category bars
    const catData = catStats();
    const catBars = catData.length ? catData.map(c =>
      `<div class="rpt-cat-row">
        <span class="rpt-cat-name">${c.cat}</span>
        <div class="rpt-cat-bar-wrap"><div class="rpt-cat-bar" style="width:${c.pct}%"></div></div>
        <span class="rpt-cat-pct">${c.pct}%</span>
      </div>`
    ).join('') : `<div class="rpt-empty">Log disciplines to see category stats</div>`;

    document.getElementById('content').innerHTML = `
      <div class="shdr af s1"><span class="shdr-l">Report</span></div>

      <div class="rpt-stats-row af s2">
        <div class="card rpt-stat-card">
          <div class="rpt-stat-label">Next Tier</div>
          <div class="rpt-stat-num" style="color:${tier.color}">${streak}</div>
          <div class="rpt-stat-sub">${tier.name}</div>
          <div class="rpt-pbar-wrap"><div class="rpt-pbar-fill" style="width:${tierPct}%;background:${tier.color}"></div></div>
          <div class="rpt-stat-hint">${nextTier ? `${daysToNext} day${daysToNext!==1?'s':''} to ${nextTier.name}` : 'Max tier reached'}</div>
        </div>
        <div class="card rpt-stat-card">
          <div class="rpt-stat-label">All Time</div>
          <div class="rpt-stat-num">${totalDone}</div>
          <div class="rpt-stat-sub">${perfectDays} perfect day${perfectDays!==1?'s':''}</div>
          <div class="rpt-stat-hint" style="margin-top:auto">Best: ${bestName}</div>
        </div>
      </div>

      <div class="card af s3" style="padding:14px;">
        <div class="shdr-l" style="font-size:7px;letter-spacing:2.5px;margin-bottom:12px;">By Category</div>
        ${catBars}
      </div>

      <div class="rpt-icon-row af s4">
        <button class="rpt-icon-btn" onclick="rptSheet('profile')">
          <span class="rpt-icon">👤</span><span class="rpt-icon-lbl">Profile</span>
        </button>
        <button class="rpt-icon-btn" onclick="rptSheet('settings')">
          <span class="rpt-icon">⚙️</span><span class="rpt-icon-lbl">Settings</span>
        </button>
        <button class="rpt-icon-btn" onclick="exportData()">
          <span class="rpt-icon">📤</span><span class="rpt-icon-lbl">Export</span>
        </button>
        <button class="rpt-icon-btn" onclick="rptSheet('about')">
          <span class="rpt-icon">◆</span><span class="rpt-icon-lbl">About</span>
        </button>
      </div>

      <div id="rpt-sheet-backdrop" class="sheet-backdrop" onclick="closeRptSheet()" style="display:none"></div>
      <div class="fab-sheet" id="rpt-sheet" style="padding-bottom:env(safe-area-inset-bottom)">
        <div class="sheet-handle"></div>
        <div id="rpt-sheet-content"></div>
      </div>
    `;
  }

  function rptSheet(type) {
    const el = document.getElementById('rpt-sheet');
    const content = document.getElementById('rpt-sheet-content');
    const backdrop = document.getElementById('rpt-sheet-backdrop');
    const sheets = {
      profile: `<div class="sheet-header"><span class="sheet-title">Profile</span></div><div style="padding:20px;text-align:center;color:var(--ctd);font-size:11px;letter-spacing:1px;">Coming soon</div>`,
      settings: `<div class="sheet-header"><span class="sheet-title">Settings</span></div>
        <div style="padding:0 16px 16px;display:flex;flex-direction:column;gap:8px;">
          <button class="dev-btn" onclick="if(confirm('Reset today\\'s log?')){const t=getDate();delete logs[t];saveL();closeRptSheet();render();}">Reset Today's Log</button>
          <button class="dev-btn dev-btn-danger" onclick="if(confirm('Clear all data?')){localStorage.clear();location.reload();}">Clear All Data</button>
          <div style="font-size:8px;letter-spacing:1.5px;color:var(--ctdd);text-align:center;padding-top:8px;">GritCore v0.20</div>
        </div>`,
      about: `<div class="sheet-header"><span class="sheet-title">About</span></div>
        <div style="padding:20px;text-align:center;">
          <div style="font-size:18px;letter-spacing:2px;color:var(--cthi);font-family:'Cormorant Garamond',serif;font-style:italic;margin-bottom:8px;">GritCore</div>
          <div style="font-size:9px;letter-spacing:2px;color:var(--ctd);">Forge your discipline.</div>
          <div style="font-size:8px;color:var(--ctdd);margin-top:16px;">Version 0.20</div>
        </div>`,
    };
    content.innerHTML = sheets[type] || '';
    backdrop.style.display = 'block';
    requestAnimationFrame(() => el.classList.add('open'));
  }
  function closeRptSheet() {
    const el = document.getElementById('rpt-sheet');
    const backdrop = document.getElementById('rpt-sheet-backdrop');
    el.classList.remove('open');
    backdrop.style.display = 'none';
  }
  ```

- [ ] **Step 5: Add Report CSS to `gritcore.css`**

  Append to `gritcore.css`:

  ```css
  /* ── Report Tab ── */
  .rpt-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .rpt-stat-card { padding: 14px 12px; display: flex; flex-direction: column; }
  .rpt-stat-label { font-size: 7px; letter-spacing: 2px; text-transform: uppercase; color: var(--ctdd); margin-bottom: 8px; }
  .rpt-stat-num { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 30px; line-height: 1; color: var(--cthi); }
  .rpt-stat-sub { font-size: 9px; color: var(--ctd); margin-top: 3px; }
  .rpt-stat-hint { font-size: 8px; letter-spacing: .8px; color: var(--ctdd); margin-top: 6px; }
  .rpt-pbar-wrap { height: 2px; background: rgba(255,255,255,.06); border-radius: 2px; margin: 10px 0 4px; }
  .rpt-pbar-fill { height: 100%; border-radius: 2px; transition: width .6s ease; }
  .rpt-cat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .rpt-cat-name { font-size: 9px; letter-spacing: 1px; color: var(--ctd); width: 44px; flex-shrink: 0; text-transform: uppercase; }
  .rpt-cat-bar-wrap { flex: 1; height: 3px; background: rgba(255,255,255,.06); border-radius: 2px; }
  .rpt-cat-bar { height: 100%; border-radius: 2px; background: linear-gradient(90deg, rgba(201,168,76,.5), #c9a84c); transition: width .6s ease; }
  .rpt-cat-pct { font-size: 9px; color: var(--ctdd); width: 26px; text-align: right; }
  .rpt-empty { font-size: 9px; color: var(--ctdd); text-align: center; padding: 8px 0; }
  .rpt-icon-row { display: flex; justify-content: space-around; padding: 14px 8px; background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.055); border-radius: 16px; }
  .rpt-icon-btn { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; padding: 4px 8px; opacity: .7; transition: opacity .2s; }
  .rpt-icon-btn:active { opacity: 1; }
  .rpt-icon { font-size: 20px; line-height: 1; }
  .rpt-icon-lbl { font-size: 7px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ctd); font-family: 'Josefin Sans', sans-serif; }
  ```

- [ ] **Step 6: Verify in browser**

  Check all items in the Step 1 checklist. Use the dev console to add test data for meaningful stats.

- [ ] **Step 7: Commit**

  ```bash
  git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
  git commit -m "feat: redesign Report tab — stats cards, category bars, icon row (v0.20)"
  ```

---

## Task 5 — Custom Categories (v0.21)

**Files:**
- Modify: `gritcore-app/www/index.html` (`renderForge()`, `load()`, new cat functions)

- [ ] **Step 1: Write the verification checklist**

  ```
  [ ] Forge tab shows "Categories" section above the discipline list
  [ ] Default categories Body/Mind/Craft/Ritual are pre-loaded on first run
  [ ] Each category shows as a pill with edit ✏ and delete × buttons
  [ ] Tapping ✏ lets user rename inline
  [ ] Tapping + (when < 8 categories) opens an inline input to add a new category
  [ ] + button is visually disabled/greyed at 8 categories
  [ ] Delete × is hidden when only 1 category remains
  [ ] Delete × is disabled (with tooltip) if any discipline uses that category
  [ ] Discipline "Forge New" selector uses the user's custom category list
  [ ] After add/rename/delete: category selector updates immediately
  [ ] Report category bars reflect custom categories
  [ ] gc1:cats persists in localStorage after reload
  [ ] Migration: existing users see their disciplines' categories preserved
  ```

- [ ] **Step 2: Backup**

  ```bash
  cp gritcore-app/www/index.html gritcore-app/www/index.0.20.html
  ```

- [ ] **Step 3: Add `cats` state and storage**

  In `index.html`, find the line `let habits=[],logs={},...` and add `cats` to the state:

  ```js
  let habits=[], logs={}, cats=[], view='today', qi=0, selCat='';
  ```

  Find `async function load()` and add category loading + migration:

  ```js
  // Inside load(), after loading habits and logs:
  const catsRaw = await store.get('gc1:cats');
  if (catsRaw) {
    cats = JSON.parse(catsRaw.value);
  } else {
    // Migrate: seed defaults
    cats = [{id:'c1',name:'Body'},{id:'c2',name:'Mind'},{id:'c3',name:'Craft'},{id:'c4',name:'Ritual'}];
    await saveCats();
  }
  selCat = cats[0]?.id || '';
  ```

  Add save function after `saveL()`:

  ```js
  async function saveCats() {
    try { await store.set('gc1:cats', JSON.stringify(cats)); } catch {}
  }
  ```

- [ ] **Step 4: Add category management functions**

  Add these functions to `index.html`:

  ```js
  function getCatName(id) { return cats.find(c=>c.id===id)?.name || id; }
  function catHasHabits(id) { return habits.some(h=>h.cat===id); }

  function addCat() {
    if (cats.length >= 8) return;
    const name = prompt('Category name (max 20 chars):')?.trim().slice(0,20);
    if (!name) return;
    cats.push({id:'c'+Date.now(), name});
    saveCats(); renderForge();
  }
  function renameCat(id) {
    const cat = cats.find(c=>c.id===id); if (!cat) return;
    const name = prompt('Rename category:', cat.name)?.trim().slice(0,20);
    if (!name) return;
    cat.name = name;
    saveCats(); render(); // re-render current view (updates selector + report bars)
  }
  function deleteCat(id) {
    if (cats.length <= 1) return;
    if (catHasHabits(id)) { showToast('Remove disciplines first'); return; }
    cats = cats.filter(c=>c.id!==id);
    if (selCat === id) selCat = cats[0]?.id || '';
    saveCats(); render();
  }
  function selCatFn(id) {
    selCat = id;
    document.querySelectorAll('.catpill').forEach(p=>p.classList.toggle('sel', p.dataset.c===id));
  }
  ```

- [ ] **Step 5: Update `renderForge()` to include categories section**

  Find `renderForge()` and add the categories section at the top of the rendered HTML (before the discipline input):

  ```js
  // At the start of renderForge()'s HTML string:
  const catPills = cats.map(c => `
    <div class="cat-pill-mgr">
      <span class="cat-pill-name">${c.name}</span>
      <button class="cat-pill-edit" onclick="renameCat('${c.id}')">✏</button>
      <button class="cat-pill-del" onclick="deleteCat('${c.id}')"
        ${cats.length<=1?'disabled style="opacity:.2"':''}
        ${catHasHabits(c.id)?'disabled title="Remove disciplines first" style="opacity:.2"':''}>×</button>
    </div>`).join('');

  // HTML section to add before discipline input:
  `<div class="shdr af s1"><span class="shdr-l">Categories</span>
    <button class="sheet-done-btn" onclick="addCat()" ${cats.length>=8?'disabled style="opacity:.3"':''}>+ Add</button>
  </div>
  <div class="card af s2" style="padding:12px 14px;">
    <div class="cat-mgr-list">${catPills}</div>
    ${cats.length>=8?'<div class="rpt-empty">Maximum 8 categories</div>':''}
  </div>`
  ```

  Also update the category pill selector for the discipline input to use `cats` array:

  ```js
  // Replace hardcoded CATS.map with:
  cats.map(c => `<button class="catpill${selCat===c.id?' sel':''}" data-c="${c.id}" onclick="selCatFn('${c.id}')">${c.name}</button>`).join('')
  ```

  And update `addH()` to use `selCat` (already does — just confirm it passes the cat ID not the name):

  ```js
  // In addH(), ensure:
  habits.push({id:Date.now().toString(), name:v, cat:selCat, created:getDate()});
  ```

- [ ] **Step 6: Update `catStats()` to use `cats` array**

  Find `catStats()` and update it to read from `cats` instead of hardcoded `CATS`:

  ```js
  function catStats() {
    const hh = effH(), ll = effL();
    // Only include categories that have at least 1 discipline assigned
    return cats.filter(c => hh.some(h=>h.cat===c.id)).map(c => {
      let done=0, total=0;
      Object.values(ll).forEach(dayLog => {
        hh.filter(h=>h.cat===c.id).forEach(h => {
          if (dayLog[h.id]==='done'){done++;total++;}
          else if (dayLog[h.id]==='failed') total++;
        });
      });
      return { cat: c.name, pct: total>0 ? Math.round((done/total)*100) : 0 };
    });
  }
  ```

- [ ] **Step 7: Add category manager CSS to `gritcore.css`**

  Append to `gritcore.css`:

  ```css
  /* ── Category Manager (Forge tab) ── */
  .cat-mgr-list { display: flex; flex-direction: column; gap: 4px; }
  .cat-pill-mgr { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: rgba(255,255,255,.04); border-radius: 8px; }
  .cat-pill-name { flex: 1; font-size: 10px; letter-spacing: 1.2px; color: var(--cthi); }
  .cat-pill-edit, .cat-pill-del { background: none; border: none; color: var(--ctd); cursor: pointer; font-size: 12px; padding: 2px 4px; transition: color .15s; }
  .cat-pill-edit:active { color: var(--cthi); }
  .cat-pill-del:active { color: #f57a7a; }
  ```

- [ ] **Step 8: Verify in browser**

  Check all items in the Step 1 checklist. Test the migration path: clear `gc1:cats` from localStorage and reload to confirm defaults seed.

- [ ] **Step 9: Commit**

  ```bash
  git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
  git commit -m "feat: custom user categories — add/rename/delete, max 8, auto % in Report (v0.21)"
  ```

---

## Task 6 — Quote Card Upgrade (v0.22)

**Files:**
- Modify: `gritcore-app/www/index.html` (`QUOTES` array, quote rendering in `renderToday()`)
- Modify: `gritcore-app/www/gritcore.css`

- [ ] **Step 1: Write the verification checklist**

  ```
  [ ] Quote card on Today tab is visually premium — large italic text, Cormorant Garamond
  [ ] Author attribution is smaller, Josefin Sans caps, below the quote
  [ ] Card has a subtle left border accent in the heat color
  [ ] Same quote shows all day — doesn't change on re-render
  [ ] Next day shows a different quote (use dev console +1 Day to verify)
  [ ] Tapping the card briefly shows tomorrow's quote for 3 seconds then reverts
  [ ] Tap preview works without breaking the daily rotation on next full day
  [ ] At least 60 quotes in the pool (discipline/stoic themed)
  [ ] No "tap to cycle" button or icon visible
  ```

- [ ] **Step 2: Backup**

  ```bash
  cp gritcore-app/www/index.html gritcore-app/www/index.0.21.html
  cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.21.css
  ```

- [ ] **Step 3: Expand QUOTES array to 60+ entries**

  Find `const QUOTES=[` in `index.html` and replace the entire array with at least 60 entries. Sample structure (fill out the full list):

  ```js
  const QUOTES=[
    {t:"We are what we repeatedly do. Excellence, then, is not an act, but a habit.",a:"Aristotle"},
    {t:"Do not pray for an easy life; pray for the strength to endure a difficult one.",a:"Bruce Lee"},
    {t:"The impediment to action advances action. What stands in the way becomes the way.",a:"Marcus Aurelius"},
    {t:"Discipline equals freedom.",a:"Jocko Willink"},
    {t:"You must do the thing you think you cannot do.",a:"Eleanor Roosevelt"},
    {t:"Don't count the days, make the days count.",a:"Muhammad Ali"},
    {t:"Hard choices, easy life. Easy choices, hard life.",a:"Jerzy Gregorek"},
    {t:"Suffer the pain of discipline or suffer the pain of regret.",a:"Jim Rohn"},
    {t:"He who is brave is free.",a:"Seneca"},
    {t:"First say to yourself what you would be, then do what you have to do.",a:"Epictetus"},
    {t:"The man who moves a mountain begins by carrying away small stones.",a:"Confucius"},
    {t:"Waste no more time arguing about what a good man should be. Be one.",a:"Marcus Aurelius"},
    {t:"It is not because things are difficult that we do not dare; it is because we do not dare that things are difficult.",a:"Seneca"},
    {t:"You have power over your mind, not outside events. Realize this and you will find strength.",a:"Marcus Aurelius"},
    {t:"The successful warrior is the average man with laser-like focus.",a:"Bruce Lee"},
    {t:"Stay hard.",a:"David Goggins"},
    {t:"Comfort is the enemy of achievement.",a:"Farrah Gray"},
    {t:"Do what is hard. Do what is uncomfortable.",a:"Jocko Willink"},
    {t:"Strength does not come from physical capacity. It comes from an indomitable will.",a:"Mahatma Gandhi"},
    {t:"The only easy day was yesterday.",a:"Navy SEALs"},
    {t:"If you know the enemy and know yourself, you need not fear the result of a hundred battles.",a:"Sun Tzu"},
    {t:"Endure. Then endure some more.",a:"David Goggins"},
    {t:"Do not wait; the time will never be just right.",a:"Napoleon Hill"},
    {t:"Pain is temporary. Quitting lasts forever.",a:"Lance Armstrong"},
    {t:"The more we value things outside our control, the less control we have.",a:"Epictetus"},
    {t:"Be the hardest worker in the room.",a:"Dwayne Johnson"},
    {t:"A gem cannot be polished without friction, nor a man perfected without trials.",a:"Seneca"},
    {t:"Make the most of yourself, for that is all there is of you.",a:"Ralph Waldo Emerson"},
    {t:"It is not the mountain we conquer but ourselves.",a:"Edmund Hillary"},
    {t:"Act well at the moment.",a:"Johann Kaspar Lavater"},
    {t:"What we do in life echoes in eternity.",a:"Marcus Aurelius"},
    {t:"Great things are not done by impulse, but by a series of small things brought together.",a:"Vincent Van Gogh"},
    {t:"We suffer more in imagination than in reality.",a:"Seneca"},
    {t:"The quality of a person's life is in direct proportion to their commitment to excellence.",a:"Vince Lombardi"},
    {t:"If it doesn't challenge you, it doesn't change you.",a:"Fred DeVito"},
    {t:"The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.",a:"Arnold Schwarzenegger"},
    {t:"Temptation is the feeling we get when we encounter an opportunity to betray our better self.",a:"Naval Ravikant"},
    {t:"No man is free who is not master of himself.",a:"Epictetus"},
    {t:"The cave you fear to enter holds the treasure you seek.",a:"Joseph Campbell"},
    {t:"I fear not the man who has practiced ten thousand kicks once, but I fear the man who has practiced one kick ten thousand times.",a:"Bruce Lee"},
    {t:"Only the disciplined ones in life are free.",a:"Eliud Kipchoge"},
    {t:"Show me your routine and I'll show you your future.",a:"Unknown"},
    {t:"The secret of your future is hidden in your daily routine.",a:"Mike Murdock"},
    {t:"Motivation gets you started. Discipline keeps you going.",a:"Unknown"},
    {t:"You will never always be motivated. You have to learn to be disciplined.",a:"Unknown"},
    {t:"If you are not willing to risk the unusual, you will have to settle for the ordinary.",a:"Jim Rohn"},
    {t:"Small daily improvements over time lead to stunning results.",a:"Robin Sharma"},
    {t:"Absorb what is useful, discard what is not, add what is uniquely your own.",a:"Bruce Lee"},
    {t:"Do not go where the path may lead; go instead where there is no path and leave a trail.",a:"Ralph Waldo Emerson"},
    {t:"Our greatest glory is not in never falling, but in rising every time we fall.",a:"Confucius"},
    {t:"Be the change you wish to see in the world.",a:"Mahatma Gandhi"},
    {t:"You are not your feelings. You are the one who watches them.",a:"Unknown"},
    {t:"I am not afraid of storms, for I am learning how to sail my ship.",a:"Louisa May Alcott"},
    {t:"Nothing will work unless you do.",a:"Maya Angelou"},
    {t:"All things are difficult before they are easy.",a:"Thomas Fuller"},
    {t:"The groundwork of all happiness is good health.",a:"Leigh Hunt"},
    {t:"Take care of your body. It's the only place you have to live.",a:"Jim Rohn"},
    {t:"Success is the sum of small efforts repeated day in and day out.",a:"Robert Collier"},
    {t:"Don't limit your challenges. Challenge your limits.",a:"Jerry Dunn"},
    {t:"The difference between try and triumph is just a little umph.",a:"Marvin Phillips"},
    {t:"Forge your character in the fire of adversity.",a:"GritCore"},
  ];
  ```

- [ ] **Step 4: Update quote rotation logic**

  Find where `qi` (quote index) is used to pick the current quote. Replace the index pick with the date-seeded version:

  ```js
  // Replace qi-based selection with:
  function getTodayQuote() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    return QUOTES[dayIndex % QUOTES.length];
  }
  function getTomorrowQuote() {
    const dayIndex = Math.floor(Date.now() / 86400000) + 1;
    return QUOTES[dayIndex % QUOTES.length];
  }
  ```

- [ ] **Step 5: Update quote rendering in `renderToday()`**

  Find the quote card HTML in `renderToday()` and replace it:

  ```js
  const q = getTodayQuote();
  // Quote card HTML:
  `<div class="qcard card af s${N}" id="qcard" onclick="qPreview(this)">
    <div class="qtext">${q.t}</div>
    <div class="qauth">— ${q.a}</div>
  </div>`
  ```

  Add `qPreview` function:

  ```js
  function qPreview(el) {
    if (QUOTES.length <= 1) return;
    const q2 = getTomorrowQuote();
    const txt = el.querySelector('.qtext');
    const auth = el.querySelector('.qauth');
    const orig = getTodayQuote();
    txt.textContent = q2.t; auth.textContent = '— ' + q2.a;
    el.style.opacity = '0.7';
    clearTimeout(el._qt);
    el._qt = setTimeout(() => {
      txt.textContent = orig.t; auth.textContent = '— ' + orig.a;
      el.style.opacity = '';
    }, 3000);
  }
  ```

- [ ] **Step 6: Update quote CSS in `gritcore.css`**

  Find existing `.qcard` styles and replace:

  ```css
  .qcard {
    padding: 20px 18px;
    border-left: 2px solid var(--heat-color, rgba(201,168,76,0.5));
    cursor: pointer;
    transition: opacity .3s;
  }
  .qtext {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 17px;
    line-height: 1.5;
    color: var(--cthi);
    margin-bottom: 10px;
  }
  .qauth {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 8px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--ctd);
  }
  ```

  Note: `--heat-color` should be set alongside `--heat` in `updateHeat()`:
  ```js
  // In updateHeat(), also set:
  document.documentElement.style.setProperty('--heat-color', `rgba(201,168,76,${0.3 + heat * 0.7})`);
  ```

- [ ] **Step 7: Verify in browser**

  Check all items in the Step 1 checklist. Use dev console "+1 Day" to confirm quote changes.

- [ ] **Step 8: Commit**

  ```bash
  git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
  git commit -m "feat: premium quote card — daily rotation, tap preview, 60+ quotes (v0.22)"
  ```

---

## Task 7 — Final CSS Polish Sweep (v0.23)

**Files:**
- Modify: `gritcore-app/www/gritcore.css`
- Modify: `gritcore-app/www/index.html` (minor JS fixes only if needed)

- [ ] **Step 1: Write the verification checklist**

  Work through every screen and interaction. Each item must pass:

  ```
  TODAY TAB
  [ ] Heat veil transitions smoothly on load, no flash
  [ ] Score cards render without layout shift
  [ ] Streak badge (🔥 + number) doesn't cause header to jump when it appears/changes
  [ ] Discipline cards have consistent padding, border-radius, glass effect
  [ ] Done/failed buttons have press states (scale down on :active)
  [ ] Crack animation on fail is smooth
  [ ] Streak panel opens/closes with smooth height transition, no jank
  [ ] Quote card border accent color matches current heat level
  [ ] Empty state ("No Disciplines Forged") is styled — not raw text
  [ ] FAB button has consistent press state
  [ ] FAB sheet opens/closes cleanly, backdrop fades
  [ ] Toast notification appears smoothly, doesn't overlap nav

  RECORD TAB
  [ ] Heatmap scrolls without jitter
  [ ] Tooltip appears and disappears cleanly
  [ ] Empty heatmap (no data) looks intentional, not broken

  REPORT TAB
  [ ] Stats cards have consistent visual weight
  [ ] Category bars animate in (width transition on render)
  [ ] Icon row buttons have press states
  [ ] Settings/Profile/About sheets open/close cleanly
  [ ] Empty Report (no data) shows gracefully

  FORGE TAB
  [ ] Category pills are visually consistent
  [ ] Add/rename/delete interactions feel responsive
  [ ] Discipline input field styled consistently with rest of app
  [ ] "Forge New Discipline" CTA button styled correctly

  DEV CONSOLE
  [ ] Corner ⚙ icon is subtle but findable
  [ ] Drawer matches FAB sheet open/close timing and easing
  [ ] All 8 buttons have consistent style and press states

  GLOBAL
  [ ] All transitions use consistent easing (0.3s cubic-bezier(0.4,0,0.2,1) or ease)
  [ ] No horizontal overflow on any screen
  [ ] Safe area insets applied everywhere (nav, sheets, dev console)
  [ ] Onboarding flow: smooth transitions, no blank flash between steps
  [ ] App loads cold in < 1 second, no visible jank
  ```

- [ ] **Step 2: Backup**

  ```bash
  cp gritcore-app/www/index.html gritcore-app/www/index.0.22.html
  cp gritcore-app/www/gritcore.css gritcore-app/www/gritcore.0.22.css
  ```

- [ ] **Step 3: Fix transition consistency**

  In `gritcore.css`, do a full pass replacing inconsistent transitions. Define a standard easing variable and apply it:

  ```css
  :root {
    /* Add to existing :root block: */
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
    --t-fast: 0.15s var(--ease);
    --t-mid: 0.3s var(--ease);
    --t-slow: 0.6s var(--ease);
  }
  ```

  Then replace ad-hoc `transition: X .3s ease` values with `transition: X var(--t-mid)` where appropriate.

- [ ] **Step 4: Fix active/press states on all interactive elements**

  Add or verify these exist in `gritcore.css`:

  ```css
  .hbtn:active, .fab:active, .bni:active,
  .rpt-icon-btn:active, .dev-btn:active, .dev-console-btn:active,
  .cat-pill-edit:active, .cat-pill-del:active {
    transform: scale(0.93);
    opacity: 0.75;
  }
  ```

- [ ] **Step 5: Fix streak badge layout stability**

  The streak badge (`#sbadge`) must not cause header reflow when the number changes. Ensure it has a fixed `min-width`:

  ```css
  .sbadge {
    min-width: 36px; /* or whatever fits "🔥999" without overflow */
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  ```

- [ ] **Step 6: Verify streak panel height transition**

  The streak panel (`#streak-panel`) must animate height smoothly. If it currently snaps, wrap the content in a measured div:

  ```css
  #streak-panel {
    overflow: hidden;
    transition: max-height var(--t-mid);
    max-height: 0;
  }
  #streak-panel.open {
    max-height: 600px; /* larger than actual content */
  }
  ```

  Confirm the JS toggles `.open` class rather than setting inline height.

- [ ] **Step 7: Fix toast z-index and position**

  Toast must appear above everything including the FAB sheet:

  ```css
  .toast {
    z-index: 1100; /* above FAB sheet (1050), dev console (1000) */
    bottom: calc(72px + env(safe-area-inset-bottom) + 8px);
  }
  ```

- [ ] **Step 8: Walk through every checklist item in the browser**

  Take your time. Open DevTools console — zero errors. Use the dev console to exercise every state:
  - Add test data → verify all tabs with data
  - Set streak to 30 → verify streak panel
  - All Done / All Failed → verify animations
  - +1 Day / -1 Day → verify date display and quote change

- [ ] **Step 9: Commit**

  ```bash
  git add gritcore-app/www/index.html gritcore-app/www/gritcore.css
  git commit -m "polish: final CSS sweep — consistent transitions, press states, no layout shift (v0.23)"
  ```

---

## Done

After Task 7 passes all checklist items, GritCore v0.23 is complete:
- Self-contained, zero external dependencies
- Full dev console for testing every feature
- GitHub-style heatmap on Record
- Redesigned Report hub with stats + icon row
- Custom categories (up to 8, fully editable)
- Premium daily-rotating quote card
- Consistent, polished UI from end to end
