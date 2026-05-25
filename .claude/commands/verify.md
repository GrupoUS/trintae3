---
description: Post-implementation verification gate. Runs gates → /debug → /perf → E2E → spec → codex review → codex adversarial → evaluator Mode 3 → report → /evolve. Codex review + adversarial review are MANDATORY in every mode (Iron Law — cannot be skipped). Modes (positional arg) — default: full (10 phases) · quick: gates + /debug + spec + codex review + codex adversarial · spec-only: plan compliance + codex review + codex adversarial · paranoid: force all phases regardless of touched surface.
workflow_type: prompt-chaining
---

# /verify — Post-Implementation Verification Gate

**ARGUMENTS**: $ARGUMENTS

> Sequential verification pipeline. Each phase gates the next. Failure escalates per `_shared.md` and `debug.md` § 8.
>
> First positional arg = mode. `/verify`, `/verify quick`, `/verify spec-only`, `/verify paranoid`.

---

## Stopping Conditions

- STOP if Phase 0 gates fail → fix gates first, do not proceed
- STOP after `/debug` returns unresolved findings → invoke `/debug recover`
- STOP after `/perf` regresses past WARN threshold → invoke `/debug recover`
- STOP if Phase 3.5 E2E surfaces JS console errors or critical network failures → invoke `/debug frontend`
- STOP if Phase 5 codex review returns P0/P1 findings → present via `codex:codex-result-handling`, ask which to fix
- STOP if Phase 6 codex adversarial returns P0/P1 design challenges → present, ask user before Phase 7
- STOP if Phase 7 evaluator Mode 3 returns `REVISION_REQUIRED` → invoke `/debug recover`
- STOP if Phase 8 finds **session-scoped** uncommitted files AND `git diff main...HEAD` is empty (nothing committed to verify against)
- Sibling worktrees and pre-existing dirty files (recorded in session baseline) are **informational only** — never block the verdict
- STOP and ASK user if Phase 1 cannot locate a plan file and no `$ARGUMENTS` given
- STOP after 2 consecutive verify failures on same diff → reactive escalation to evaluator Mode 3
- STOP if scope drift introduces auth, payment, PII, or schema changes not in the plan → confirm with user before VERIFIED
- Phase 9 `/evolve` only runs if final verdict is `VERIFIED` or `VERIFIED-WITH-NOTES`

---

## 0. Mode selection

Parse first positional token from `$ARGUMENTS`:

| Mode | Aliases | Behavior |
|---|---|---|
| `full` (default) | — | All 10 phases. Smart gating skips irrelevant phases by touched-surface signals. Phases 5 + 6 always run. |
| `quick` | `q`, `fast` | Skip Phases 3, 3.5, 7, 9 — gates + /debug + spec + **Phase 5 + Phase 6 (mandatory)** |
| `spec-only` | `spec`, `compliance` | Phase 1 + Phase 4 + **Phase 5 + Phase 6 (mandatory)** |
| `paranoid` | `release`, `pre-pr` | Force ALL phases regardless of touched surface |

`$ARGUMENTS` also accepts:

| Arg shape | Meaning |
|---|---|
| `<path>` ending in `.md` | Use that file as the plan |
| `latest` | Pick newest `.md` under `docs/` (default if no arg) |
| `+codex` | No-op (Phase 5 always runs per Iron Law) — accepted for backwards compat |
| `+adversarial` | No-op (Phase 6 always runs per Iron Law) — accepted for backwards compat |
| `+evaluator` | Force Phase 7 even in `quick`/`spec-only` |
| `+e2e` | Force Phase 3.5 even when no frontend change detected |
| `--no-evolve` | Skip Phase 9 |

---

## Iron Law

```
NO "VERIFIED" VERDICT WITHOUT EVIDENCE FOR EVERY PHASE THAT RAN.
NO "VERIFIED" VERDICT WHILE CURRENT-SESSION WORK IS UNCOMMITTED.
PHASE 5 (/codex:review) NEVER SKIPPED, REGARDLESS OF MODE.
PHASE 6 (/codex:adversarial-review) NEVER SKIPPED, REGARDLESS OF MODE.
SCOPE DRIFT MUST BE REPORTED, NOT HIDDEN.
PHASE 9 (/evolve) NEVER RUNS ON NEEDS-WORK / FAILED.
```

If any phase did not produce a checkable artifact when it was supposed to run, verdict is `NEEDS-WORK` — never assume green. `/verify` is scoped to the current Claude Code session: dirty files pre-existing at session start (recorded in `.claude/logs/sessions/<id>.baseline.json`) and sibling worktrees on other branches are **informational only** and never block the verdict. Only session-scoped uncommitted work blocks `VERIFIED` — and only when no committed work exists on the branch to verify against.

---

## 1. First action — context + skills + gates

### 1.0 Context load (WISC)

Per `_shared.md` § 4. Auto-detect from changed file paths (read `.claude/config.json` for `${paths.frontendRoot}` / `${paths.backendRoot}`):

- `${paths.frontendRoot}/**` only → `/prime frontend`
- `${paths.backendRoot}/**` only → `/prime backend`
- Multi-layer → `/prime fullstack`

```typescript
Skill("superpowers:using-superpowers");                  // meta — bootstrap (per _shared.md § 0.5)
Skill("superpowers:verification-before-completion");     // gate every PASS claim with stdout + exit code
Skill("superpowers:systematic-debugging");               // 4-phase rigor for Phase 2
Skill("superpowers:requesting-code-review");             // wraps Phase 5 codex:review (BASE/HEAD SHA + description)
Skill("superpowers:receiving-code-review");              // Phase 5.5 — technical evaluation of feedback
Skill("superpowers:using-git-worktrees");                // Phase 8 worktree closure
Skill("superpowers:finishing-a-development-branch");     // Phase 10 — merge/PR/keep/discard menu

Skill("debugger");          // NeonDash anti-pattern catalog (for Phase 2)
Skill("evolution-core");    // for Phase 9 (/evolve)
// Phases 5 + 6 use codex-plugin-cc slash commands directly (`/codex:review`,
// `/codex:adversarial-review`). Do NOT preload `Skill("codex:rescue")` —
// the slash commands handle routing themselves.
```

