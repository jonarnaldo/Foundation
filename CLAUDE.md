# Foundation — Agent Instructions

## Read This First

Full coding instructions are in `prompts/coding_prompt.md`. Read that file
before doing anything else in this repo.

```bash
cat prompts/coding_prompt.md
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

- Implement more than one feature per session
- Mark a test passing without browser screenshots
- Edit test descriptions or steps in `feature_list.json`
- Commit broken code
