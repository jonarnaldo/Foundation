#!/bin/bash
#
# run_agent_session.sh
#
# Runs one headless Claude Code session against the project, governed by
# coding_prompt.md (appended to the system prompt via a generated settings
# file). Each invocation is a fresh, stateless session that picks up the
# next failing feature from feature_list.json, per the doc's own workflow.
#
# Requires: claude (Claude Code CLI), git, gh, jq
#
set -euo pipefail

# ---- Configuration ---------------------------------------------------------

PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
PROMPT_FILE="${PROMPT_FILE:-./coding_prompt.md}"
SETTINGS_FILE="$(mktemp -t claude-settings-XXXXXX.json)"
RESULT_DIR="${RESULT_DIR:-./session-results}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RESULT_FILE="${RESULT_DIR}/session-${TIMESTAMP}.json"

MODEL="${MODEL:-sonnet}"
EFFORT="${EFFORT:-high}"
MAX_TURNS="${MAX_TURNS:-100}"
MAX_BUDGET_USD="${MAX_BUDGET_USD:-5}"

mkdir -p "$RESULT_DIR" "$PROJECT_DIR/verification"

# ---- Preflight checks -------------------------------------------------------
# The agent commits to a feature branch and opens a PR every session
# (Steps 1 and 9 of coding_prompt.md). If git or gh aren't authenticated,
# the session will fail silently partway through — better to catch it now.

echo "== Preflight checks =="

fail() {
  echo "PREFLIGHT FAILED: $1" >&2
  exit 1
}

# 1. Required binaries present
for bin in claude git gh jq; do
  command -v "$bin" >/dev/null 2>&1 || fail "'$bin' not found on PATH."
done

# 2. coding_prompt.md exists and is readable
[ -r "$PROMPT_FILE" ] || fail "Cannot read prompt file at $PROMPT_FILE."

# 3. We're inside a git repo with a clean working tree on main
cd "$PROJECT_DIR"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || fail "$PROJECT_DIR is not a git repository."

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  fail "Expected to start on 'main', but current branch is '$CURRENT_BRANCH'. Switch to main before running."
fi

if [ -n "$(git status --porcelain)" ]; then
  fail "Working tree on main is not clean. Commit, stash, or discard changes first."
fi

# 4. git can authenticate to the remote (push access)
#    A dry-run push of an empty refspec exercises auth without changing anything.
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
[ -n "$REMOTE_URL" ] || fail "No 'origin' remote configured."

if ! git ls-remote origin >/dev/null 2>&1; then
  fail "Cannot reach/authenticate to git remote 'origin' ($REMOTE_URL). Check credentials (SSH key, credential helper, or token)."
fi

# 5. gh CLI is authenticated (needed for `gh pr create` in Step 9)
if ! gh auth status >/dev/null 2>&1; then
  fail "GitHub CLI ('gh') is not authenticated. Run 'gh auth login' or set GH_TOKEN."
fi

# 6. git identity is configured (needed for commits in Step 9)
git config user.name  >/dev/null 2>&1 || fail "git user.name is not configured (git config user.name '...')."
git config user.email >/dev/null 2>&1 || fail "git user.email is not configured (git config user.email '...')."

# 7. ANTHROPIC_API_KEY (or another supported auth method) is present
if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -z "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
  fail "Neither ANTHROPIC_API_KEY nor CLAUDE_CODE_OAUTH_TOKEN is set."
fi

echo "All preflight checks passed."

# ---- Build the settings file -----------------------------------------------
# Everything that used to be CLI flags (--append-system-prompt, --allowedTools,
# --model, --effort) now lives in one generated settings.json, passed via
# --settings. jq handles JSON-escaping coding_prompt.md safely so embedded
# quotes/backticks in the markdown don't break the file.

echo "== Generating settings file: $SETTINGS_FILE =="

jq -n \
  --rawfile sysprompt "$PROMPT_FILE" \
  --arg model "$MODEL" \
  --arg effort "$EFFORT" \
  '{
    model: $model,
    effortLevel: $effort,
    appendSystemPrompt: $sysprompt,
    permissions: {
      allow: [
        "Read",
        "Write",
        "Edit",
        "Glob",
        "Grep",
        "Bash(git *)",
        "Bash(gh *)",
        "Bash(npm *)",
        "Bash(npx *)",
        "Bash(cd *)",
        "Bash(ls *)",
        "Bash(cat *)",
        "Bash(chmod +x *)",
        "Bash(./init.sh)",
        "mcp__playwright__browser_navigate",
        "mcp__playwright__browser_snapshot",
        "mcp__playwright__browser_click",
        "mcp__playwright__browser_type",
        "mcp__playwright__browser_take_screenshot",
        "mcp__playwright__browser_wait_for",
        "mcp__playwright__browser_press_key",
        "mcp__playwright__browser_hover",
        "mcp__playwright__browser_select_option",
        "mcp__playwright__browser_tab_list",
        "mcp__playwright__browser_tab_new",
        "mcp__playwright__browser_tab_select",
        "mcp__playwright__browser_tab_close",
        "mcp__playwright__browser_console_messages",
        "mcp__playwright__browser_network_requests",
        "mcp__playwright__browser_close",
        "mcp__playwright__browser_resize"
      ],
      deny: [
        "Bash(rm -rf *)",
        "Bash(git push --force*)",
        "Bash(git checkout main)",
        "Read(.env*)",
        "Read(**/*.pem)",
        "mcp__playwright__browser_run_code_unsafe"
      ]
    },
    mcpServers: {
      playwright: {
        command: "npx",
        args: ["-y", "@playwright/mcp@latest"]
      }
    }
  }' > "$SETTINGS_FILE"

# Sanity-check the generated JSON before handing it to claude
jq empty "$SETTINGS_FILE" || fail "Generated settings file is not valid JSON."

# ---- Run the session ---------------------------------------------------------

echo "== Starting Claude Code session =="

claude -p "Begin this session per your instructions." \
  --settings "$SETTINGS_FILE" \
  --max-turns "$MAX_TURNS" \
  --max-budget-usd "$MAX_BUDGET_USD" \
  --output-format json \
  > "$RESULT_FILE"

echo "== Session complete. Output saved to $RESULT_FILE =="

# ---- Cleanup ------------------------------------------------------------

rm -f "$SETTINGS_FILE"

# ---- Post-run summary ---------------------------------------------------
# feature_list.json's pass count is the ground truth for progress, and the
# result JSON's cost/turn fields are the ground truth for spend; surface
# both immediately rather than making the operator dig through files.

echo "== Session summary =="

jq -r --arg budget "$MAX_BUDGET_USD" '
  "Cost:    $\(.total_cost_usd // "unknown") (budget cap was $\($budget))",
  "Turns:   \(.num_turns // "unknown") (max was '"$MAX_TURNS"')",
  "Status:  \(.subtype // "unknown")",
  "Result:  \((.result // "") | .[0:200])"
' "$RESULT_FILE" 2>/dev/null || echo "Could not parse $RESULT_FILE for a cost summary — check it directly."

if [ -f "$PROJECT_DIR/feature_list.json" ]; then
  jq -r '
    (map(select(.passes)) | length) as $pass |
    length as $total |
    "Progress: \($pass)/\($total) tests passing"
  ' "$PROJECT_DIR/feature_list.json"
fi