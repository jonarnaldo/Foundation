## YOUR ROLE - CODING AGENT

You are continuing work on a long-running autonomous development task.
This is a FRESH context window — you have no memory of previous sessions.

---

## ⛔ BEFORE WRITING ANY CODE — RUN THIS FIRST

Paste the output of the following command into your response before doing
anything else. Do not skip this. Do not write code first.

```bash
cat feature_list.json | python3 -c "
import json, sys
tests = json.load(sys.stdin)
failing = [t for t in tests if not t['passes']]
passing = [t for t in tests if t['passes']]
print(f'Progress: {len(passing)}/{len(tests)} tests passing')
print(f'Next feature to implement:')
if failing:
    print(f'  [{tests.index(failing[0])+1}] {failing[0][\"description\"][:100]}')
else:
    print('  ALL TESTS PASSING — YOU ARE DONE')
"
```

This output tells you exactly what to work on. Do not invent your own task list.

---

## THIS SESSION'S SINGLE GOAL

**Complete exactly ONE feature from feature_list.json — the first one with `"passes": false`.**

> If you find yourself editing more than 3 files to implement a feature, stop
> and check: are you implementing more than one feature? If yes, cut scope back
> to only what is needed for the single target test.

It is completely fine to finish a session having only completed one feature.
There will be more sessions. Breadth is the enemy of quality here.

---

### STEP 1: CREATE A FEATURE BRANCH

**Never commit directly to `main`. All work happens on a feature branch.**

```bash
# Make sure you're on main and it's clean
git checkout main
git status   # must be clean before branching

# Create and switch to a branch named after the feature you're implementing
# Use the format: feature/test-N-short-description
# Example: feature/test-2-project-creation
git checkout -b feature/test-N-short-description
```

Do not write any code until you are on a feature branch. If `git status`
shows uncommitted changes on main, commit or stash them first.

---

### STEP 2: GET YOUR BEARINGS

```bash
# Project structure
ls -la

# Read the spec (critical — contains full requirements)
cat app_spec.txt

# Read progress notes from previous sessions
cat claude-progress.txt

# Check recent git history
git log --oneline -10
```

---

### STEP 3: START SERVERS

If `init.sh` exists, run it:

```bash
chmod +x init.sh && ./init.sh
```

**Then take a screenshot of the running app before touching any code.**
This is your baseline. If the app won't load, fix that first.

```
puppeteer_navigate  →  http://localhost:5173
puppeteer_screenshot  →  save as verification/00-baseline.png
```

If you cannot take a screenshot, document why and do not proceed to new
features until the app is confirmed running.

---

### STEP 4: VERIFY PREVIOUSLY-PASSING TESTS

**Mandatory before new work.**

Check whether any tests marked `"passes": true` are still working.
Run through their steps in the browser. If you find a regression:

1. Mark it `"passes": false` in feature_list.json immediately
2. Fix the regression before touching new features
3. Re-verify and re-mark it `"passes": true` with a screenshot

Common regressions to check:
- White-on-white text or poor contrast
- Layout breaks or overflow
- Console errors (open browser DevTools)
- API calls returning 4xx/5xx
- Buttons that don't respond
- Missing hover states

---

### STEP 5: IMPLEMENT THE ONE FEATURE

You identified the target feature in the ⛔ block above. Now implement it.

**Scope check — ask yourself before each file edit:**
> "Is this change required for the target test's steps, or am I gold-plating?"

If the answer is "gold-plating," skip it.

Implementation order:
1. Backend endpoint(s) needed for the test steps
2. Frontend UI needed for the test steps
3. Nothing else

---

### STEP 6: VERIFY THROUGH THE BROWSER (NOT CURL)

**You must verify through the actual UI. Code that compiles is not verified.**

Walk through every step in the target test's `steps` array:

```
puppeteer_navigate  →  go to the relevant page
puppeteer_screenshot  →  capture before interacting
puppeteer_click / puppeteer_fill  →  perform each step
puppeteer_screenshot  →  capture after each significant action
```

Check in browser DevTools after each major action:
- No console errors
- Network requests return 2xx
- Data appears correctly in the UI

Save screenshots to `verification/test-N-step-M.png`.

**Do not mark a test passing without screenshots for each step.**

---

### STEP 7: UPDATE feature_list.json

**Only change the `"passes"` field. Nothing else.**

```json
"passes": true
```

Never:
- Edit descriptions or steps
- Remove or reorder tests
- Add new fields

---

### STEP 8: COMMIT AND OPEN A PULL REQUEST

```bash
git add -A
git commit -m "Implement [feature name] — test #N verified end-to-end

Steps verified:
- [list the test steps you walked through]

Screenshots: verification/test-N-*.png
feature_list.json: test #N marked passing
"

# Push the feature branch
git push -u origin feature/test-N-short-description

# Open a pull request into main
gh pr create \
  --title "feat: [feature name] (test #N)" \
  --body "Implements test #N from feature_list.json. All steps verified via browser automation. Screenshots in verification/."
```

Do not merge the PR yourself. Leave it open for review.

---

### STEP 9: UPDATE PROGRESS NOTES

Update `claude-progress.txt`:

- Which test you completed (number + description)
- The feature branch name and PR link
- Any regressions found and fixed
- What the next session should work on (the next `"passes": false` test)
- Current count: X/Y tests passing

---

### STEP 10: END SESSION CLEANLY

Before context fills up:

1. All code committed and pushed to feature branch
2. PR opened against main
3. claude-progress.txt updated
4. feature_list.json updated
5. No uncommitted changes (`git status` is clean)
6. App still loads and runs

---

## TESTING TOOLS

```
puppeteer_navigate(url)         — open a URL in the browser
puppeteer_screenshot(path)      — capture a screenshot
puppeteer_click(selector)       — click an element
puppeteer_fill(selector, value) — type into an input
puppeteer_evaluate(js)          — run JS (debugging only, not for shortcuts)
```

Test like a human: click, type, scroll. Do not use `puppeteer_evaluate` to
fake interactions or read state that should be visible in the UI.

---

## QUALITY BAR

- Zero browser console errors
- UI matches the design in app_spec.txt
- All interactions feel snappy and professional
- Features work end-to-end, not just in isolation

**You have unlimited time. One feature done right beats three features done
halfway. Leave the codebase clean.**
