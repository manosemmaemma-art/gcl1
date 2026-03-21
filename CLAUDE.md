# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |

## Plan Mode Rule
BEFORE writing any code, ALWAYS enter plan mode via EnterPlanMode.
No exceptions — even for "small" changes.
Only skip if the user explicitly says "just do it."

---

## GritCore Project Context

**App:** GritCore — "Forge your discipline." iOS app (Capacitor 6, vanilla JS, no build step)
**Owner:** First-time developer, no coding experience. Co-create simple, working, quality app.
**Files:** All work happens in `gritcore-app/www/` — `index.html` (main app), `gritcore.css` (overhaul styles), `paywall.js`, `config.js`, `marble-interpolator.js`

**Design language:**
- Black marble texture (`img/marble.jpg`), frosted glass cards, dark/premium feel
- Fonts: Cormorant Garamond (display) + Josefin Sans (labels/UI)
- Heat system: `--heat` CSS variable, silver → gold as disciplines are completed today
- FAB `+` button opens a bottom sheet for quick-logging disciplines

**Key APIs (vanilla JS globals):**
- `habits[]` / `logs{}` — raw storage; always use `effH()` / `effL()` instead
- `getDate()` — returns today's date string (YYYY-MM-DD)
- `daysBack(n, fromDate)` — returns date string n days before fromDate
- `dayPct(dateStr, hh, ll)` — daily completion % (null if no habits)
- `markH(id, status, btnEl, evt)` — marks a habit done/failed; `evt` passed for ripple coords
- `sw(view, el)` — switches active tab; resets `recordMonthOffset` when leaving Record tab
- `updateHeat(completed, total)` — updates `--heat` CSS variable + calls `updateMotivation()`
- `updateMotivation()` — updates contextual motivation line in header (6 priority states)
- `showToast(msg, sub)` — top-banner toast drop; `sub` optional (shows "X of Y today")
- `calcStreak()` — overall app streak (current)
- `calcHabitStreak(id)` — per-discipline consecutive-done streak (from yesterday back)
- `getPersonalBests()` — `{bestStreak, bestMonth, bestWeek}` from full log history
- `getWeeklyBars()` — 7-day bar data array for Report tab
- `getMonthOverMonth()` — current + previous month stats for Report tab
- `goRecordMonth(delta)` — navigates Record tab by month; clamps at 0 (no future)
- `isPlaceholder` — true when no real habits yet (demo mode)
- `recordMonthOffset` — module-level int (0 = current month, -1 = last month, etc.)

**New CSS classes added in v0.25** (all in `gritcore.css`):
- `.hcard-streak` — per-discipline streak pill on Today tab cards
- `#motivation-line` — contextual motivation text in header right column
- `.toast-body`, `#toast-msg`, `#toast-sub` — top-banner toast structure
- `.rpt-bests-grid`, `.rpt-best-card`, `.rpt-best-val`, `.rpt-best-lbl` — Personal Bests 2×2
- `.rpt-week-wrap`, `.rpt-week-bars`, `.rpt-wbar`, `.rpt-wday` — Last 7 Days bar chart
- `.rpt-month-row`, `.rpt-month-card`, `.rpt-month-pct`, `.rpt-month-sub` — Month Over Month
- `.rec-month-nav`, `.rec-month-label`, `.rec-nav-btn` — Record tab month nav header
- `.rec-day-list`, `.rec-day-row`, `.rec-day-date`, `.rec-day-bar`, `.rec-day-pct` — Record day-list
- `.empty-card`, `.empty-title`, `.empty-sub`, `.empty-cta` — Today tab empty state
- `.bni.on` — gold pill active state (tab bar, replaces dot indicator)
- `.tab-fade-in` — tab content 0.2s fade-in on `sw()`
- `.fab-sheet.open` — spring cubic-bezier(0.34,1.56,0.64,1) on bottom sheet open

**Versioning:** Backup before every change set. v0.24 backups: `index.0.24.html`, `gritcore.0.24.css`. v0.25 backups: `index.0.25.html`, `gritcore.0.25.css`. Next version: 0.26.

**Dev console:** Purged (dormant stub). Will be rebuilt later.
**marble-interpolator.js:** Preserved untouched for future time-of-day marble (v2 feature).

## Git commit rule
Before every `git commit`, update `CLAUDE.md` to reflect any new conventions, decisions, or structural changes made in that session.
