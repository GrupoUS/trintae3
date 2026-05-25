# Rename Map — `gpus-site` → new project

> Field-by-field map of every hardcoded gpus-site value to its new-project replacement. Use during Step 2–6 of `BOOTSTRAP.md`.
> If a row says "DELETE", that surface doesn't carry over — the new project re-creates it from scratch.

---

## `.claude/config.json`

| Field | gpus-site value | New project action |
|---|---|---|
| `project.name` | `gpus-site` | Replace with new project slug |
| `project.displayName` | `Grupo US — Site Institucional` | Replace |
| `project.purpose` | `Static marketing site for Grupo US.` | Replace |
| `project.stack` | `astro-static-tailwindv4` | Keep if same stack; else swap to e.g., `nextjs-app-router` |
| `project.stackSummary` | `Astro 6 (static-only) · Bun · Tailwind CSS v4 · React 19 (islands; minimal) · Railway · Lucide React · Playfair Display + Inter` | Replace |
| `project.domain` | `grupous.com.br` | Replace |
| `project.stagingUrl` | `http://localhost:4321` | Keep if Astro default port; else swap |
| `project.productionUrl` | `https://grupous.com.br` | Replace |
| `project.locale` | `pt-BR` | Keep or replace |
| `project.brand` | `grupo-us` | Keep when staying Grupo US; replace when new brand |
| `skills.brand` | `grupo-us` | Match `project.brand` |
| `skills.theme` | `gpus-theme` | Keep when same brand visuals; fork to `<new>-theme` when palette differs |
| `skills.stack` | `astro` | Match the tech-stack skill folder name |
| `cardinals.renderMode` | `static-only` | Keep, or switch to `ssr` / `hybrid` |
| `cardinals.contentSsot` | `src/content/` | Keep if Astro Content Collections |
| `cardinals.themeSsot` | `src/styles/global.css` | Keep if Tailwind v4 `@theme` |
| `cardinals.iconLibrary` | `lucide-react` | Keep or replace |
| `whatsapp.enabled` | `true` | Set `false` if new project has no WhatsApp funnel |
| `whatsapp.sdrName` | `Laura` | Replace if different SDR |
| `whatsapp.sdrE164` | `+556294705081` | Replace |
| `whatsapp.messagePrefix` | `Olá, Laura!` | Replace |
| `whatsapp.ssotFile` | `src/lib/whatsapp.ts` | Keep filename pattern; rename if SSOT moves |
| `commit.scopes` | `[site, theme, content, seo, astro, redirects, config, scripts, .claude, deps, a11y, perf]` | Edit per project surfaces |
| `protectedFiles.exact` (`src/lib/whatsapp.ts`) | included | Remove when `whatsapp.enabled = false` |
| `tooling.deployer` | `railway` | Replace with new project deployer |

---

## `src/` content + pages (DELETE per Step 2 of BOOTSTRAP)

| Path | Action |
|---|---|
| `src/content/products/mentoria-black-neon.json` | DELETE |
| `src/content/products/trintae3.json` | DELETE |
| `src/content/products/comunidade-us.json` | DELETE |
| `src/content/products/na-mesa-certa.json` | DELETE |
| `src/content/products/neon-dash.json` | DELETE |
| `src/content/products/otb.json` | DELETE |
| `src/content/products/curso-auriculo.json` | DELETE |
| `src/pages/mentoria-black-neon.astro` | DELETE |
| `src/pages/trintae3.astro` | DELETE (or rewrite as new-project landing) |
| `src/pages/index.astro` | REWRITE — keep skeleton, swap copy |
| `src/pages/404.astro` | KEEP — generic |
| `src/layouts/Layout.astro` | KEEP — generic skeleton; update font preconnect URLs if typography changes |
| `src/styles/global.css` | KEEP if same brand visuals; override `@theme` HSL if not |
| `src/lib/whatsapp.ts` | KEEP when `whatsapp.enabled = true`; DELETE when `false` |
| `src/components/WhatsAppFloatingButton.tsx` | KEEP when `whatsapp.enabled = true`; DELETE when `false` |
| `src/components/Header.astro`, `Footer.astro` | KEEP — generic, update copy per new project |
| `src/components/landing/FAQ.astro`, `CTA.astro`, `Hero*.astro` | KEEP primitives; DELETE gpus-specific named components (e.g., `NeonStory.astro`, `TextGenerateEffect.tsx`) |