### 1.1 Quality gates (canonical)

Per `_shared.md` § 1. Resolve commands from `${tooling.*}` config.

```bash
${tooling.packageManager} run ${tooling.typeChecker} 2>&1 | tail -30
${tooling.packageManager} run lint 2>&1 | tail -20
```

These are **Phase 0**. Failure here blocks all further phases.

### 1.2 Gate function (Skill: `superpowers:verification-before-completion`)

Apply at end of every phase that emits a PASS row. No exceptions.

1. **IDENTIFY** — name the exact command that proves the claim
2. **RUN** — execute the FULL command in this turn (no cached output)
3. **READ** — full stdout + exit code, count failures
4. **VERIFY** — output matches claim? if NO → state actual status with evidence; if YES → state claim WITH evidence
5. **CLAIM** — only after step 4 passes

If the verification command did not run in this turn, the row is `UNVERIFIED` not `PASS`.

---

## 2. Phase 0 — gates baseline

`Skill("superpowers:verification-before-completion")` is the discipline here: every PASS row below requires the captured stdout + exit code, not a glance at the diff.

| Check | Command | Pass condition |
|---|---|---|
| Type-check | `${tooling.packageManager} run ${tooling.typeChecker}` | exit 0, 0 errors |
| Lint | `${tooling.packageManager} run lint` | exit 0 |
| Formatter (touched files) | `${tooling.linter} check <touched-files>` | exit 0 |

Each row above is gated by § 1.2 (verification-before-completion). The command listed IS the evidence; "PASS" without captured stdout + exit code is `UNVERIFIED`, treated as FAIL for stop logic.

If FAIL → STOP. Surface exact error. Do NOT continue. Suggest user fix gates first.

In `spec-only` mode, skip Phase 0 entirely.

---

## 3. Phase 1 — resolve inputs

### 3.1 Locate the plan

```bash
# Explicit arg path
test -f "$ARG_PATH" && PLAN="$ARG_PATH"

# Or "latest" → newest plan-style file under docs/
[ -z "$PLAN" ] && PLAN=$(ls -t docs/*.md 2>/dev/null | head -1)
```

If still no plan → ASK user (do not silently fall back to prompt-only).

### 3.2 Extract requirements

Read the plan file. Pull:
- **Context** section — what problem is being solved
- **Approach / Critical Files** — what was supposed to change
- **Verification** section — how the change should be tested
- Any explicit acceptance criteria, checklists, numbered requirements

Read the **original user prompt** from current conversation. Combine with plan extracts to build the compliance checklist:

```
[ ] R1 — <requirement, paraphrased exactly from source>
[ ] R2 — ...
```

### 3.3 Enumerate actual changes + risk signals

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
git diff main...HEAD --name-only
git status --short --branch
git diff --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard

