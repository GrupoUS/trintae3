# Claude Code Behavioral Config

> Tier 1 — always loaded. Combined with root `AGENTS.md` must stay **< 500 lines total**.
> Read root `AGENTS.md` first: @../AGENTS.md
> Subdirectory `AGENTS.md` files are read **only when editing files in that subdirectory**.
> All project-specific values resolve from `.claude/config.json`.

---

## Project identity

**Name:** `config.json::project.displayName` (currently `Grupo US — Site Institucional`).
**Purpose:** `config.json::project.purpose` (currently `Static marketing site for Grupo US.`).
**Stack:** `config.json::project.stackSummary` (currently `Astro 6 (static-only) · Bun · Tailwind CSS v4 · React 19 (islands; minimal) · Railway · Lucide React · Playfair Display + Inter`).
**Locale:** `config.json::project.locale` (currently `pt-BR`).

Project metadata in `.claude/config.json`. Architecture map / commands / pre-delivery checklist in root `AGENTS.md`. Brand voice + products: `Skill('${skills.brand}')`. Theme tokens: `Skill('${skills.theme}')`. Stack patterns: `Skill('${skills.stack}')`.

---

## Behavior

These are non-default behaviors. Standard coding conventions are not listed because Claude already applies them.

- **Implement directly, don't just suggest.** Code-first responses.
- **Minimal explanation.** Assume I know the language.
- **Project package manager only** — `config.json::tooling.packageManager` (currently `bun` → `bun install` / `bun run` / `bunx`). Never use another PM.
- **Reference applied rules** when relevant (e.g., "per `.claude/rules/frontend.md` redirect tri-sync").

---

## Skill invocation

- **Invoke relevant skills BEFORE any response or action.** Even a 1% chance a skill applies → invoke it first.
- **Process skills first** (planning, debugging), **implementation skills second**.
- **Use the `Skill` tool** — never `Read` skill files directly with the `Read` tool.
- **Process skills used by an agent SHOULD be preloaded via the `skills:` frontmatter field** (Anthropic-recommended). Body-level `Skill()` calls remain valid for ad-hoc / conditional invocation. See `.claude/skills/senior-prompt-engineer/SKILL.md § 8` for assignments.

---

## Intent classification

| Type | Indicators | Action |
|---|---|---|
| **Trivial** (L1-L2) | Single file, known pattern | Direct fix — no planning |
| **Explicit** (L3) | Well-scoped, clear requirements | Light planning → execute |
| **Exploratory** (L4) | Ambiguous scope, multiple valid approaches | Discover → research → plan |
| **Open-ended** (L5+) | Vague, requires decomposition | Full D.R.P.I.V via `/plan` |

**Autonomy:** proceed without asking when changes are **local + reversible + evidence-supported + within existing architecture**. State assumptions briefly and continue.

**Ask first only for:**
- Destructive operations (file deletion, branch deletion, hard reset)
- Shared-system or production-impacting config changes
- External actions visible to other people (commits, pushes, PRs, messages, deploys)

---

## Cardinal rules (non-negotiable)

Universal-by-default. Values that vary per project (render mode, SSOT paths, package manager, WhatsApp toggle) resolve from `.claude/config.json::cardinals` + `::whatsapp` + `::tooling`.

1. **Never assume correctness.** Verify against official docs, runtime build, or `<pm> run check:external-urls` before applying changes.
2. **Always debug after changes.** Every modification ends with the project gate chain: `<pm> run lint && <pm>x astro check && <pm> run build` (substitute `<pm>` from `config.json::tooling.packageManager`).
3. **NEVER use emojis as UI icons.** Use only the project's declared icon library — `config.json::cardinals.iconLibrary` (currently `lucide-react`).
4. **NEVER violate the project render mode.** When `config.json::cardinals.renderMode = static-only`: no `ClientRouter`, no `prerender = false`, no SSR adapter (`@astrojs/node` / `@astrojs/vercel` / `@astrojs/cloudflare`). When `renderMode = ssr` or `hybrid`: declare per-page mode explicitly; never silently drift.
5. **NEVER hardcode product / team / landing copy** in `.astro` or `.tsx`. Always `getCollection()` from `config.json::cardinals.contentSsot` (currently `src/content/`).
6. **NEVER inline `wa.me/...` URLs** *(applies when `config.json::whatsapp.enabled = true`)*. Always go through `config.json::whatsapp.ssotFile` (currently `src/lib/whatsapp.ts`). When `whatsapp.enabled = false`, this cardinal is dormant.
7. **NEVER hardcode hex** outside `config.json::cardinals.themeSsot` (currently `src/styles/global.css`) `@theme` block. Semantic tokens or named brand utilities only.
8. **NEVER animate layout properties** (`width`, `height`, `top`, `left`, `padding`, `margin`). Disclosure / accordion uses CSS grid `grid-template-rows: 0fr ↔ 1fr` or native `<details>`. Other animations: `transform` + `opacity` only.

