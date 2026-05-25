---
globs: .claude/**
---

# Slash Commands + Skill Phase Ordering (Tier 2 — Auto-loaded)

> Canonical for `/...` commands and the order in which skills are invoked.
> Project-specific skill names resolve from `.claude/config.json::skills`.

## Commands (`.claude/commands/`)

11 invokable commands (`_shared.md` is boilerplate, not invokable). Each reads `.claude/config.json` at start.

| Command | When to invoke |
|---|---|
| `/plan [task]` | Any L3+ task before code. Uses `Skill('planning')`. |
| `/prime [auto\|frontend]` | Start of cross-domain or unclear-scope task. Loads minimum-viable context. |
| `/research [question]` | External knowledge gap or pattern lookup. Uses `Context7` + `Tavily` MCPs. |
| `/design [task]` | New UI page or component (Phase 0 spec → Phase 2 convert → Phase 3 validate). |
| `/implement [plan-path]` | Execute approved plan. |
| `/debug [audit\|frontend\|recover]` | Any error, crash, regression. |
| `/perf [build]` | Performance issue (default = runtime Lighthouse / PSI). `db` mode skipped when `config.json::tooling.database` is empty. |
| `/verify [quick\|spec-only\|paranoid]` | Post-implementation gate before merge. |
| `/evolve [auto\|handoff]` | Post-task learning capture + autoresearch loop. |
| `/delegate` | Hand task to specialist agent (7-section protocol). |
| `/recover` | Failure recovery after 2+ failed fix attempts. |

**Skip commands for L1–L2 trivial fixes** — direct edit faster than command overhead.

## Skill phase ordering

`Skill('<name>')` invocation order — **always process first, implementation last**. Even 1% relevance match = invoke.

| Phase | Skills (resolved from `config.json::skills`) |
|---|---|
| **Process** (preload via agent `skills:` frontmatter) | `senior-prompt-engineer`, `planning`, `evolution-core`, `debugger` |
| **Tech-stack** (auto-trigger via description match) | `config.json::skills.stack` (currently `astro`) |
| **Project** (brand SSOT) | `config.json::skills.theme` + `config.json::skills.brand` (currently `gpus-theme`, `grupo-us`) |
| **Implementation** (load last) | `ui-ux-pro-max`, `frontend-design` (plugin), `imagegen-frontend-web`, `impeccable`, `performance-optimization`, `brandkit`, `skill-creator` |

Agent ↔ skill preload assignments → `Skill('senior-prompt-engineer')` → `SKILL.md § 8`.

## Agent ↔ skill default pairings (L3+ MUST spawn)

| Skill loaded | Paired agent | Spawn when |
|---|---|---|
| `debugger` | `debugger` | L3+ bug / crash / regression |
| `performance-optimization` | `performance-optimizer` | L3+ perf / bundle / Lighthouse |
| `config.json::skills.theme` | `frontend-specialist` | L3+ UI / page / component |
| `config.json::skills.stack` | `frontend-specialist` | L3+ stack-specific files (Astro components, Content Collections, hydration directives) |
| `planning` | `project-planner` | L4+ plan handoff (auto-handoff at finalization) |
| `verification-before-completion` | `verification-agent` | L3+ pre-merge gate |
| (any L3+ unclear scope) | `explorer-agent` + `librarian` (parallel, **background**) | L3+ unclear scope |

Read-only research agents (`explorer-agent`, `librarian`) **MUST** use `run_in_background: true`.

## Stopping conditions

- Max **3 fix attempts** on same hypothesis → escalate to `evaluator` Mode 3 + `/debug recover`.
- Max **5 agent spawns per request** → checkpoint with user.
- 2 consecutive failures of same approach → invoke `/recover`.

Full detail: `.claude/CLAUDE.md § Stopping conditions`.

## When to load more

| Need | Load |
|---|---|
| MCP / terminal / debug loop | `.claude/rules/mcp.md` |
| Commit format + gate checklist | `.claude/rules/commit.md` |
| Stack invariants (current: Astro) | `.claude/rules/astro.md` |
| Cardinal rules + routing matrix | `.claude/CLAUDE.md` + `AGENTS.md` |