# Risk signals — feed Phase 3.5 / 6 / 7 routing
TOUCHED_FRONTEND=$(git diff main...HEAD --name-only | grep -c "^${paths.frontendRoot}/" || echo 0)
TOUCHED_BACKEND=$(git diff main...HEAD --name-only | grep -c "^${paths.backendRoot}/" || echo 0)
TOUCHED_SCHEMA=$(git diff main...HEAD --name-only | grep -c "^${paths.schemaRoot}/" || echo 0)
TOUCHED_AUTH=$(git diff main...HEAD --name-only | grep -E '(auth|session|webhook|rls|policy)' | wc -l)
TOUCHED_PAYMENT=$(git diff main...HEAD --name-only | grep -E '(stripe|asaas|kiwify|hubla|billing|payment|pix)' | wc -l)
TOTAL_LINES=$(git diff main...HEAD --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)
TOTAL_FILES=$(git diff main...HEAD --name-only | wc -l)
```

Cache the file list and counters for Phases 2, 3, 3.5, 4, 6, 7.

If `git status --short` is non-empty, keep those paths in a separate `WORKTREE_PENDING` list. They are not evidence of implementation in `main...HEAD` until they are committed to the current branch.

---

## 4. Phase 2 — `/debug` (sequential)

> Skip in `spec-only` mode.

**Agent:** `debugger`. **Skill:** `debugger` (loaded in 1.0). `/debug` itself spawns the agent — do not double-spawn.

Auto-pick `/debug` mode from changed file paths:

| Changed surface | Mode | Sub-agents |
|---|---|---|
| Frontend only | `/debug frontend` | per `debug.md` § 3 |
| Backend (no schema) | `/debug backend` | code-archaeologist + regression-hunter |
| Schema / auth / RLS | `/debug auth-db` | + db-state-inspector |
| Mixed | `/debug` (default) | per `debug.md` § 1 complexity routing |

Run inline. Block until returns. Foreground because `debugger` writes fixes (per `_shared.md` § 3).

### Pass condition

**Gate (§ 1.2):** Re-run `${tooling.packageManager} run ${tooling.typeChecker}` + lint at the end of `/debug` regardless of what `/debug` claims internally. PASS requires fresh exit-0 from THIS turn, not a status echoed by the agent.

- All quality gates re-run by `/debug` are green
- No unresolved findings in `/debug` Findings Table
- All applied fixes themselves passed gates

### Fail handling

`/debug` reports unresolved root cause OR applied fixes failed gates 2× → STOP → invoke `/debug recover`.

Capture for report: mode used, fixes applied (file:line), final gate output.

---

## 5. Phase 3 — `/perf` (sequential)

> Skip in `spec-only` and `quick` modes.

**Agent:** `performance-optimizer`. **Skill:** `performance-optimization`. `/perf` spawns one agent per failing route — do not double-spawn.

Auto-pick `/perf` mode by changed surface:

| Changed surface | Mode | Threshold |
|---|---|---|
| Frontend route | runtime PSI on `${project.stagingUrl}` | Performance ≥ `${gates.lighthouse.performance}` |
| Backend / DB queries | `db` | No new N+1, no missing FK index, no new SELECT * |
| Build config / deps | `build` | Build time ≤ baseline + 10%, total JS ≤ baseline |
| Mixed | runtime + db | Both must pass |

### Thresholds (from config gates)

```yaml
performance:    pass: ${gates.lighthouse.performance}, warn: 50
accessibility:  pass: ${gates.lighthouse.accessibility}, warn: 70
best-practices: pass: ${gates.lighthouse.bestPractices}, warn: 70
seo:            pass: ${gates.lighthouse.seo}, warn: 80
CWV:            LCP ${gates.lcp}ms | CLS ${gates.cls} | INP ${gates.inp}ms
```

### Fail handling

**Gate (§ 1.2):** PASS row requires the captured PSI / db-audit / build-stat output in this turn. A score reported by the spawned `performance-optimizer` agent without the stdout pasted into the verify report is `UNVERIFIED`.

Score below WARN OR new N+1 introduced OR FK index missing → STOP → `/debug recover`.
Score in WARN band → record as `WARN`, continue, flag in final report.

---

## 6. Phase 3.5 — E2E browser (verification)

> Skip in `quick` and `spec-only` modes.
> In `full`: only when `TOUCHED_FRONTEND > 0` (or `+e2e` flag passed).
> In `paranoid`: always run.

**Agent:** `verification`. **Tools:** Bash (invokes `bunx agent-browser`). **Foreground.**

### Invocation

```typescript
Agent({
  description: "E2E verify on staging",
  subagent_type: "verification",
  prompt: `Verify the user flow affected by the diff on ${project.stagingUrl}.

Diff summary: <N files in frontend, key routes from Phase 1.3>
Plan acceptance criteria: <copy from Phase 1.2 checklist>

Pre-flight: \`bunx agent-browser --version\` — STOP if it fails.

For each affected route:
1. \`bunx agent-browser open <route-url>\`
2. \`bunx agent-browser snapshot -i -c\` + \`bunx agent-browser screenshot .claude/logs/<flow>.png\`
3. \`bunx agent-browser console\` — flag any error-level message
4. \`bunx agent-browser errors\` — flag any uncaught page error
5. \`bunx agent-browser network requests --filter "api-staging"\` — flag unexpected 4xx/5xx on XHR; allow \`auth.me\` 401 only on public unauthenticated routes
6. Run the golden-path interaction described in the plan (snapshot before each ref-based action — refs go stale)
7. Run one realistic edge case (empty state, permission denial, network slow)
8. \`bunx agent-browser close --all\` after the last flow

Return: PASS/FAIL per route + screenshot path + console.errors[] + page.errors[] + network.failures[]. Under 800 tokens.`
});
```

### Pass condition

**Gate (§ 1.2):** Each PASS row requires the agent-browser stdout (snapshot + console + errors + network filter) in the captured evidence. Screenshot path alone is insufficient.

- No JS console errors
- No unexpected 4xx/5xx on critical XHR / API calls
- Screenshot matches expected layout

### Fail handling

JS error OR critical network failure → STOP → invoke `/debug frontend` with captured evidence.

---

## 7. Phase 4 — Spec compliance + scope drift

Walk the compliance checklist from Phase 1.3. For each requirement, search diff for evidence:

```bash
git diff main...HEAD -- <plan-cited-file> | grep -n "<expected-symbol>"
```

Mark each:

| Symbol | Meaning |
|---|---|
| ☑ | Implemented — evidence at `path:line` |
| ☐ MISSING | No evidence in diff |
| ⚠ PARTIAL | Some evidence but not complete |

### Plan-verification cross-check

If plan has `## Verification` section listing test steps, walk each. Mark whether actually executable post-diff (file exists, command runs).

### Scope drift detection

```
DRIFT = files in `git diff --name-only` NOT cited in plan AND NOT cited in original prompt
```

Classify drift risk:

```
SET DRIFT_RISK =
  "auth"    if any drift file matches /(auth|session|webhook|rls|policy)/
  "payment" if matches /(stripe|asaas|kiwify|hubla|billing|payment|pix)/
  "PII"     if matches /(users|customers|leads).*(\.ts|\.tsx)$/ AND new fields added
  "schema"  if any drift file under ${paths.schemaRoot}
  "env"     if any drift file matches /\.env|env\.ts|config\.ts/
  "ci"      if any drift file under .github/workflows/
  "none"    otherwise
```

`DRIFT_RISK ≠ none` feeds Phase 6 (focus) and Phase 7 (gating). Surface drift in report regardless. If drift includes any of: schema, auth, payment, env, CI → escalate (confirm with user before VERIFIED).

If `.claude/rules/verify-supplements.md` exists, also run the project-specific smoke tests it lists (e.g., webhook idempotency, RLS anon deny).

---

## 7.5 Phase 5.0 — Code review prep

`Skill("superpowers:requesting-code-review")` enforces five inputs before the Codex dispatch fires. Build and surface this bundle BEFORE running any `/codex:review` variant:

| Field | Source | Required value |
|---|---|---|
| `BASE_SHA` | `git merge-base main HEAD` | non-empty 40-char hex |
| `HEAD_SHA` | `git rev-parse HEAD` | non-empty 40-char hex |
| `DESCRIPTION` | Phase 1.2 plan extract + Phase 1.3 diff stat | 1–3 sentence summary of what was built |
| `PLAN_OR_REQUIREMENTS` | Phase 1.1 plan path (or "(none — prompt only)") | absolute path or sentinel |
| `FOCUS` | `DRIFT_RISK` from Phase 4 + risk signals from Phase 1.3 | auth / payment / PII / schema / env / ci / "general" |

