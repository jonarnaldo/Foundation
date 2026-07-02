# Foundation — Agent Instructions

## Read This First

Full coding instructions are in `agent/prompts/coding_prompt.md`. Read that
file before doing anything else in this repo.

```bash
cat agent/prompts/coding_prompt.md
```

## One-Line Summary of the Rules

Pick the first failing test in `feature_list.json`, implement only what that
test requires, verify it through the browser with screenshots, mark it
`"passes": true`, commit, and stop.

## Project Quick Reference

- Frontend: React 18 + Vite — `localhost:5173`
- Backend: NestJS — `localhost:3001`
- DB: PostgreSQL (TimescaleDB) via Docker
- Cache: Redis via Docker
- Start everything: `./init.sh`
- Package manager: `pnpm`

## Key Constraints

- `feature_list.json` — only the `"passes"` field may be changed
- Currency is stored in **cents** (integers) throughout the backend
- Dev auth bypass is active: all requests are treated as `dev-user-001`
- `TypeORM synchronize: true` in non-production — schema auto-migrates

## Do Not

- Commit or push directly to `main` — always work on a feature branch
- Implement more than one feature per session
- Mark a test passing without browser screenshots
- Edit test descriptions or steps in `feature_list.json`
- Commit broken code


Here are some behavioral guidelines you MUST follow:

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.