---

## `astro.config.mjs`

| Block | gpus-site content | New project action |
|---|---|---|
| `redirects: {...}` | `/comunidade-us`, `/na-mesa-certa`, `/neon-dash`, `/otb`, `/trintae3` | CLEAR — add new project redirects |
| `sitemap({ filter: ... })` | excludes gpus redirect slugs | CLEAR — refill with new project's redirect slugs |
| `site: 'https://grupous.com.br'` | gpus domain | Replace with new project domain |

---

## `.claude/skills/grupo-us/references/values/`

| Path | gpus-site content | New project action |
|---|---|---|
| `gpus-site/manual-resumo.md` | Grupo US identity, products table, journey | KEEP if same brand; FORK to `<new-project>/manual-resumo.md` with new content |
| `gpus-site/produtos-e-rotas.md` | Product ID ↔ slug ↔ route map | FORK |
| `gpus-site/conflitos-fontes.md` | Source-conflict log | FORK (likely empty for new project initially) |
| `gpus-site/cultura-activa.md` | A.C.T.I.V.A. culture | KEEP if Grupo US group; FORK if non-Grupo US |
| `template.md` | Schema for any project | NEVER edit per project |
| `whatsapp-ssot.md` | Generic mechanic | KEEP; resolves values from `config.json::whatsapp` |

---

## `.claude/skills/gpus-theme/references/values/`

| Path | gpus-site content | New project action |
|---|---|---|
| `gpus-canon.md` | Navy/Gold HSL + Playfair/Inter | KEEP if same brand visuals; FORK to `<new-project>-canon.md` with new palette |

---

## `.claude/skills/astro/references/values/`

| Path | gpus-site content | New project action |
|---|---|---|
| `gpus-site-overlay.md` | Hydration allowlist, redirect slugs, Layout copy | FORK to `<new-project>-overlay.md` |
| `../project-overlay-template.md` | Template structure | NEVER edit per project |

---

## `public/`

| Path | Action |
|---|---|
| `og-default.png` (or equivalent) | Replace with new project's default OG image |
| `favicon.*` | Replace |
| `og-mentoria-black-neon.png`, other product OGs | DELETE |

---

## What stays untouched (zero edits per project)

- `.claude/agents/*` (12 files) — all 100% generic.
- `.claude/commands/*` (15 files) — all 100% generic.
- `.claude/templates/*` (6 files) — all 100% generic.
- `.claude/rules/{frontend,DESIGN,stability,seo}.md` — universal.
- `.claude/rules/{astro,commit,mcp,commands}.md` + `README.md` — generified; resolve via `config.json` at runtime.
- `.claude/skills/{planning,debugger,senior-prompt-engineer,evolution-core,performance-optimization,ui-ux-pro-max,frontend-design,skill-creator,impeccable,xlsx}/` — generic skills.
- `.claude/skills/astro/{SKILL.md,references/{core-concepts,islands-architecture,content-collections,styling-tailwind,performance,view-transitions,troubleshooting,configuration}.md}` — generic Astro reference.
- `.claude/skills/grupo-us/references/{template.md, whatsapp-ssot.md}` — schema + mechanic.
- `.claude/skills/gpus-theme/{SKILL.md,assets/*,references/{template.md, shadcn-config.md}}` — schema + assets.
- `.claude/scaffolding/*` — this kit itself (BOOTSTRAP.md, init.example.json, RENAME-MAP.md).
- `.claude/CLAUDE.md` + root `AGENTS.md` — references resolve via `config.json` placeholders; per-project values land in `config.json`.

---

## Verification before first PR

```bash
bun install
bunx astro check
bun run lint
bun run build
bun run check:external-urls    # if external redirects defined
```

All must pass. If any fails, fix root cause per `.claude/rules/stability.md § Debug triage matrix`.