Surface the bundle inline before Phase 5 fires:

```text
Code review bundle:
  BASE_SHA             = <sha>
  HEAD_SHA             = <sha>
  DESCRIPTION          = <text>
  PLAN_OR_REQUIREMENTS = <path|sentinel>
  FOCUS                = <focus_token(s)>
```

If any field is unresolvable (missing plan, detached HEAD, empty diff), STOP and ask user instead of dispatching with placeholders. Placeholder dispatch is the failure mode this gate prevents.

---

## 8. Phase 5 — `/codex:review`

> **Runs in EVERY mode (`full`, `quick`, `spec-only`, `paranoid`). Cannot be skipped.**
> The `+codex` arg is accepted as a no-op for backwards compatibility — it does not enable anything additional.
> Per Iron Law: `PHASE 5 (/codex:review) NEVER SKIPPED, REGARDLESS OF MODE.`

**Runtime:** codex-plugin-cc slash command `/codex:review`. Do **not** spawn the `codex:codex-rescue` subagent or load `Skill("codex:rescue")` from /verify.

`Skill("superpowers:requesting-code-review")` is the wrapper here: before firing the slash command, capture the **BASE SHA**, **HEAD SHA**, **summary of change**, and the explicit reviewer focus (auth / payment / PII / schema / etc.). The skill enforces those inputs so the review has the context it needs.

### Pattern

```bash
# Phase 5.0 bundle (BASE_SHA, HEAD_SHA, DESCRIPTION, PLAN_OR_REQUIREMENTS, FOCUS)
# must be surfaced in the message BEFORE this command runs.
BASE_SHA=$(git merge-base main HEAD)
HEAD_SHA=$(git rev-parse HEAD)
/codex:review --base "$BASE_SHA" --head "$HEAD_SHA" --background \
  --focus "$FOCUS" --description "$DESCRIPTION" --plan "$PLAN_OR_REQUIREMENTS"
# Capture session ID for later /codex:result lookup
```

If `/codex:review` does not accept `--focus / --description / --plan` flags in the local plugin version, embed the Phase 5.0 bundle inside the prompt body the slash command opens. The bundle must reach the reviewer one way or another.

In `full` mode, allow Phase 6 + Phase 7 to run while Codex review is in flight. Collect via `/codex:result <session-id>` before Phase 8 synthesis.

### Direct-Bash fallback (when slash command unavailable)

```bash
PLUGIN_ROOT=$(ls -dt "$HOME/.claude/plugins/cache/openai-codex/codex/"*/ 2>/dev/null | head -1)
node "${PLUGIN_ROOT}scripts/codex-companion.mjs" review --base main --background
```

### Windows pwsh sandbox quirk (Codex 0.125+)

On Windows, Codex's sandbox shells through MS-Store `pwsh.exe` and intermittently returns `exit -1` for routine command lookups. Mitigation: always pre-paste relevant diff hunks or file excerpts into the focus text so Codex doesn't have to shell out.

### Findings classification

| Codex severity | Internal mapping | Verdict effect |
|---|---|---|
| P0 (critical) | `NEEDS-WORK` | STOP, ask user which to fix |
| P1 (important) | `NEEDS-WORK` | STOP, ask user |
| P2 (moderate) | `VERIFIED-WITH-NOTES` | Continue, log in report |
| P3 (minor) | `VERIFIED-WITH-NOTES` | Continue, log in report |
| no findings | `VERIFIED` | Continue clean |

Present findings via `codex:codex-result-handling` — do NOT auto-fix.

### Phase 5.5 — Receiving code review (technical evaluation)

When Phase 5 (or any reviewer) returns P0/P1 findings, **before** deciding to implement them or push back, invoke `Skill("superpowers:receiving-code-review")`. The skill enforces technical evaluation of each finding: implement (the feedback is correct), clarify (the feedback is unclear — ask), or pushback (the feedback is technically wrong — explain why). Blind agreement and blind disagreement are both anti-patterns.

Apply per finding:

| Decision | Trigger | Action |
|---|---|---|
| Implement | Finding is technically correct + fix is in scope | Add to fix list, surface to user |
| Clarify | Reviewer note is ambiguous | Ask the reviewer (or user) the specific question |
| Pushback | Finding misreads the code or contradicts a documented constraint | Document the counter-argument; surface to user with citation |

Do not silently dismiss a P0/P1 finding. Decision must be visible in the verdict report.

---

## 9. Phase 6 — `/codex:adversarial-review`

> **Runs in EVERY mode (`full`, `quick`, `spec-only`, `paranoid`). Cannot be skipped.**
> The `+adversarial` arg is accepted as a no-op for backwards compatibility — it does not enable anything additional.
> Per Iron Law: `PHASE 6 (/codex:adversarial-review) NEVER SKIPPED, REGARDLESS OF MODE.`

**Runtime:** codex-plugin-cc slash command `/codex:adversarial-review`. Same fallback + Windows quirk as Phase 5.

### Focus calculation

Use `DRIFT_RISK` from Phase 4 + risk signals from Phase 1.3:

| Signal | Focus text |
|---|---|
| `DRIFT_RISK = auth` OR `TOUCHED_AUTH > 0` | "security boundary, token lifecycle, session invalidation, data leakage paths" |
| `DRIFT_RISK = payment` OR `TOUCHED_PAYMENT > 0` | "idempotency, webhook replay, double-charge race, refund correctness" |
| `DRIFT_RISK = PII` | "data exposure, query scope, response shape leakage, log redaction" |
| `DRIFT_RISK = schema` OR `TOUCHED_SCHEMA > 0` | "data migration safety, FK invariants, soft-delete consistency, NOT NULL backfill" |
| `DRIFT_RISK = env` OR `ci` | "secret exposure, build determinism, deploy reproducibility" |
| else | "design tradeoffs, alternative approaches, failure modes, race conditions" |

