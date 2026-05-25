# Plano — Refatorar `.claude/` em seed-template para novos projetos Grupo US

## Context

O `.claude/` atual de `gpus-site` já é ~70% portável (agents/, commands/, templates/, rules universais, skills genéricas), mas 30% está acoplado ao projeto. O acoplamento se concentra em quatro pontos:

1. **`CLAUDE.md` + `AGENTS.md`** — routing matrix referencia arquivos físicos (`src/content/products/`, `src/lib/whatsapp.ts`, `mentoria-black-neon.astro`); cardinals #4 + #6 fixam decisões que outros projetos podem não tomar (static-only, WhatsApp SSOT).
2. **`config.json`** — campos suficientes hoje, mas não cobrem WhatsApp, commit scopes, brand-skill mapping, cardinals como dados.
3. **Skills brand-locked** (`grupo-us`, `gpus-theme`, `astro/references/gpus-overlay.md`) — valores e estrutura misturados no mesmo arquivo.
4. **Rules híbridas** (`commit.md` com scopes fixos, `mcp.md` com "Bun-only" hardcoded, `astro.md` com invariantes gpus-site).

**Objetivo:** virar o `.claude/` num seed clonável. Novo projeto Grupo US = `git clone` + editar `config.json` + fork brand-values + roda. Brand permanece GPUS (skills `grupo-us`/`gpus-theme` são canon do grupo, não do site). Stack default continua Astro/Bun/Tailwind v4 mas parametrizado.

**Motivação:** o grupo planeja novos verticais/sites (drasacha.com.br, novos produtos institucionais). Hoje cada onboarding repete trabalho de adaptação manual. Esse refactor encurta para ~30 min.

---

## Arquitetura — três camadas

```
Layer A — UNIVERSAL (zero refs a projeto/brand/stack — porta verbatim)
  agents/                         (12 arquivos)
  commands/                       (15 arquivos)
  templates/                      (6 arquivos)
  rules/{frontend,DESIGN,stability,seo}.md
  skills/{planning,debugger,senior-prompt-engineer,
          evolution-core(menos gpus-profile.md),
          performance-optimization,ui-ux-pro-max,
          frontend-design,skill-creator,impeccable,xlsx}

Layer B — GRUPO US CANON (compartilhado entre todos projetos do grupo)
  skills/grupo-us/                — brand voice, journey, products schema
  skills/gpus-theme/              — Navy/Gold tokens, Playfair+Inter

Layer C — PROJECT OVERLAY (cada projeto preenche)
  config.json                     — SSOT de todos os values
  CLAUDE.md + AGENTS.md           — referenciam `${config.*}` em vez de hardcode
  rules/{commit,mcp,commands,astro}.md  — generificadas, params de config
  skills/astro/references/project-overlay.md  — render mode + redirects + Layout
```

---

## Fases

### Phase 1 — Expandir `config.json` (SSOT total)

Arquivo: `.claude/config.json` (protected — confirmar antes de editar).

Adicionar campos (manter os existentes):

```json
{
  "project": {
    "name": "gpus-site",
    "displayName": "Grupo US — Site Institucional",
    "domain": "grupous.com.br",
    "locale": "pt-BR",
    "stack": "astro-static-tailwindv4",
    "brand": "grupo-us"
  },
  "skills": {
    "brand": "grupo-us",
    "theme": "gpus-theme",
    "stack": "astro"
  },
  "cardinals": {
    "renderMode": "static-only",
    "spa": "forbidden",
    "ssrAdapter": "forbidden",
    "contentSsot": "src/content/",
    "themeSsot": "src/styles/global.css"
  },
  "whatsapp": {
    "enabled": true,
    "sdrName": "Laura",
    "sdrE164": "+556294705081",
    "messagePrefix": "Olá, Laura!",
    "ssotFile": "src/lib/whatsapp.ts"
  },
  "commit": {
    "scopes": ["site","theme","content","seo","astro","redirects","config","scripts",".claude","deps","a11y","perf"]
  }
}
```

`whatsapp.enabled=false` em projeto sem fluxo WhatsApp → routing row + cardinal #6 + protectedFile entry ficam dormentes. Documentar como gating em `BOOTSTRAP.md`.

### Phase 2 — Generificar Layer A residual

Quatro arquivos têm refs hardcoded que precisam virar placeholders:

- `rules/mcp.md` — substituir blocos "Bun only / `bun run` / `bunx`" por `${tooling.packageManager}` (já presente em `_shared.md § 0` resolver pattern). Manter exemplo entre parênteses ("ex: bun, pnpm, npm").
- `rules/commit.md` — bloco **Scopes** vira lista dinâmica: "Scopes: ver `config.json::commit.scopes`." Exemplos da seção podem manter `feat(site)` etc. mas adicionar nota "(scope vem da lista do `config.json`)".
- `rules/commands.md` — frase "11 comandos" e "Bun only" trocadas por `${commands.count}` e `${tooling.packageManager}` (ou só remover contagem, calcular ao vivo).
- `rules/README.md` — header diz "gpus-site (Astro 6 + React 19 + Tailwind v4 + Bun + static-only MPA, deploy Railway)". Trocar por "para `${project.displayName}` (stack `${project.stack}`)" + nota "valores resolvem de `.claude/config.json`".