---

## Routing matrix

> **Tech-stack skills auto-trigger** via skill description match. `Skill('${skills.stack}')` auto-loads on stack-specific files (e.g., `*.astro`). Stack-specific project values → `.claude/skills/${skills.stack}/references/values/<project>-overlay.md`. Brand canon → `Skill('${skills.brand}')` → `references/values/<project>/`. Theme canon → `Skill('${skills.theme}')` → `references/values/<project>-canon.md`. Generic `.claude/rules/*` carry universal do/don't only.

| Task touches | Load these | Implement in |
|---|---|---|
| New page / product landing | `frontend.md` + `DESIGN.md` + `Skill('${skills.stack}')` | `${paths.pagesRoot}/<slug>.astro` + `${paths.contentRoot}/products/<slug>.json` (gpus-site mirror: `mentoria-black-neon.astro`) |
| New external product redirect | `${skills.stack}/references/project-overlay-template.md § External redirect tri-sync` + values/<project>-overlay.md | `${paths.contentRoot}/products/<slug>.json::externalSiteUrl` + `astro.config.mjs::redirects` + `astro.config.mjs::sitemap.filter()` (3-way sync) |
| Edit landing copy / CTA / FAQ / testimonial | `${skills.stack}/references/content-collections.md § SSOT pattern` + `Skill('${skills.brand}')` | `${paths.contentRoot}/products/<slug>.json` only — never component file |
| Update home journey order | `Skill('${skills.brand}')` → `references/values/<project>/manual-resumo.md § Jornada` | `${paths.contentRoot}/products/<slug>.json::order` |
| WhatsApp message / CTA *(when `whatsapp.enabled`)* | `Skill('${skills.brand}')` → `references/whatsapp-ssot.md` | `cta.whatsappMessage` in product JSON (always prefixed `config.json::whatsapp.messagePrefix`) — `config.json::whatsapp.ssotFile` is SSOT for URL building |
| WhatsApp number / E.164 *(when `whatsapp.enabled`)* | `Skill('${skills.brand}')` → `references/whatsapp-ssot.md` | `WHATSAPP_SDR_E164` constant in `config.json::whatsapp.ssotFile` — single source |
| Theme token / new utility | `DESIGN.md` + `Skill('${skills.theme}')` | `config.json::cardinals.themeSsot` `@theme` block + `@layer utilities` |
| New landing section component | `frontend.md` + `DESIGN.md` + `Skill('${skills.stack}')` | `${paths.componentsRoot}/landing/*.astro` (pure Astro by default; promote to `.tsx` only when interactivity required) |
| Hero island animation | `${skills.stack}/SKILL.md § Common Mistakes` + `references/values/<project>-overlay.md § Hydration` | `${paths.componentsRoot}/landing/<island>.tsx` with `client:idle` (never `client:load` unless per overlay allowlist) |
| FAQ behavior | `frontend.md` + `DESIGN.md § Motion` + `${skills.stack}/references/islands-architecture.md § FAQ accordion` | `${paths.componentsRoot}/landing/FAQ.astro` — native `<details>` or CSS grid `0fr/1fr`; never Framer height tween |
| SEO meta / JSON-LD | `seo.md` + `Skill('${skills.stack}')` (when sitemap plugin / stack-specific) | `${paths.layoutsRoot}/Layout.astro` (Organization + BreadcrumbList) + per-page frontmatter (`title`, `description`, `ogImage`) |
| A11y plumbing | `frontend.md § Accessibility` + `${skills.stack}/references/project-overlay-template.md § Layout.astro contracts` | `${paths.layoutsRoot}/Layout.astro` (skip link, `<main id="conteudo-principal">`, `<noscript>` reveal) + `config.json::cardinals.themeSsot` |
| Performance budget | `stability.md § Performance gates` + `${skills.stack}/references/performance.md` | `Layout.astro` (preconnect fonts) + Astro `<Image>` discipline + hydration audits |
| Smoke tests / anti-patterns / debug | `stability.md` + `${skills.stack}/references/values/<project>-overlay.md § Smoke commands` | filesystem (greps + Lighthouse + `<pm> run check:external-urls`) |
| Agent prompt or new agent file | `Skill('senior-prompt-engineer')` | `.claude/agents/<name>.md` (frontmatter + body) |
| Multi-agent command (parallel batch) | `senior-prompt-engineer` + `_shared.md § 7.5` | `.claude/commands/<cmd>.md` |
| Autoresearch run / record evolve experiment / consult prior keep-decision evidence | `evals/README.md` + `evals/site/<area>/compound.md` | `evals/site/<area>/runs/<YYYY-MM-DD>-<slug>/run.md` (write via `/evolve`) — never hand-edit harness/grade artifacts |
| Bootstrap new project from this seed | `.claude/scaffolding/BOOTSTRAP.md` | new repo (clone + checklist) |
| Anywhere | `stability.md` | universal checklist |

---

## Sequential thinking