### Pattern

```bash
/codex:adversarial-review --scope working-tree --background "Focus: <focus_text>. Question the chosen implementation. Surface failure modes, race conditions, alternative simpler approaches. Report findings only — do not apply fixes."
```

### Pass condition

Zero P0/P1 design challenges, OR all P0/P1 acknowledged by user as accepted tradeoff.

### Fail handling

P0/P1 → STOP → present via `codex:codex-result-handling` → ask user before Phase 7. **NEVER auto-fix from adversarial review.**

---

## 10. Phase 7 — evaluator Mode 3 (proactive)

> Skip in `quick` and `spec-only` (override with `+evaluator`).
> In `full`: gated by triggers below.
> In `paranoid`: always run.

### Triggers in `full` mode (any of)

- `TOUCHED_SCHEMA > 0`
- `TOUCHED_AUTH > 0`
- `TOUCHED_PAYMENT > 0`
- `DRIFT_RISK ≠ none`
- Phase 5 OR Phase 6 returned P0/P1 AND user said "continue"
- `TOTAL_LINES > 500` OR `TOTAL_FILES > 15`

If none → skip Phase 7 in `full`.

**Agent:** `evaluator` Mode 3. **Foreground.** No file writes (Mode 3 hard constraint).

### Invocation

```typescript
Agent({
  description: "Pre-verdict architecture analysis",
  subagent_type: "evaluator",
  prompt: `Mode 3: Architecture Analysis (proactive pre-verdict consultation).

Diff summary: <Phase 1.3 stat output>
Plan: <plan path or "none">
Risk signals: schema=<bool>, auth=<bool>, payment=<bool>, drift=<DRIFT_RISK>

Codex review findings (Phase 5): <P0/P1/P2 list or "clean">
Codex adversarial findings (Phase 6): <P0/P1 list or "clean">

Tasks:
1. Frame the architectural problem this diff solves (1 paragraph)
2. List 2 alternative approaches that were not taken
3. Multi-lens evaluation (technical / economic / human / systemic / temporal)
4. Adversarial inversion: "what would make this diff a regression in 6mo?"
5. Second-order effects (6mo / 2yr / 10yr)
6. Confidence calibration on the chosen approach
7. Synthesis: APPROVED / REVISION_REQUIRED + 1-line reason

Hard constraint: analysis only, no file writes, no code generation. Under 300 tokens.`
});
```

### Pass condition

`APPROVED` verdict.

### Fail handling

`REVISION_REQUIRED` → STOP → invoke `/debug recover`.

---

## 11. Phase 8 — Worktree closure + verification report + verdict

### 8.0 Worktree closure gate (session-scoped)

`Skill("superpowers:using-git-worktrees")` carries the generic worktree discipline. The checks below are NeonDash-specific and **scoped to the current Claude Code session**.

Run this immediately before composing the report, after every preceding phase that can write files (`/debug`, `/perf`, or manual fixes). The gate distinguishes **session-scoped** uncommitted work (must be committed before VERIFIED) from **pre-existing / unrelated** dirty state (informational only). If Phase 9 (`/evolve`) later writes files, rerun this gate before the final response.

#### Baseline resolution

```bash
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_TOP=$(git rev-parse --show-toplevel)

# Session baseline written by .claude/hooks/session_baseline.py at SessionStart.
# Format: { session_id, started_at, branch, head_sha, preexisting_dirty[] }
SESSION_ID="${CLAUDE_SESSION_ID:-}"
BASELINE_FILE=".claude/logs/sessions/${SESSION_ID}.baseline.json"

if [ -n "$SESSION_ID" ] && [ -f "$BASELINE_FILE" ]; then
  BASELINE_MODE="present"
  # Extract preexisting_dirty[] via python stdlib (jq not guaranteed cross-platform):
  PREEXISTING_DIRTY=$(python -c "import json,sys;d=json.load(open('$BASELINE_FILE'));print('\n'.join(d.get('preexisting_dirty',[])))" 2>/dev/null || echo "")
else
  BASELINE_MODE="fallback"
  PREEXISTING_DIRTY=""
fi
```

If `BASELINE_MODE=fallback`, the gate runs without a session baseline (e.g., session predates the hook). Result: cannot distinguish pre-existing dirty from session-introduced dirty — treat ALL current dirty as session-scoped, but **still** never block on sibling worktrees or detached HEAD-only cases.

#### Current state

```bash
git status --short --branch
git diff --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard

# All currently dirty paths in current worktree (single list)
CURRENT_DIRTY=$(git status --porcelain | awk 'NF{$1=""; sub(/^ +/,""); if($0 ~ / -> /){sub(/.* -> /,"")} print}')

# Committed scope of this verify run
COMMITTED_SCOPE=$(git diff main...HEAD --name-only)
```

Session-scope partitioning:

```text
SESSION_DIRTY   = CURRENT_DIRTY  -  PREEXISTING_DIRTY    (set difference)
UNRELATED_DIRTY = CURRENT_DIRTY  ∩  PREEXISTING_DIRTY
```

#### Sibling worktrees (log-only)

```bash
git worktree list --porcelain | awk '/^worktree /{sub(/^worktree /,""); print}' > /tmp/neondash-verify-worktrees.txt
SIBLING_DIRTY=""
while IFS= read -r WT; do
  [ "$WT" = "$CURRENT_TOP" ] && continue
  WT_BRANCH=$(git -C "$WT" branch --show-current 2>/dev/null || true)
  WT_STATUS=$(git -C "$WT" status --short 2>/dev/null || true)
  if [ -n "$WT_STATUS" ]; then
    SIBLING_DIRTY="${SIBLING_DIRTY}path=${WT} branch=${WT_BRANCH}\n"
  fi
done < /tmp/neondash-verify-worktrees.txt
```