Padrão de resolução: comandos já leem `.claude/config.json` em start (per `_shared.md § 0`). Reusar.

### Phase 3 — Split skills brand-locked (`grupo-us`, `gpus-theme`, `astro/gpus-overlay`)

Reorganizar para **structure + values** em três skills.

#### `skills/grupo-us/`

```
SKILL.md                              # generic (já é)
references/
  template.md          (NEW)          # schema vazio: Company, Products, Journey, People, Support, Voice
  values/
    gpus-site.md       (MOVE/MERGE)   # consolida manual-resumo + produtos-e-rotas + conflitos-fontes + cultura-activa
    <new-project>.md   (futuro)       # cada novo projeto cria o seu
  whatsapp-ssot.md                    # mecânica generificada; valores vêm de config.json::whatsapp
```

`SKILL.md` description aponta para `values/${project.name}.md` como ponto de entrada de brand canon.

#### `skills/gpus-theme/`

```
SKILL.md                              # generic
assets/
  components.json                     # já generic
  tailwind-theme.ts                   # já generic
  theme-tokens.css                    # mantém como GPUS canon (referência opcional p/ novos projetos)
references/
  template.md          (NEW)          # Tailwind v4 @theme schema + shadcn config schema (sem HSL)
  values/
    gpus-canon.md      (RENAME)       # de css-variables.md — Navy/Gold HSL + Playfair+Inter
  shadcn-config.md                    # já generic
```

#### `skills/astro/references/`

```
core-concepts.md, islands-architecture.md, styling-tailwind.md,
performance.md, view-transitions.md, troubleshooting.md       # já generic — manter

gpus-overlay.md  →  RENAME para project-overlay-template.md   # estrutura (render-mode, redirects tri-sync, Layout contracts) sem valores
values/
  gpus-site-overlay.md  (NEW)                                  # valores GPUS: forbidden client directives específicos, smoke commands com slugs reais, layout copy ("Pular para conteúdo principal")
```

### Phase 4 — Refatorar `CLAUDE.md` + `AGENTS.md`

`CLAUDE.md`:
- **Project identity** — frase usa `${project.displayName}`, `${project.purpose}`, `${project.stack}`.
- **Cardinal #4** "Never use SPA" → mantém UNIVERSAL, mas adiciona "(when `${cardinals.renderMode} = static-only` — see config.json)".
- **Cardinal #6** "Never inline wa.me/..." → condiciona em "(applies when `${whatsapp.enabled} = true`)".
- **Cardinal #5** Content Collections SSOT → genericiza referência: "`${cardinals.contentSsot}`" em vez de `src/content/`.
- **Cardinal #7** Theme SSOT → "`${cardinals.themeSsot}`".
- **Routing matrix** — colunas "Implement in" usam `${paths.*}` placeholders + exemplos como nota. Linha WhatsApp condiciona em `whatsapp.enabled`. Linha "New page / product landing" cita exemplo (`mentoria-black-neon.astro`) como reference, não como template.
- **Pointers Tier 3** — skill names vêm de `${skills.brand}`, `${skills.theme}`, `${skills.stack}` em vez de hardcode.

`AGENTS.md`:
- **Tier loading** já generic.
- **Core principles + Design philosophy** universal.
- **Skills section** — lista skills vem de `${skills.*}` resolvido.
- **Recent learnings** — esvaziar/dropar (são exemplos GPUS); mover para `docs/learnings-log.md` ou criar `LEARNINGS.template.md`.
- **Where rules live** — substituir refs específicas (`src/lib/whatsapp.ts`, `mentoria-black-neon.astro`) por placeholders + nota "ver config.json::whatsapp / config.json::paths".

Reutilizar pattern de resolução de `${var}` já existente em `_shared.md § 0` (Config Loader). Aplicação: agents/skill-creator quando lendo CLAUDE.md/AGENTS.md deve resolver placeholders contra config.json ao vivo (já é design implícito do harness).

### Phase 5 — Bootstrap kit (`.claude/scaffolding/`)

Criar pasta nova `.claude/scaffolding/`:

- `BOOTSTRAP.md` — checklist passo-a-passo para clonar e iniciar novo projeto do grupo:
  1. Clone `gpus-site` para nova pasta com nome do projeto.
  2. Limpar repo: deletar `src/content/products/*` (manter `_template.json`), deletar pages específicas (`/mentoria-black-neon.astro` etc.), limpar redirects de `astro.config.mjs`.
  3. Editar `.claude/config.json` campos: `project.name`, `displayName`, `domain`, `locale`, `stack`, `whatsapp.*`, `cardinals.*`, `commit.scopes`.
  4. Criar `.claude/skills/grupo-us/references/values/<new-project>.md` (ou reaproveitar `gpus-site.md` se mesma vertical) com Company/Products/Journey específicos.
  5. Criar `.claude/skills/astro/references/values/<new-project>-overlay.md` com forbidden directives + smoke patterns.
  6. Decidir se brand canon = GPUS (mantém `gpus-theme/values/gpus-canon.md`) ou nova brand (fork `gpus-canon.md` → `<brand>-canon.md` com nova paleta HSL).
  7. Rodar `bun install && bunx astro check && bun run build` para validar.
  8. Criar primeira página + primeiro produto.
