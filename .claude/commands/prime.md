---
description: Project context loader. Modes (positional arg) — default: auto-classify cross-domain · backend: backend rules + domain refs · frontend: frontend rules + design refs · fullstack: cross-domain. Loads minimum-viable context, never eager.
workflow_type: augmented-llm
---

# /prime — Intelligent Context Loader

**ARGUMENTS**: $ARGUMENTS

> First positional arg = scope. Examples:
> ```
> /prime                  # auto-classify intent, then load
> /prime backend          # backend-focused (rules + recent backend changes)
> /prime frontend         # frontend-focused (rules + recent frontend changes)
> /prime fullstack        # multi-domain
> ```

---

## Goal

Load **minimum-viable** project context for the current task. Never eager-load everything.

Tier model:
- **Tier 1** (always loaded by harness): root `AGENTS.md` + `.claude/CLAUDE.md`
- **Tier 2** (load on demand): `.claude/rules/*.md` (`backend.md`, `database.md`, `DESIGN.md`, `integrations.md`, `stability.md`)
- **Tier 3** (load only when justified): `docs/`, ADRs, learnings, design specs, spec docs

Plus optional project supplements under `${rulesDir}` (routing supplements, anti-patterns, layer maps, project snapshot, Tier 3 docs).

---

## 0. Setup (every mode)

`/prime` is a context loader — it does not mutate code, so it does NOT invoke the superpowers bootstrap itself. Instead, surface a one-line recommendation at the end of the output (per `_shared.md` § 0.5): the **next** command should load `Skill("superpowers:using-superpowers")` as its first skill call.

Read `.claude/config.json`. Note `${paths.*}`, `.claude/rules`, and `${rulesDir}` for later loading.

If continuing a prior session (or a session handoff was written via `Skill("evolution-core")`): read `${rulesDir}/docs/evolution/HANDOFF.md` first if it exists; otherwise fall back to `.claude/HANDOFF.md` when present.

Run:
```bash
git status --short
git log --oneline -10
```

If `.claude/rules/routing-supplements.md` exists, note it for stage 2 deep loading.

### 0.1 Auto-research flag (default ON for L3+)

If `$ARGUMENTS` contains `--no-auto-research` → skip. Otherwise on **L3+ intent** (per § Intent classification in `.claude/CLAUDE.md`), spawn discovery agents BEFORE returning prime output:

```ts
Agent({ subagent_type: "explorer",  run_in_background: true, prompt: "<scoped repo discovery>" })
Agent({ subagent_type: "librarian", run_in_background: true, prompt: "<external doc lookup>" })
```

Both calls go in the SAME assistant turn (parallel). Non-blocking — return prime output while they run; their results merge on the next user turn.

---

## 1. Mode dispatch

Parse first positional token from `$ARGUMENTS`:

| Token | Section |
|---|---|
| (none) / `auto` / `cross` | § 2 (auto-classify) |
| `backend` / `api` / `db` | § 3 (backend) |
| `frontend` / `ui` / `react` | § 4 (frontend) |
| `fullstack` / `multi` | § 5 (fullstack) |

---

## 2. Auto-classify mode (default)

Read user task description from `$ARGUMENTS` (after the mode token, if any). Classify intent:

| Signal | Classify as | Route to |
|---|---|---|
| React / UI / layout / styling / component / page | frontend-heavy | § 4 |
| API / handler / route / middleware / service / validator | backend-heavy | § 3 |
| Schema / migration / RLS / FK / index / enum | backend (data) | § 3 (with database.md emphasis) |
| External provider / webhook / payment / email / monitoring | integration-heavy | § 3 (load `integrations.md` first) |
| UI + API + schema | fullstack | § 5 |
| Vague / exploratory | partial — see § 2.1 | — |
| L3+ (any non-trivial) | spawn `explorer` + `librarian` in parallel before § 3/4/5 dispatch | — |

### 2.1 Vague task

Don't load eagerly. Output:

```
Project: ${project.name} | Branch: {branch}
Intent: unclear
Recommended next: ask user "Is this primarily frontend, backend, integration, or cross-domain?"
```

---

## 3. Backend mode

### 3.1 Stage 0 — Base load

Read compact backend rules:
- `.claude/rules/backend.md`
- `.claude/rules/database.md`
- `.claude/rules/stability.md`

```bash
git log --oneline -5 -- ${paths.backendRoot}
git log --oneline -5 -- ${paths.schemaRoot}
```

Do NOT yet read deep references or subdirectory `AGENTS.md` files.

### 3.2 Stage 1 — Classify task shape

| Task shape | Examples | Stage 2 load |
|---|---|---|
| API/handler | route, validator, auth guard, response shape | `${paths.backendRoot}/AGENTS.md` if present |
| Schema/data | columns, relations, indexes, enum alignment | `${paths.schemaRoot}/AGENTS.md` if present + project schema reference doc |
| Service/integration | webhooks, external APIs, third-party providers | `.claude/rules/integrations.md` (re-read if not yet loaded), provider-specific docs |
| Runtime/env | env vars, deploy config, runtime behavior | runtime/architecture doc if exists in `docs/architecture/` |
| Schema-domain orientation | which domain owns which table | schema-reference doc |
| Historical bug pattern | tenant resolution, aggregation, date boundary | backend-learnings doc |
| Multi-domain | API + schema + integration | only the exact combination required |