Sibling worktree dirty state is **always log-only**. It is reported in the verify report under "Unrelated sibling worktrees (logged)" but **never blocks the verdict** — those changes belong to another Claude Code session or another branch and are explicitly out of scope per the session-scoping policy.

#### Verdict logic (per condition)

| `COMMITTED_SCOPE` | `SESSION_DIRTY` | Verdict effect | Reason |
|---|---|---|---|
| non-empty | empty | **PASS** | nothing stranded |
| non-empty | non-empty | **VERIFIED-WITH-NOTES** | session work uncommitted but commits exist; list paths in report; do NOT downgrade to NEEDS-WORK |
| empty | non-empty | **NEEDS-WORK** | nothing committed yet — user must commit before claiming VERIFIED |
| empty | empty | **PASS** | clean and nothing to verify on branch (Phase 4 may still flag missing-evidence) |

Always log-only (never affect verdict):

- `UNRELATED_DIRTY` (matched the SessionStart baseline)
- `SIBLING_DIRTY` (any other worktree, any branch)

Detached HEAD remains a **NEEDS-WORK** condition — without a named branch there is no anchor to verify against. This is the only worktree-related hard fail that survives the session-scoping relaxation.

If `git status` fails because of `safe.directory`, rerun with `git -c safe.directory="$CURRENT_TOP"`; do not skip the gate.

Never auto-commit, stash, clean, reset, or delete worktree files from `/verify` unless the user explicitly asked for that action in the current conversation.

### 8.1 Verification report

Use the verdict matrix template from `_shared.md` § 9. Produce one consolidated report:

```markdown
## /verify Report — <YYYY-MM-DD HH:MM>

### Inputs
- Plan: <path | "(none — prompt only)">
- Original ask: <one-line summary>
- Diff: <N files, +X / -Y lines>
- Mode: full | quick | spec-only | paranoid
- Risk signals: schema=<bool> auth=<bool> payment=<bool> drift=<DRIFT_RISK>
- Code review bundle (Phase 5.0): BASE=<sha> HEAD=<sha> FOCUS=<token>

### Phase 0 — Gates
- type-check / lint / formatter: PASS / FAIL each
- Gate evidence (§ 1.2): <command run this turn> → exit <code> → <one-line outcome>

### Phase 2 — /debug
- Mode: <debug | frontend | backend | auth-db | SKIPPED>
- Fixes applied: <count> @ <files>
- Findings open: <count>
- Gate evidence (§ 1.2): <command run this turn> → exit <code> → <one-line outcome>
- Status: PASS / FAIL / SKIPPED

### Phase 3 — /perf
- Mode: <runtime | db | build | mixed | SKIPPED>
- Scores: Perf XX | A11y XX | BP XX | SEO XX
- CWV: LCP X.Xs | CLS X.XX | INP Xms
- DB: N+1 <none|found> | FK index gaps <count> | SELECT * <count>
- Gate evidence (§ 1.2): <command run this turn> → exit <code> → <one-line outcome>
- Status: PASS / WARN / FAIL / SKIPPED

### Phase 3.5 — E2E browser
- Routes tested: <N>
- Console errors: <count>
- Network failures: <count>
- Screenshots: <paths>
- Gate evidence (§ 1.2): <agent-browser stdout summary captured this turn>
- Status: PASS / FAIL / SKIPPED

### Phase 4 — Spec Compliance
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | <text> | ☑ | path:line |

- Scope drift: <list of drifted files | "(none)">
- DRIFT_RISK: <auth | payment | PII | schema | env | ci | none>

### Phase 5 — /codex:review
- Findings: P0=<n> P1=<n> P2=<n> P3=<n>
- Session ID: <id>
- Status: PASS / WITH-NOTES / FAIL / SKIPPED

### Phase 6 — /codex:adversarial-review
- Focus: <focus_text>
- P0/P1 challenges: <count + 1-line summaries>
- Status: PASS / FAIL / SKIPPED

### Phase 7 — evaluator Mode 3
- Triggers fired: <list>
- Verdict: APPROVED / REVISION_REQUIRED / SKIPPED
- Key finding: <one-liner>

### Phase 8 — Worktree Closure (session-scoped)
- Current branch: <branch | DETACHED>
- Session baseline file: <path | "(missing — fallback mode)">
- Pre-existing dirty paths (ignored): <list | "(none)">
- Session-scoped dirty paths: <list | "(none)">
- Committed scope (`main...HEAD`): <N files | "(none)">
- Unrelated sibling worktrees (logged): <list `branch=<b> path=<p>` | "(none)">
- Status: PASS / WITH-NOTES / FAIL (NEEDS-WORK only when COMMITTED_SCOPE empty AND SESSION_DIRTY non-empty, OR detached HEAD)

### Verdict
**VERIFIED** | **VERIFIED-WITH-NOTES** | **NEEDS-WORK** | **FAILED**

### Notes (only if VERIFIED-WITH-NOTES)
- <Codex P2/P3 finding summary>
- <perf WARN band note, if any>
- <evaluator caveat, if any>

### Next
- (NEEDS-WORK) Address: R2, R3, Codex P0/P1 findings
- (FAILED) `/debug recover` invoked — see attached failure report
- (VERIFIED / VERIFIED-WITH-NOTES) Phase 9 (/evolve) running
```

### Verdict matrix

Per `_shared.md` § 9 (Verdict Matrix template).

