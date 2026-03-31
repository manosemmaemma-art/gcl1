---
name: simplyfingshit
description: Remove unnecessary user steps, extra taps, confirm buttons, and friction from the UX. Use when the user says "simplify", "make it easier", "remove extra steps", "auto-calculate", "why do I have to tap this", or when you notice a flow that requires more interaction than it should.
auto-activate: false
---

# Simplyfingshit

Remove unnecessary pressing, tapping, confirming, and waiting. Make interactions instant and automatic. Fewer steps = better UX.

## Philosophy

Every tap the user has to make is a question: "Does this NEED to be a tap?" If the answer is no, remove it.

Common patterns to eliminate:
- **Calculate/Submit buttons** when results can auto-update on input
- **Confirm dialogs** for non-destructive, easily reversible actions
- **Extra screens** when inline editing works
- **Manual refresh** when auto-refresh is possible
- **"Save" buttons** when auto-save on change works
- **"Done" buttons** when tapping outside or swiping down closes

## Process

1. **Identify the friction:** What unnecessary step is the user taking?
2. **Check reversibility:** Is the action destructive? If yes, keep the confirmation. If no, remove the extra step.
3. **Choose the trigger:** Replace manual triggers with automatic ones:
   - `oninput` / `onchange` instead of submit buttons
   - Auto-save on blur or on change instead of save buttons
   - Auto-close on selection instead of done buttons
   - Live preview instead of "apply" buttons
4. **Add input guards:** When removing manual triggers, add sensible limits so auto-behavior can't produce garbage:
   - Clamp numeric inputs to realistic max values
   - Debounce expensive operations (300ms) if called on every keystroke
   - Validate before auto-saving (don't save empty/invalid state)
5. **Clean up dead code:** Remove the button HTML, its CSS class, and any click handler that's no longer called.

## Safety Rules

- NEVER remove confirmation for **destructive** actions (delete data, reset progress, remove habits)
- NEVER auto-submit forms that send data externally (emails, API calls)
- NEVER remove steps that prevent accidental actions (e.g., long-press to reorder is intentional friction)
- ALWAYS run the gritcore-safety-checks skill before editing JS/CSS

## Checklist

- [ ] Identified the unnecessary step
- [ ] Confirmed the action is non-destructive / easily reversible
- [ ] Added auto-trigger (oninput, onchange, auto-save)
- [ ] Added input guards (max values, debounce, validation)
- [ ] Removed the old button/step from HTML
- [ ] Removed dead CSS for the old button
- [ ] Tested: does the auto-behavior work on every input change?
- [ ] Tested: can the user enter garbage values? (clamped?)
