# Feature Agent Runner (TypeScript / Agent SDK)

This is the Agent SDK equivalent of `run_agent_session.sh`. It runs **one**
Claude Agent SDK session, governed by `coding_prompt.md`, against your
project — implementing the next failing feature from `feature_list.json`,
then exiting. Run it again manually for the next feature; it does not loop.

Anthropic's own guidance is that the SDK, not the CLI's `-p` flag, is the
recommended path for production automation — this gives native message
streaming (you see output as it happens, no `jq` parsing of an event
stream required) plus typed config and result objects.

## Setup

```bash
npm install
```

Place `coding_prompt.md` in this directory (or set `PROMPT_FILE` to its path).

## Run

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export PROJECT_DIR="/path/to/your/project"
npm start
```

## Configuration (environment variables)

| Variable | Default | Notes |
|---|---|---|
| `PROJECT_DIR` | current directory | the repo the agent works in |
| `PROMPT_FILE` | `../prompts/coding_prompt.md` | appended to the Claude Code system prompt |
| `RESULT_DIR` | `./session-results` | where the raw transcript (`.jsonl`) is saved |
| `MODEL` | `claude-sonnet-4-6` | use a literal model ID, not an alias |
| `MAX_TURNS` | `100` | hard cap on agentic turns |
| `MAX_BUDGET_USD` | `5` | hard cap on session spend |
| `EFFORT` | `high` | `low` \| `medium` \| `high` \| `xhigh` \| `max` |
| `ANTHROPIC_API_KEY` / `CLAUDE_CODE_OAUTH_TOKEN` | — | one is required |

## What it checks before running

Same preflight checks as the bash version: required binaries, a clean `main`
branch, git remote auth, `gh` auth, git identity, and an API key/token —
each with a specific failure message so a broken environment fails loudly
before any API spend happens.

## What's different from the bash + CLI version

- **No `--settings` JSON file, no jq.** Configuration is a typed `options`
  object passed directly to `query()`.
- **Real-time message streaming**, not buffered JSON. Each assistant
  message, tool call, and tool result prints as it happens.
- **`permissionMode: "bypassPermissions"`** plus an explicit
  `disallowedTools` list as the actual safety boundary — per the SDK
  reference docs, deny rules win over permission mode, so the dangerous
  patterns (force-push, `rm -rf`, reading `.env`, the unsafe Playwright
  script-execution tool) stay blocked even with prompting bypassed.
- **`settingSources: []`** is set explicitly rather than relying on either
  documented default, since Anthropic's own docs pages disagree on what the
  unset default actually is.