Invoke `mcp__sequential-thinking__sequentialthinking` **before** acting (not after) when any of these apply:

| Trigger | Example |
|---|---|
| Request is L4+ (multi-domain, cross-layer) | Feature touching schema + UI + SEO |
| Ambiguous requirements with 2+ valid approaches | "improve performance" with no metric |
| Error spans 3+ files or services | Cascade failure after deploy |
| Architecture decision with irreversible consequences | New dependency, render-mode change |
| Plan has 3+ sequential phases with dependencies | Sprint with content → component → style gates |
| Confidence < 4 on root cause after initial investigation | Bug with no clear reproduction path |

**Never invoke for:** L1-L2 fixes, known patterns, direct style/lint/type changes.

---

## Research tools

| Question | Tool |
|---|---|
| Library/framework API, config, version, migration | `mcp__claude_ai_Context7__resolve-library-id` → `mcp__claude_ai_Context7__query-docs` |
| Current best practices, CVEs, ecosystem news, external APIs | `mcp__tavily__search` (add year + version to query) |
| Both needed | Run both in parallel in the same message |

Codebase search (`Grep` / `Read` / `Glob`) is the **fallback for internal questions, never the first step for external knowledge.** Use even for well-known libraries — training data may be stale.

---

## Stopping conditions (hard limits)

- **Max 3 fix attempts** on the same hypothesis → escalate to `evaluator` (Mode 3: Architecture Analysis)
- **Max 5 agent spawns** per user request → pause and checkpoint with the user
- **Confidence < 3** on a critical finding → flag as assumption and ask the user
- **Scope expands** beyond the original request → STOP and confirm
- **Quality gate fails 2× consecutively** → invoke `/debug recover`
- **Coordinator max-iteration:** any agent-team coordinator returns `BLOCKED` to main after 2 consecutive `REVISION_REQUIRED` on the same task → main calls `/debug recover` (do not escalate to user mid-loop)

---

## Decision authority

| Action | Authority |
|---|---|
| L1-L2 fixes, style/lint/type fixes | Autonomous |
| Schema additions, new dependencies, file deletion | **Confirm first** |
| Production config, destructive operations, deploy to prod | **Always ask** |

---

## Pointers (Tier 3 — read on demand)

### Universal rules (portable to any project)

- `.claude/rules/frontend.md` — component placement, hydration philosophy, content-data SSOT, forms, external surfaces, performance, a11y plumbing.
- `.claude/rules/DESIGN.md` — color tokens, typography, components, layout, iconography, motion, imagery, depth, focus.
- `.claude/rules/stability.md` — A–L checklist, render-mode invariants, CWV gates, smoke template, anti-patterns, debug triage.
- `.claude/rules/seo.md` — locale, routes, sitemap, robots, OG/Twitter, JSON-LD shape, CWV thresholds, AI citation (GEO).

### Generified Tier-2 rules (values from `config.json`)

- `.claude/rules/astro.md` — Astro stack invariants, hydration directive table, Content Collections SSOT, redirect tri-sync, View Transitions opt-in. (Loaded when `config.json::skills.stack = astro`.)
- `.claude/rules/commit.md` — Conventional Commits + scopes (from `config.json::commit.scopes`), lefthook pre-commit + manual gate checklist, protected files, branch protection pointer.
- `.claude/rules/mcp.md` — MCP server inventory + terminal discipline (project PM from `config.json::tooling.packageManager`) + PAUSE-THINK-HYPOTHESIZE-EXECUTE debug loop.
- `.claude/rules/commands.md` — 11 slash commands + skill phase ordering + agent ↔ skill pairings (skill names from `config.json::skills`) + stopping conditions quick-ref.

### Tech-stack skills (auto-trigger via skill description match)

- `.claude/skills/${skills.stack}/` (currently `astro`) — framework patterns + per-project overlay in `references/values/<project>-overlay.md`. Template structure: `references/project-overlay-template.md`.

### Brand canon (per Grupo US group)

- `.claude/skills/${skills.theme}/` (currently `gpus-theme`) — design tokens canon. Schema: `references/template.md`. Per-project values: `references/values/<project>-canon.md`.
- `.claude/skills/${skills.brand}/` (currently `grupo-us`) — products / journey / brand voice. Schema: `references/template.md`. Per-project values: `references/values/<project>/`. WhatsApp mechanic: `references/whatsapp-ssot.md` (values from `config.json::whatsapp`).

### Audit trail / governance

- root `AGENTS.md` — behavioral + orchestrator (commands / agents / skills / MCPs / terminal / authority precedence). Cardinals + routing remain here in `CLAUDE.md`.
- `.claude/scaffolding/BOOTSTRAP.md` — checklist for starting a new Grupo US project from this seed.
- `docs/learnings-log.md` — chronological project decisions (append-only, on-demand).
- `evals/` — autoresearch audit trail. `evals/README.md` for layout.
- `docs/` — product specs, design canon, implementation plans.
