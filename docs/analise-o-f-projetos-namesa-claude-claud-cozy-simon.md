# Plano — Sincronizar docs raiz do gpus-site com referências de namesa + neondash

## Contexto

Analisar quatro arquivos de referência em projetos vizinhos e gerar equivalentes neste repositório seguindo as regras e estrutura já consolidadas em `gpus-site`:

- `F:\Projetos\namesa\.claude\CLAUDE.md` — config Claude curto e prático para Astro 6 + Bun + Tailwind v4 + 3 ilhas React (mesmo stack que `gpus-site`).
- `F:\Projetos\neondash\AGENTS.md` — Tier 1 behavioral + cardinal rules + WISC loading protocol.
- `F:\Projetos\neondash\DESIGN.md` — design system com frontmatter (cores, tipografia, componentes), creative north star, anti-references.
- `F:\Projetos\neondash\PRODUCT.md` — brief de produto (users, purpose, brand personality, anti-refs, design principles, a11y).
- `F:\Projetos\neondash\README.md` — overview do monorepo Turbo.

**Estado atual do `gpus-site`:**

| Arquivo | Existe? | Observação |
|---|---|---|
| `AGENTS.md` (raiz) | ✓ | Behavioral + orchestrator, aponta para skills/rules. |
| `.claude/CLAUDE.md` | ✓ | Intent classification, branch protection, agent auto-routing, pointers. |
| `.claude/rules/DESIGN.md` | ✓ | Regras universais Tier 2 portáveis. |
| `.claude/skills/gpus-theme/` | ✓ | SSOT canônico de tokens HSL Navy/Gold. |
| `.claude/skills/grupo-us/` | ✓ | SSOT canônico de voz de marca, produtos, jornada. |
| `DESIGN.md` (raiz) | ✗ | **Lacuna.** Hub project-level de design. |
| `PRODUCT.md` (raiz) | ✗ | **Lacuna.** Brief de produto. |
| `README.md` (raiz) | ✓ (placeholder) | Template `bun create astro@latest` default. |

**Cardeal não-negociável:** `AGENTS.md` raiz proíbe duplicar conteúdo de regras/skills. Novos arquivos devem **apontar para** `.claude/rules/*`, `gpus-theme`, `grupo-us`, `astro` em vez de **copiar**.

---

## Complexidade e camadas

- **Complexidade:** L4 (medium — múltiplos arquivos novos, sem código de runtime).
- **Camadas tocadas:** Documentação / Cross-cutting apenas.
- **Verify:** `bunx astro check && bun run build`.

## Suposições

- `[ASSUMED]` Arquivos vão **na raiz** (`PRODUCT.md`, `DESIGN.md`, `README.md`).
- `[ASSUMED]` Não recriar `AGENTS.md` nem `.claude/CLAUDE.md`.
- `[ASSUMED]` `PRODUCT.md` reflete **site institucional grupous.com.br** (vitrine + hub).
- `[ASSUMED]` `DESIGN.md` raiz é **hub navegacional** apontando para `gpus-theme` + `.claude/rules/DESIGN.md`.
- `[ASSUMED]` `README.md` raiz é leitura humana.

---

## Fases

### Fase 1 — `PRODUCT.md` raiz

Register, Users, Product Purpose, Brand Personality, Anti-references (4 gates), Design Principles (5), Accessibility & Inclusion. Footer com cross-links. Alvo: ~75–110 linhas.

### Fase 2 — `DESIGN.md` raiz

Frontmatter YAML resumido (tokens reais do `src/styles/global.css`) + corpo: Overview + Creative North Star, Tokens canon, Tipografia, Named Rules, Componentes-resumo, Do/Don't, Routing footer. Alvo: ~150–185 linhas.

### Fase 3 — `README.md` raiz

Identidade, Stack, Comandos (tabela do `package.json::scripts`), Estrutura, Páginas + redirects (do `astro.config.mjs`), Content collections (do `content.config.ts`), Deploy, guia agentes + humanos. Alvo: ~150–180 linhas.

---

## Arquivos a reusar (não inventar)

- `.claude/rules/{DESIGN,frontend,stability,seo}.md`
- `.claude/skills/gpus-theme/SKILL.md` + `references/`
- `.claude/skills/grupo-us/SKILL.md` + `references/`
- `astro.config.mjs` — redirects + `site:` SSOT
- `package.json` — scripts SSOT
- `.claude/config.json::vercel` — deploy IDs

---

## Verificação

```bash
bunx astro check
bun run build
```

**Smoke manual:**

1. Grep negativo: hex inline fora de citações pedagógicas → vazio.
2. Grep positivo: PRODUCT cita `gpus-theme`/`grupo-us`; DESIGN cita `rules/DESIGN.md` + `gpus-theme`; README cita `AGENTS.md`.

---

## Sequência

1. Branch `dev-test` (branch protection: nunca commit em main).
2. Escrever `PRODUCT.md` → `DESIGN.md` → `README.md`.
3. Verify (`astro check + build`).
4. Smoke grep.
5. Commit: `docs: adicionar PRODUCT.md, DESIGN.md, README.md raiz como hubs do produto institucional`.
6. Push `dev-test` + abrir PR para review do usuário.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Duplicar conteúdo de skills | Cada bloco declara fonte. |
| `PRODUCT.md` confundir site com NeonDash | Foco em "vitrine + hub", não "plataforma operacional". |
| `DESIGN.md` virar template SaaS | Limite ~185 linhas, cita fonte em cada bloco. |
| `README.md` com comandos inventados | Copiar exato de `package.json::scripts`. |
