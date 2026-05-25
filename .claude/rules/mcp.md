---
globs: src/**, .claude/**, scripts/**
---

# MCPs + Terminal + Debug Discipline (Tier 2 — Auto-loaded)

> Canonical for external tool servers + runtime command discipline + debug loop.
> Stack-specific values (package manager, framework name) resolve from `.claude/config.json::tooling`.

## MCP servers (active in this project)

| Question type | MCP `serverIdentifier` / tool |
|---|---|
| Library / framework docs (current project stack — see `config.json::project.stackSummary`) | `mcp__claude_ai_Context7__resolve-library-id` → `mcp__claude_ai_Context7__query-docs` |
| Best practices, CVEs, ecosystem news (always include year + version) | `mcp__tavily__search` |
| Multi-step decomposition on L4+ ambiguous problems | `mcp__sequential-thinking__sequentialthinking` |
| UI verification (lock → act → unlock) | `cursor-ide-browser` |
| shadcn/ui component patterns | `user-shadcn` |

**Never use codebase Grep as the first step for external library questions** — Context7 + Tavily first. Training data is stale.

**Don't introduce MCP servers for purely local ops** (git, build, file reads — use Bash + Read tools). **Don't add MCP servers for layers this project doesn't have** (e.g., no database / payments MCP when `config.json::tooling.database` is empty).

## Terminal execution

- **POSIX shell + forward slashes** in paths regardless of host OS. Never wrap in `wsl`, `cmd /c`, or any OS-specific launcher. Bash is available even on Windows hosts.
- **Always include a timeout** (default 120 s, max 600 s). Prefer non-interactive, self-terminating commands.
- **Non-interactive mandatory:** `git commit -m "..."` (never editor), `git log -n N`, `git diff --stat`, `gh --yes`. Prefix `GIT_TERMINAL_PROMPT=0` when git auth might prompt.
- **Never pipe `2>&1 | tail/head/grep`** to capture output — breaks exit-code detection. Use `; echo "EXIT=$?"` and filter separately.
- **Stuck command** (running > 3× expected): check status; if shell prompt visible → done; if waiting for input → terminate + re-run with corrected non-interactive flags.
- **Use the project's declared package manager only** (`config.json::tooling.packageManager` — currently `bun` for gpus-site → `bun install` / `bun run` / `bunx`). Never use `npm` / `yarn` / `pnpm` when another PM is declared. Cardinal rule.
- **Never `--no-verify`** unless explicitly requested.

## Debug on error

```
PAUSE  → stop. don't retry the same command blindly.
THINK  → invoke mcp__sequential-thinking__sequentialthinking:
         1) what happened?
         2) root cause hypothesis?
         3) 3 candidate fixes + their trade-offs?
HYPOTHESIZE → formulate fix + validation plan (which command proves it works).
EXECUTE → apply fix only after understanding cause.
```

**Two consecutive fix attempts on the same hypothesis fail → invoke `/debug recover`** (per `.claude/CLAUDE.md § Stopping conditions`). Never retry > 3 times on the same hypothesis.

## When to load more

| Need | Load |
|---|---|
| Commands + skill phase ordering | `.claude/rules/commands.md` |
| Commit format + manual gate | `.claude/rules/commit.md` |
| Universal stability + anti-patterns | `.claude/rules/stability.md` |
| Stack invariants (current: Astro) | `.claude/rules/astro.md` |
| Cardinal rules + routing | `.claude/CLAUDE.md` + `AGENTS.md` |