| Phase 0 | 2 | 3 | 3.5 | 4 | 5 | 6 | 7 | Verdict |
|---|---|---|---|---|---|---|---|---|
| PASS | PASS | PASS | PASS/SKIP | All ☑ | clean OR P3 | clean | APPROVED/SKIP | **VERIFIED** |
| PASS | PASS | WARN | PASS/SKIP | All ☑ | P2/P3 only | clean | APPROVED/SKIP | **VERIFIED-WITH-NOTES** |
| PASS | PASS | PASS | PASS/SKIP | Any ☐/⚠ | — | — | — | **NEEDS-WORK** |
| PASS | PASS | PASS | PASS/SKIP | All ☑ | P0/P1 | — | — | **NEEDS-WORK** |
| PASS | PASS | PASS | PASS/SKIP | All ☑ | — | P0/P1 | — | **NEEDS-WORK** |
| PASS | PASS | PASS | PASS/SKIP | All ☑ | — | — | REVISION_REQUIRED | **NEEDS-WORK** |
| PASS | PASS | PASS | FAIL | — | — | — | — | **FAILED** → `/debug frontend` |
| Any FAIL | — | — | — | — | — | — | — | **FAILED** → `/debug recover` |

Override: Phase 8 only forces **NEEDS-WORK** in two cases — (a) `COMMITTED_SCOPE` empty AND `SESSION_DIRTY` non-empty, or (b) detached HEAD. When `COMMITTED_SCOPE` non-empty AND `SESSION_DIRTY` non-empty, downgrade to **VERIFIED-WITH-NOTES** instead of NEEDS-WORK. Unrelated sibling worktrees and pre-existing baseline dirty are **always log-only** — they never affect the verdict.

---

## 12. Phase 9 — `/evolve` (learnings capture)

> Run only if verdict ∈ {`VERIFIED`, `VERIFIED-WITH-NOTES`}.
> Skip if `--no-evolve` arg passed.
> Skip in `quick` and `spec-only`.

**Skill:** `evolution-core`.

```typescript
Skill("evolution-core");
// Then invoke /evolve with the verify report as input
```

`/evolve` orchestrates:
- Captures new patterns from the diff (reusable components, helpers introduced)
- Updates project learnings docs (frontend / backend / DB) if relevant patterns detected
- Updates `MEMORY.md` if pattern is cross-session relevant
- **Does NOT modify `AGENTS.md`** without explicit user approval

### Output

List of files updated + 1-line summary per update. Surface in chat — do not silently mutate documentation.

---

## 13. Escalation map

| Condition | Action |
|---|---|
| Phase 0 gates fail | STOP, surface error |
| Phase 2 `/debug` unresolved or 2× fix fail | `/debug recover` |
| Phase 3 `/perf` below WARN, new N+1, FK index missing | `/debug recover` |
| Phase 3.5 E2E fail | STOP, invoke `/debug frontend` |
| Phase 5 codex P0/P1 | STOP, ask user which to fix |
| Phase 6 adversarial P0/P1 | STOP, present, ask user before Phase 7 |
| Phase 7 evaluator REVISION_REQUIRED | `/debug recover` |
| 2 consecutive `/verify` runs return FAILED on same diff | evaluator Mode 3 reactive |
| Scope drift in auth / payment / PII / schema / env / ci | Phase 7 trigger automatic in `full`; in `quick`/`spec-only` ASK user |
| No plan and no `$ARGUMENTS` | ASK user |

---

## 14. Mode behavior matrix

| Mode | 0 | 1 | 2 | 3 | 3.5 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `full` | YES | YES | YES | YES | IF UI | YES | **YES** | **YES** | IF risk | YES | IF VERIFIED |
| `quick` | YES | YES | YES | SKIP | SKIP | YES | **YES** | **YES** | SKIP\* | YES | SKIP |
| `spec-only` | SKIP | YES | SKIP | SKIP | SKIP | YES | **YES** | **YES** | SKIP | YES | SKIP |
| `paranoid` | YES | YES | YES | YES | YES | YES | **YES** | **YES** | YES | YES | YES |

\* `+evaluator` / `+e2e` flags override SKIP. **Phases 5 + 6 have no skip path** (Iron Law) — the `+codex` and `+adversarial` flags are accepted but are no-ops.

Worktree closure is part of Phase 8 and runs in every mode, including `spec-only`.

---

## 15. Agent / skill matrix

Per `_shared.md` § 3 and `debug.md` § 7. Quick reference:

| Phase | Agent | Skill | Foreground/Background |
|---|---|---|---|
| 0 — Gates | none (direct Bash) | `superpowers:verification-before-completion` (gate fn) | — |
| 1 — Resolve Inputs | none | — | — |
| 2 — `/debug` | `debugger` | `debugger` + `superpowers:verification-before-completion` | foreground (write-capable) |
| 3 — `/perf` | `performance-optimizer` | `performance-optimization` + `superpowers:verification-before-completion` | foreground (write-capable, worktree-isolated) |
| 3.5 — E2E browser | `verification` | (agent-browser CLI via Bash) + `superpowers:verification-before-completion` | foreground |
| 4 — Spec Compliance | none (direct Read/Grep) | — | — |
| 5.0 — Review prep | none | `superpowers:requesting-code-review` | — |
| 5 — `/codex:review` | none (slash → codex-plugin-cc) | — | background, collected before Phase 8 |
| 5.5 — Receiving review | none | `superpowers:receiving-code-review` | — |
| 6 — `/codex:adversarial-review` | none (slash → codex-plugin-cc) | — | background, collected before Phase 8 |
| 7 — evaluator Mode 3 | `evaluator` | — | foreground |
| 8 — Worktree closure + report | none | — | — |
| 9 — `/evolve` | none | `evolution-core` | foreground |
| Escalation — fix loop fail | `codex:codex-rescue` | `codex:rescue` | foreground |
| Escalation — 2× FAILED reactive | `evaluator` Mode 3 | — | foreground |

---

## 16. Anti-patterns to reject