- `init.example.json` — config.json comentado com explicação de cada campo.
- `RENAME-MAP.md` — tabela "arquivo do gpus-site → equivalente no novo projeto" para guiar limpeza.

Decisão: **não** criar script automatizado (sed/template engine). Checklist humano + edição manual evita coupling com tooling externo e mantém o seed legível. Pode-se adicionar script depois se virar dor.

### Phase 6 — Validar gpus-site continua funcionando

Após todas mudanças, gpus-site precisa rodar idêntico ao estado atual. Mudanças são puramente de organização interna `.claude/`.

```bash
bun run lint
bunx astro check
bun run build
bun run check:external-urls
bun run smoke-test         # se existir no package.json
```

Manual:
- Abrir 3 páginas (`/`, `/mentoria-black-neon`, `/trintae3` redirect) — verificar sem regressão.
- Tab pelo skip link + FAQ keyboard + WhatsApp CTA — confirmar comportamento idêntico.
- Lighthouse em `/` — comparar com baseline atual.

Garantia de não-regressão: nada em `src/` muda. Só `.claude/` reorganiza.

---

## Critical files (modificações)

| Arquivo | Ação |
|---|---|
| `.claude/config.json` | Expandir schema (project.*, skills.*, cardinals.*, whatsapp.*, commit.*) |
| `.claude/CLAUDE.md` | Generificar cardinals + routing + pointers via `${config.*}` |
| `.claude/rules/mcp.md` | "Bun" → `${tooling.packageManager}` |
| `.claude/rules/commit.md` | Scopes → `config.json::commit.scopes` |
| `.claude/rules/commands.md` | Generificar contagem + PM refs |
| `.claude/rules/README.md` | Header generic + nota "values em config.json" |
| `AGENTS.md` (root) | Generificar Tier loading, skills section, "Where rules live", limpar Recent learnings |
| `.claude/skills/grupo-us/references/` | Criar `template.md`, mover canon → `values/gpus-site.md` |
| `.claude/skills/gpus-theme/references/` | Criar `template.md`, renomear `css-variables.md` → `values/gpus-canon.md` |
| `.claude/skills/astro/references/gpus-overlay.md` | Renomear → `project-overlay-template.md` + criar `values/gpus-site-overlay.md` |
| `.claude/scaffolding/` (NEW) | `BOOTSTRAP.md` + `init.example.json` + `RENAME-MAP.md` |

Não tocar: `agents/`, `commands/`, `templates/`, `rules/{frontend,DESIGN,stability,seo}.md`, skills genéricas listadas em Layer A. Já portáveis.

---

## Reutilização (LEVER)

- Config Loader pattern já existe em `_shared.md § 0` — comandos leem `config.json` em start. Estender o resolver para suportar todos os novos campos.
- Frontmatter `globs:` auto-loading em rules existe — manter; novos values files (`values/gpus-site.md`) não precisam glob, são consultados via Skill description match.
- `evolution-core` skill já tem split `gpus-profile.md` (project) vs core (generic) — replicar o padrão para `grupo-us` + `gpus-theme`.

---

## Verification

1. Gates rodam clean: `bun run lint && bunx astro check && bun run build` (zero erros).
2. `bun run check:external-urls` clean.
3. `bun run smoke-test` clean (se existir).
4. Simular onboarding: criar branch dummy `dev-test/scaffold-validation`, copiar `.claude/` para `/tmp/projeto-x-dummy`, seguir `BOOTSTRAP.md`, editar config.json para projeto fictício, conferir que `CLAUDE.md` + `AGENTS.md` permanecem lógicos quando lidos sem refs GPUS.
5. Leitura cruzada: pedir agente Explore para "encontrar refs gpus-site/Grupo US restantes em `.claude/` fora de skills/grupo-us, skills/gpus-theme e values/" — esperado: zero matches.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Quebrar gpus-site | Mudanças isoladas em `.claude/`; src intocado; gates rodam após cada fase |
| Skill auto-trigger quebrar com rename `gpus-overlay.md` → `project-overlay-template.md` | Confirmar via grep que nenhum SKILL.md frontmatter referencia o nome antigo; atualizar refs |
| Config schema drift entre projetos | Documentar schema em `init.example.json`; opcional JSON Schema validation futuramente |
| Brand canon (Navy/Gold) "vazar" entre projetos novos do grupo | Deixar explícito em BOOTSTRAP step 6: brand-skill é per-projeto, fork ou compartilha intencionalmente |
| Cardinals condicionais (#4 #6) confundirem agente | Manter texto do cardinal universal + nota condicional clara em parênteses; testar com agente em projeto sem WhatsApp |
| Migração quebrar evolution-core memory paths | `evolution-core` lê paths via config.json; verificar que campos novos não conflitam |