If the task is unclear → ask one short clarifying question rather than load more.

### 3.3 Stage 2 — Targeted deep loading

Load **only** the files justified by Stage 1. If `.claude/rules/routing-supplements.md` exists, also consult it for project-specific bindings (e.g., where the donation flow lives, where Pix providers live).

### 3.4 Loading rules

- Never load all backend references by default.
- Never load subdirectory `AGENTS.md` files unless task touches that directory.
- Stop after the minimum sufficient load. Expand in stages, never restart with full preload.
- If task expands → continue staging, don't reset.
- If > 4 files seem necessary → reassess scope.

---

## 4. Frontend mode

### 4.1 Stage 1 — Baseline (always)

Read `.claude/rules/DESIGN.md` — the merged web-layer rule (visual tokens + React patterns + polling + mobile scroll owner). Former `frontend.md` content was incorporated 2026-05-18.

```bash
git log --oneline -5 -- ${paths.frontendRoot}
```

Use Stage 1 only for: small UI fixes, className changes, simple component edits, light bug fixes with known patterns.

### 4.2 Stage 2 — Design / foundation load

Escalate when task involves: new UI creation · layout redesign · page structure · color/typography decisions · design review · design-system alignment · interaction design.

Also load (when present in project):
- design system foundation (e.g. `docs/stitch-design/.../DESIGN.md` or equivalent design canon)
- LEVER / extend-vs-create philosophy doc

### 4.3 Stage 3 — Historical patterns

Escalate when task involves: rerender / performance regressions · polling / SSE / query churn · virtualized lists · DnD / kanban / chat surfaces · mutation UX · sanitization / HTML rendering · camera / media flows · tab/panel scroll bugs.

Also load: frontend-learnings doc if exists in project.

### 4.4 Stage 4 — Canonical authority

Load only when:
- Editing files under `${paths.frontendRoot}/**`
- Task complex enough that compact rules aren't enough
- Ambiguity between compact rule and domain authority
- Change spans multiple frontend subsystems

Also load: `${paths.frontendRoot}/AGENTS.md` if present.

### 4.5 Feature-specific spec loading

If the task targets a specific UI surface (e.g., admin dashboard, donation form, checkout flow), load **only** the directly relevant reference from `Skill("gpus-theme")` (e.g., `references/design-foundation.md` for tokens, `references/implementation-handoff.md` for build pattern). Never load every reference.

### 4.6 Routing heuristic

| Task shape | Stages |
|---|---|
| Trivial L1-L2 | Stage 1 only |
| Explicit frontend impl | Stage 1 → Stage 2 if structure/design involved |
| Performance/debug-heavy | Stage 1 → Stage 3 |
| New page/component architecture | Stage 1 → Stage 2 → Stage 4 |
| Complex frontend refactor | Stage 1 → Stage 2 or 3 → Stage 4 as needed |

---

## 5. Fullstack mode

When task spans multiple domains:

### 5.1 Always load

- `.claude/rules/stability.md` (universal checklist)
- Targeted Tier 2 rules per the routing matrix in CLAUDE.md, e.g.:
  - API + UI → `backend.md` + `DESIGN.md`
  - Schema + API + UI → `database.md` + `backend.md` + `DESIGN.md`
  - Webhook + integration + UI status → `backend.md` + `integrations.md` + `DESIGN.md`

### 5.2 Tier 3 — load only what's justified

- Architecture map / README in `docs/architecture/` (if exists) — only when planning cross-domain work
- Design foundation — only when UI design is part of scope
- Single targeted feature spec — never the whole `design-specs/` folder

### 5.3 Stop conditions

Stop loading if:
- Task hasn't been provided yet (just confirm baseline + ready state)
- Minimum sufficient load achieved
- Task becomes schema-changing / auth-changing / payment-related → flag explicitly before implementation

---

## 6. Anti-bloat rules (all modes)

- Never use `/prime` as "read every rule and every reference"
- Never load both full architecture and full design-spec sets unless task truly spans both
- Never preload historical learnings unless task suggests debugging / performance / edge cases / prior-bug-sensitive areas
- Prefer **one targeted reference** over multiple broad references
- If unsure → load index/README first, never the children
- Stop after the minimum sufficient load

---

## 7. Output format

```
Project: ${project.name} | Mode: {auto|backend|frontend|fullstack} | Stage: {1-4}
Branch: {branch} | Recent: {summary of git log -5}
Loaded:
  - {exact files actually loaded}
Supplements applied: {yes/no — list `${rulesDir}` supplement files actually loaded}
Next on demand: {only the most relevant additional files}
Ready for: {task description or "awaiting task"}
Reminder: next command should open with Skill("superpowers:using-superpowers").
```

Keep summary under 120 words.

---

## 8. Stop conditions

- Stop after Stage 0 if task hasn't been provided
- Stop after the minimum sufficient deep load
- If task becomes destructive / payment-related / auth-changing / schema-changing → flag before implementation
- If > 4 files seem necessary in one stage → reassess classification
