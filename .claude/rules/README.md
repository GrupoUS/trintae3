# Rules — Tier 2 Guardrails

> Tier-2 rules for the current project (identity + stack resolved from `.claude/config.json::project`).
> Universal substance survives portability; project-specific values resolve from `.claude/config.json` + brand/theme/stack skills (`config.json::skills`).
> Loaded on demand by `/prime` per routing matrix in `.claude/CLAUDE.md`, plus auto-load by `globs:` frontmatter when matching files are read.

## Files

| File | Scope | Portability |
|---|---|---|
| `frontend.md` | Component placement, hydration philosophy, content data SSOT, forms, external surfaces, perf budget, a11y plumbing | UNIVERSAL — portable verbatim |
| `DESIGN.md` | Color tokens, typography, components spec, layout, radius, iconography, motion, imagery, depth, focus | UNIVERSAL — portable verbatim |
| `stability.md` | A–L checklist, render-mode invariants, CWV gates, smoke template, anti-patterns, debug triage | UNIVERSAL — portable verbatim |
| `seo.md` | Locale, routes, sitemap, robots, OG/Twitter, JSON-LD, CWV, AI citation (GEO) | UNIVERSAL — portable verbatim |
| `astro.md` | Static-only invariants, hydration directive table, Content Collections SSOT, redirect tri-sync, View Transitions opt-in, `Layout.astro` contracts | STACK-OVERLAY — applies when `config.json::skills.stack = astro` |
| `commit.md` | Conventional Commits + scopes, lefthook pre-commit + manual gate checklist | GENERIFIED — scopes from `config.json::commit.scopes`, package manager from `config.json::tooling.packageManager` |
| `mcp.md` | MCP server inventory, terminal discipline (POSIX + project PM), debug loop | GENERIFIED — package manager from `config.json::tooling.packageManager` |
| `commands.md` | 11 slash commands + invocation matrix, skill phase ordering, agent ↔ skill pairings | GENERIFIED — skill names from `config.json::skills` |

## How rules load

1. `/prime [auto|frontend]` reads `.claude/CLAUDE.md § Routing matrix`.
2. Routing matrix maps task signal → rule file(s).
3. Rules with `globs:` / `paths:` frontmatter auto-load when Claude Code reads files matching the glob.
4. Stops at minimum-viable context.

## Stack signals

Resolved from `config.json::skills.stack` (currently `astro`):

| Surface | Skill / Rule |
|---|---|
| `*.astro`, Content Collections, `client:*`, `astro.config.mjs`, View Transitions | `Skill('astro')` + `.claude/rules/astro.md` |
| React 19 islands (`*.tsx` inside `src/components`) | `Skill('astro')` (React-in-Astro section) |
| Tailwind v4 `@theme` in `config.json::cardinals.themeSsot` | `Skill('${skills.theme}')` + `Skill('astro')` |

## Project signals

Resolved from `config.json::skills.brand` + `config.json::skills.theme`:

| Surface | Skill |
|---|---|
| HSL token canon + semantic token map | `Skill('${skills.theme}')` (currently `gpus-theme`) → `references/values/<project>-canon.md` |
| Brand voice + product canon + sales journey + CTAs | `Skill('${skills.brand}')` (currently `grupo-us`) → `references/values/<project>.md` |
| WhatsApp SSOT (when `config.json::whatsapp.enabled = true`) | `Skill('${skills.brand}')` → `references/whatsapp-ssot.md` |

## Cardinal rules

Non-negotiable invariants (8 cardinals) live in **`.claude/CLAUDE.md § Cardinal rules`**. Values that vary per project (render mode, SSOT file paths, package manager, WhatsApp toggle) resolve from `.claude/config.json::cardinals` + `::whatsapp` + `::tooling`. Rules here support those cardinals — never override or duplicate.

## Cross-project portability

- **Universal** (`frontend.md`, `DESIGN.md`, `stability.md`, `seo.md`) — drop-in to any project.
- **Generified** (`commit.md`, `mcp.md`, `commands.md`) — portable once `.claude/config.json` is filled (scopes, package manager, skill names).
- **Stack overlay** (`astro.md`) — applies only when `config.json::skills.stack = astro`. Other stacks: replace with matching tech-stack rule (e.g., `nextjs.md`, `remix.md`).
- **Brand SSOT** (skills `${skills.brand}`, `${skills.theme}`) — fork the `values/<project>.md` file per new project; keep the `template.md` schema.

Bootstrap a new Grupo US project from this seed → `.claude/scaffolding/BOOTSTRAP.md`.
