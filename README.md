# gpus-site — Site institucional Grupo US

> Vitrine institucional do ecossistema Grupo US. Hub PT-BR de tráfego que despacha leads para funis externos (`drasacha.com.br`, `namesa.gpus.com.br`, `neondash.com.br`, `trintae3.drasacha.com.br`).
> **Produção:** [`https://grupous.com.br`](https://grupous.com.br)

Brief de produto → [`PRODUCT.md`](PRODUCT.md) · Design system → [`DESIGN.md`](DESIGN.md) · Regras para agentes → [`AGENTS.md`](AGENTS.md)

---

## Stack

- **Astro 6** — framework, com renderização estática e ilhas React onde necessário.
- **Tailwind CSS v4** — via plugin Vite (`@tailwindcss/vite`). Tokens em `src/styles/global.css` com `@theme {}` (sem `tailwind.config.js`).
- **React 19 + motion + lucide-react** — ilhas interativas pontuais.
- **Bun** — runtime, package manager, executor. Single package manager — **nunca usar `npm` / `yarn` / `pnpm`**.
- **Biome + oxlint** — formatação e lint. CI bloqueia hex inline e drift de estilo.
- **Lefthook** — git hooks (`prepare` no `bun install` instala).
- **Deploy: Vercel** — `bun run build` → `dist/`. Project ID em [`.claude/config.json`](.claude/config.json) `vercel`.

---

## Comandos

| Tarefa | Comando |
|---|---|
| Instalar dependências | `bun install` |
| Dev server | `bun run dev` |
| Type-check (Astro) | `bunx astro check` |
| Lint (biome + oxlint, sem fix) | `bun run lint` |
| Lint + auto-fix | `bun run lint:fix` |
| Build de produção | `bun run build` |
| Preview do build | `bun run preview` |
| Smoke test (HTML + meta básicos) | `bun run smoke-test` |
| Auditar URLs externas alcançáveis | `bun run check:external-urls` |
| Lighthouse audit local | `bun run lighthouse:audit` |
| Pre-deploy (lint → check → build) | `bun run predeploy` |

Scripts custom em [`scripts/`](scripts/): `check-external-urls.mjs`, `smoke-test.mjs`, `lighthouse-audit.mjs`.

---

## Estrutura

```
gpus-site/
├── src/
│   ├── pages/              # Rotas estáticas (.astro)
│   │   ├── index.astro
│   │   ├── curso-auriculo.astro
│   │   ├── mentoria-black-neon.astro
│   │   ├── otb.astro
│   │   ├── sobre.astro
│   │   ├── contato.astro
│   │   ├── termos.astro
│   │   ├── politica-de-privacidade.astro
│   │   └── 404.astro
│   ├── components/         # .astro + ilhas .tsx
│   │   ├── home/           # Seções do home (hero, products grid, journey, etc.)
│   │   ├── landing/        # Componentes compartilhados de landing de produto
│   │   ├── about/          # Página sobre / equipe
│   │   ├── layout/         # Header, footer, navegação
│   │   ├── shared/         # Primitivas reusadas
│   │   └── ui/             # Botões, badges, chrome
│   ├── content/            # Astro Content Collections
│   │   ├── products/       # JSON por produto (schema em content.config.ts)
│   │   └── team/           # JSON por membro do time
│   ├── content.config.ts   # Schemas Zod para products + team
│   ├── layouts/            # Layout.astro (head, fontes, lang)
│   ├── lib/                # Helpers (whatsapp.ts, utils)
│   └── styles/global.css   # @theme + utilities + reveal animations
├── public/                 # favicon, og-image, logo, robots.txt
├── scripts/                # smoke, lighthouse, external URL check
├── docs/                   # Planos, logs de aprendizado, logos
├── evals/                  # Autoresearch trail + per-area compound.md
├── .claude/
│   ├── CLAUDE.md           # Tier 1 behavioral
│   ├── rules/              # Tier 2 universal (DESIGN, frontend, stability, seo)
│   ├── skills/             # Tier 3 (grupo-us, gpus-theme, astro, planning, ...)
│   ├── agents/             # Subagent definitions
│   ├── commands/           # Slash commands (/plan, /design, /verify, ...)
│   ├── templates/          # Protocols (delegation, recovery, audit)
│   ├── hooks/              # Hooks Python (agent_routing_hint, etc.)
│   └── config.json         # Paths, tooling, gates, vercel IDs
├── AGENTS.md               # Behavioral + orchestrator (Tier 1)
├── PRODUCT.md              # Brief do site institucional
├── DESIGN.md               # Hub de design (frontmatter + routing)
├── astro.config.mjs        # Site, redirects, fonts, sitemap, integrations
├── biome.json              # Linter + formatter config
├── tsconfig.json
├── lefthook.yml            # Git hooks
└── package.json            # Bun-only, scripts canônicos
```

---

## Páginas e redirects

**Páginas estáticas** (servidas em `grupous.com.br/<slug>`):

- `/` (`index.astro`) — vitrine institucional + grade de produtos
- `/curso-auriculo` — Curso de Auriculoterapia
- `/mentoria-black-neon` — Mentoria Black NEON
- `/otb` — OTB (MBA)
- `/sobre` — institucional / Dra. Sacha + equipe
- `/contato` — formulário + WhatsApp SDR Laura
- `/termos` · `/politica-de-privacidade` — legal
- `/404` — fallback

**Redirects** para funis externos (configurados em [`astro.config.mjs`](astro.config.mjs) — Astro emite páginas HTML com `<meta http-equiv="refresh">` + canonical para destino; o 301 acontece na camada Vercel quando configurado):

| Path interno | Destino externo |
|---|---|
| `/na-mesa-certa` | `https://namesa.gpus.com.br/` |
| `/trintae3` | `https://trintae3.drasacha.com.br/` |
| `/comunidade-us` | `https://drasacha.com.br/pagina-de-inscricao-comu-us/` |
| `/neon-dash` | `https://neondash.com.br/` |

Sitemap filtra esses paths para evitar split-index (per [`.claude/rules/seo.md`](.claude/rules/seo.md) § Sitemap).

**Adicionar / mover um redirect** → atualizar (a) `redirects` em `astro.config.mjs`, (b) `filter` do sitemap no mesmo arquivo, (c) `externalSiteUrl` / `cta.url` no JSON do produto em `src/content/products/`. Os três movem em um único commit — per `astro` skill § redirect tri-sync.

---

## Content Collections

Astro 6 com **config explícita** (`src/content.config.ts`), não inferência. Duas collections:

- **`products`** — um JSON por produto em `src/content/products/`. Schema Zod com `hero`, `painPoints` (≥3), `pillars` (=3), `benefits` (≥4), `deliverables`, `bonus`, `story`, `bio`, `differentials` (≥2), `faqs` (≥3), `cta` (label + url + whatsappMessage), `testimonials` (≥2), `event` opcional.
- **`team`** — um JSON por membro em `src/content/team/`. Schema com `name`, `role`, `bio`, `photo`, `order`, `social`.

Páginas consomem via `getCollection('products' | 'team')` no frontmatter `.astro`. Componentes recebem `.data` plano, nunca a entrada Astro completa.

Schema completo → [`src/content.config.ts`](src/content.config.ts).

---

## Deploy

**Vercel** — auto-deploy via integração GitHub.

- **Branch `dev-test`** → preview / staging.
- **Branch `main`** → produção (`https://grupous.com.br`).
- **Build:** `bun run build` → `dist/`. Vercel detecta automaticamente.
- **Pre-deploy local:** `bun run predeploy` (lint → astro check → build) antes de push.

**Branch protection (HARD RULE)** — nunca trabalhar direto em `main`. Fluxo é `dev-test → PR → user aprova → user faz merge`. Detalhe completo em [`.claude/CLAUDE.md`](.claude/CLAUDE.md) § Branch protection.

---

## Para agentes (Claude Code, Cursor, Codex, Aider, Continue)

Carregamento em camadas (Tier 1–3):

| Tier | Quando | Onde |
|---|---|---|
| Tier 1 (sempre) | Session start | [`AGENTS.md`](AGENTS.md) + [`.claude/CLAUDE.md`](.claude/CLAUDE.md) |
| Tier 2 (on demand) | Match da matriz de roteamento | [`.claude/rules/{DESIGN,frontend,stability,seo}.md`](.claude/rules) |
| Tier 3 (skills + refs) | Auto-trigger por descrição | [`.claude/skills/*`](.claude/skills) |

Skills principais: `astro` (stack), `gpus-theme` (tokens HSL Navy/Gold), `grupo-us` (voz + IDs + jornada), `planning`, `senior-prompt-engineer`. Índice em [`.claude/rules/README.md`](.claude/rules/README.md).

Comandos disponíveis: `/plan`, `/design`, `/research`, `/implement`, `/verify`, `/debug`, `/perf`, `/evolve`, `/delegate`, `/recover`, `/prime` — detalhe em [`AGENTS.md`](AGENTS.md) § Commands.

---

## Para humanos

- **Voz de marca + jornada + IDs de produto** → `.claude/skills/grupo-us/references/manual-resumo.md`
- **Tokens visuais + contrast safety** → `.claude/skills/gpus-theme/SKILL.md`
- **Bug catalog + debug triage** → `.claude/rules/stability.md` § Debug triage matrix
- **Logs de decisões cronológicas** → [`docs/learnings-log.md`](docs/learnings-log.md)
- **Planos arquivados** → [`docs/plans/`](docs/plans)
- **Autoresearch trail / `/evolve` runs** → [`evals/`](evals)
