/**
 * run_agent_session.ts
 *
 * Runs ONE Claude Agent SDK session against the project, governed by
 * coding_prompt.md (appended to the Claude Code system prompt). Each
 * invocation is a fresh, stateless session that picks up the next failing
 * feature from feature_list.json, per the doc's own workflow. Run this
 * script again manually for the next feature — it does not loop itself.
 *
 * This is the SDK equivalent of run_agent_session.sh. Anthropic's own
 * guidance is: the SDK for CI/CD pipelines, custom applications, and
 * production automation; the CLI (`claude -p`) for interactive development
 * and one-off tasks. This script exists because the workflow in
 * coding_prompt.md is the former, not the latter.
 *
 * Requires: Node 18+, git, gh
 * Install:  npm install
 * Run:      npm start
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---- Configuration ---------------------------------------------------------

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = process.env.PROJECT_DIR ?? process.cwd();
const PROMPT_FILE = process.env.PROMPT_FILE ?? join(SCRIPT_DIR, "prompts/coding_prompt.md");
const RESULT_DIR = process.env.RESULT_DIR ?? "./session-results";
const MODEL = process.env.MODEL ?? "claude-sonnet-4-6"; // use a literal model ID, not an alias
const MAX_TURNS = Number(process.env.MAX_TURNS ?? 100);
const MAX_BUDGET_USD = Number(process.env.MAX_BUDGET_USD ?? 5);

// Confirmed against the installed SDK's type definitions (sdk.d.ts):
// `effort` is the current top-level field — 'low' | 'medium' | 'high' |
// 'xhigh' | 'max'. `maxThinkingTokens` exists but is @deprecated in favor
// of `effort` / `thinking`, so we use `effort` here, matching the CLI
// script's --effort flag.
const EFFORT = (process.env.EFFORT ?? "medium") as
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const resultFile = join(RESULT_DIR, `session-${timestamp}.jsonl`);

// ---- Preflight checks -------------------------------------------------------
// The agent commits to a feature branch and opens a PR every session
// (Steps 1 and 9 of coding_prompt.md). If git or gh aren't authenticated,
// the session will fail silently partway through — better to catch it now.

function fail(message: string): never {
  console.error(`PREFLIGHT FAILED: ${message}`);
  process.exit(1);
}

function sh(cmd: string, cwd = PROJECT_DIR): string {
  return execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
}

function shOk(cmd: string, cwd = PROJECT_DIR): boolean {
  try {
    execSync(cmd, { cwd, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function preflight(): void {
  console.log("== Preflight checks ==");

  // 1. Required binaries present
  for (const bin of ["git", "gh"]) {
    if (!shOk(`command -v ${bin}`, process.cwd())) {
      fail(`'${bin}' not found on PATH.`);
    }
  }

  // 2. coding_prompt.md exists and is readable
  if (!existsSync(PROMPT_FILE)) {
    fail(`Cannot read prompt file at ${PROMPT_FILE}.`);
  }

  // 3. We're inside a git repo with a clean working tree on main
  if (!shOk("git rev-parse --is-inside-work-tree")) {
    fail(`${PROJECT_DIR} is not a git repository.`);
  }

  const currentBranch = sh("git rev-parse --abbrev-ref HEAD");
  if (currentBranch !== "main") {
    fail(
      `Expected to start on 'main', but current branch is '${currentBranch}'. Switch to main before running.`
    );
  }

  const statusPorcelain = sh("git status --porcelain");
  if (statusPorcelain.length > 0) {
    fail("Working tree on main is not clean. Commit, stash, or discard changes first.");
  }

  // 4. git can authenticate to the remote (push access)
  let remoteUrl = "";
  try {
    remoteUrl = sh("git remote get-url origin");
  } catch {
    fail("No 'origin' remote configured.");
  }
  if (!shOk("git ls-remote origin")) {
    fail(
      `Cannot reach/authenticate to git remote 'origin' (${remoteUrl}). Check credentials (SSH key, credential helper, or token).`
    );
  }

  // 5. gh CLI is authenticated (needed for `gh pr create` in Step 9)
  if (!shOk("gh auth status")) {
    fail("GitHub CLI ('gh') is not authenticated. Run 'gh auth login' or set GH_TOKEN.");
  }

  // 6. git identity is configured (needed for commits in Step 9)
  if (!shOk("git config user.name")) {
    fail("git user.name is not configured (git config user.name '...').");
  }
  if (!shOk("git config user.email")) {
    fail("git user.email is not configured (git config user.email '...').");
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    fail("CLAUDE_CODE_OAUTH_TOKEN is set.");
  }

  console.log("All preflight checks passed.");
}

// ---- Main ---------------------------------------------------------------

async function main(): Promise<void> {
  preflight();

  mkdirSync(RESULT_DIR, { recursive: true });
  mkdirSync(join(PROJECT_DIR, "verification"), { recursive: true });

  const systemPromptAppend = readFileSync(PROMPT_FILE, "utf-8");

  console.log("== Starting Claude Agent SDK session ==");

  const rawMessages: SDKMessage[] = [];
  let finalResult: SDKResultMessage | null = null;

  for await (const message of query({
    prompt: "Begin this session per your instructions.",
    options: {
      cwd: PROJECT_DIR,
      model: MODEL,
      maxTurns: MAX_TURNS,
      effort: EFFORT,

      // Explicit, not relying on either documented default — see note above.
      settingSources: [],

      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: systemPromptAppend,
      },

      // bypassPermissions: nothing prompts (no human is watching this run).
      // disallowedTools below is the actual safety boundary — deny rules
      // win over permission mode, per the SDK reference docs.
      permissionMode: "bypassPermissions",

      allowedTools: [
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
        "mcp__playwright__browser_resize",
      ],

      disallowedTools: [
        "Bash(rm -rf *)",
        "Bash(git push --force*)",
        "Bash(git checkout main)",
        "Read(.env*)",
        "Read(**/*.pem)",
        "mcp__playwright__browser_run_code_unsafe",
      ],

      mcpServers: {
        playwright: {
          command: "npx",
          args: ["-y", "@playwright/mcp@latest"],
        },
      },
    },
  })) {
    rawMessages.push(message);

    // Native streaming: each message prints as it arrives, no jq required.
    switch (message.type) {
      case "system":
        if ((message as any).subtype === "init") {
          console.log(`[init] model=${(message as any).model}`);
        }
        break;

      case "assistant": {
        const content = (message as any).message?.content ?? [];
        for (const block of content) {
          if (block.type === "text") {
            console.log(block.text);
          } else if (block.type === "tool_use") {
            const inputPreview = JSON.stringify(block.input).slice(0, 150);
            console.log(`  -> ${block.name}: ${inputPreview}`);
          }
        }
        break;
      }

      case "user": {
        const content = (message as any).message?.content ?? [];
        for (const block of content) {
          if (block.type === "tool_result") {
            const text =
              typeof block.content === "string"
                ? block.content
                : JSON.stringify(block.content);
            console.log(`     result: ${text.slice(0, 200)}`);
          }
        }
        break;
      }

      case "result":
        finalResult = message;
        break;

      default:
        break;
    }
  }

  // Persist the full raw stream (one JSON object per line) for audit/debugging.
  writeFileSync(
    resultFile,
    rawMessages.map((m) => JSON.stringify(m)).join("\n") + "\n"
  );
  console.log(`== Session complete. Raw transcript saved to ${resultFile} ==`);

  // ---- Post-run summary ---------------------------------------------------

  console.log("== Session summary ==");
  if (finalResult) {
    console.log(`Cost:    $${finalResult.total_cost_usd}`);
    console.log(`Turns:   ${finalResult.num_turns} (max was ${MAX_TURNS})`);
    console.log(`Status:  ${finalResult.subtype} (is_error: ${finalResult.is_error})`);
    console.log(`Stopped: ${finalResult.stop_reason ?? "n/a"}`);
    if (finalResult.subtype === "success") {
      console.log(`Result:  ${finalResult.result.slice(0, 200)}`);
    }
  } else {
    console.log("No final 'result' message was received — check the transcript directly.");
  }

  const featureListPath = join(PROJECT_DIR, "feature_list.json");
  if (existsSync(featureListPath)) {
    const features = JSON.parse(readFileSync(featureListPath, "utf-8"));
    const passing = features.filter((f: any) => f.passes).length;
    console.log(`Progress: ${passing}/${features.length} tests passing`);
  }
}

main().catch((err) => {
  console.error("Session failed:", err);
  process.exit(1);
});