- Calling `Skill("debugger")` then also spawning the agent for the same investigation → wastes context. Skill is loaded once at Phase 1.0.
- Spawning `performance-optimizer` directly from `/verify` → bypasses `/perf` orchestration. Always go through `/perf`.
- Spawning `codex-rescue` agent for code review → use `/codex:review` slash command. **NEVER** dispatch `codex:codex-rescue` (subagent) as a "fallback" for `/codex:review` or `/codex:adversarial-review`. The agent has Bash + write tools and has been observed to run ownership-classification scripts (e.g. `split_router_patch.py`) that misidentify in-flight WIP as "other" and revert it to HEAD, destroying uncommitted work in the same file the reviewer was asked to inspect. If the codex-plugin-cc slash command is unavailable, use the direct-Bash fallback in § 8 (`node ${PLUGIN_ROOT}scripts/codex-companion.mjs review --base main --background`) — that path is read-only and does not mutate the worktree.
- Auto-fixing findings from `/codex:adversarial-review` → present, ask user.
- Running Phase 7 when Phase 5/6 STOPPED awaiting user input → wait for "continue" first.
- Running Phase 9 on `NEEDS-WORK`/`FAILED` → captures wrong learnings. Hard constraint.
- Using `subagent_type: "Explore"` (built-in) when `_shared.md § 3` mandates `"explorer"` (custom).
- Reporting `VERIFIED` while **session-scoped** `git status` is non-empty AND no committed work exists on branch → session work stranded; commit first. Pre-existing dirty (recorded in baseline) is permitted.
- Failing to **report** dirty sibling worktrees → they must appear under "Unrelated sibling worktrees (logged)" in the Phase 8 report, but they NEVER block the verdict. Current worktree is the sole gate.
- Skipping Phase 5 (`/codex:review`) in any mode → violates Iron Law. The `+codex` flag is a no-op; the phase runs unconditionally.
- Skipping Phase 6 (`/codex:adversarial-review`) in any mode → violates Iron Law. The `+adversarial` flag is a no-op; the phase runs unconditionally.
- Reporting any phase as PASS without the § 1.2 gate evidence row in Phase 8 report.
- Dispatching `/codex:review` without surfacing the Phase 5.0 bundle in the same turn.
- Echoing an agent's "success" claim as PASS without re-running the verifying command in the current turn.

---

## 16.5 Post-agent worktree integrity check (mandatory after every spawned agent)

Background agents with `Bash` access can mutate the worktree even when prompted for read-only review (observed failure: `codex:codex-rescue` running `git stash` + `split_router_patch.py` to "split" ownership, then writing the misclassified slice back, reverting in-flight work to HEAD).

After **every** spawned agent returns — before composing the Phase 8 report or any follow-up action — run this integrity check:

```bash
# 1. New scratch files outside the agent's declared output
git ls-files --others --exclude-standard | grep -E '^(\.tmp_|scripts/split_|.*/__tests__/.*\.test\.ts$|scripts/.*_patch\.py$)' || true

# 2. Files in this session's baseline that are now byte-equal to HEAD
#    (i.e. the agent reverted your in-flight edits)
SESSION_ID="${CLAUDE_SESSION_ID:-}"
BASELINE_FILE=".claude/logs/sessions/${SESSION_ID}.baseline.json"
if [ -f "$BASELINE_FILE" ]; then
  python -c "
import json, subprocess
b = json.load(open('$BASELINE_FILE'))
for p in b.get('preexisting_dirty', []):
    r = subprocess.run(['git', 'diff', '--quiet', '--', p])
    if r.returncode == 0:
        print(f'REVERTED: {p}')" 2>/dev/null
fi

# 3. New stash entries created during this session
git stash list --since="$(date -d "@$(stat -c '%Y' "$BASELINE_FILE")" -Iseconds 2>/dev/null || echo "1 hour ago")"
```

**Failure handling:**

| Signal | Action |
|---|---|
| New `.tmp_patches/*`, `scripts/split_*.py`, or `__tests__/*` scratch files | Pause. Inspect contents before doing anything. The agent shelled out and wrote scratch — confirm with user whether to keep or remove. Never auto-commit these into the verify run. |
| `REVERTED:` lines from check 2 | Agent destroyed in-flight work. Restore from (a) most recent stash entry created by the agent, OR (b) `.tmp_patches/state-*.ts` snapshot, OR (c) reflog (`git reflog -10`). Re-apply Codex P0/P1 fixes manually before proceeding. |
| New stash entries you didn't create | Agent stashed your work to "clean" the tree. Inspect the stash diff. Restore via `git stash apply stash@{0}` if it contains your edits. |

Surface the integrity check result in the Phase 8 report under a new bullet "Post-agent worktree integrity: PASS / RESTORED <files> / DIRTY <files>".

If any check fails twice on the same agent → STOP using that agent for review tasks in this session and escalate to direct-Bash fallback (§ 8) for the remaining phases.

---

## 17. After VERIFIED

- Phase 9 (`/evolve`) writes any new learnings (only on `VERIFIED` / `VERIFIED-WITH-NOTES`)
- Pre-commit reminder: `${tooling.linter} check --write <touched-files>`
- Confirm `git status --short --branch` is clean after any Phase 9 writes; if Phase 9 changed files, Phase 8 must be rerun before the final response.
- If session is long → suggest `/evolve handoff` to write session state
- If `VERIFIED-WITH-NOTES` → surface the notes section explicitly

---

## 18. Phase 10 — Finishing the development branch

> Skip in `spec-only` and `quick` modes. Run in `full` and `paranoid` only if verdict ∈ {`VERIFIED`, `VERIFIED-WITH-NOTES`}.

Invoke `Skill("superpowers:finishing-a-development-branch")`. The skill replaces the previous ad-hoc commit/PR logic and surfaces a structured options menu:

| Option | When |
|---|---|
| **Merge to main** | All gates green, no scope drift, ready for production |
| **Open PR** | Needs human review or CI run before merge |
| **Keep branch** | Work paused, will resume in another session |
| **Discard** | Work was exploratory, no longer needed |

The skill enforces evidence (Phase 0–8 reports) before any merge or push, and the NeonDash branch policy (`dev-test → PR → main`, never push direct to main) per root `AGENTS.md`.

Anti-pattern: bypassing this skill and running `git push origin main` directly — never push to `main`, always PR from `dev-test`.
