# Brand canon — template

> Schema for any Grupo US project's brand canon. Fork into `references/values/<project>/` and fill each section.
> This file is **structure only**. Concrete values for the current project live in `references/values/<project>/<section>.md`.
> Resolved alongside `.claude/config.json::project` + `::whatsapp` + `::skills.brand`.

---

## When to use

- Onboarding a new Grupo US vertical / site.
- Drafting a new project's brand canon files.
- Auditing an existing project's canon for completeness vs this schema.

For the **gpus-site current canon**, read `references/values/gpus-site/{manual-resumo,produtos-e-rotas,conflitos-fontes,cultura-activa}.md` directly.

---

## Required sections (one file per section under `values/<project>/`)

### `manual-resumo.md` — identity + journey + canon

Minimum sections:

- **Company identity** — name, mission, vision, values; founder(s); regulated context (e.g., health aesthetics education).
- **Voice** — tone of voice, locale (`config.json::project.locale`), forbidden phrases, signature phrases.
- **Products** — table: `id` (`produto_*`) ↔ `name` ↔ `summary` ↔ `slug` ↔ `route` (internal or external).
- **Student / Customer journey** — recommended progression from entry to top of pyramid. Justify ordering.
- **People** — table: `id` (`pessoa_*`) ↔ role ↔ contact handle ↔ surface (site / WhatsApp / Notion).
- **Support contacts** — email, WhatsApp SSOT (cross-ref `whatsapp-ssot.md` mechanic).
- **External funnels** — list (e.g., drasacha.com.br, Kiwify), owner team, last-verified date.

### `produtos-e-rotas.md` — ID ↔ slug ↔ route mapping

Table per product:

| Product ID | Slug | Internal route | External destination (if any) | Status (active / archived) |
|---|---|---|---|---|

Cross-ref with `astro.config.mjs::redirects` to confirm tri-sync.

### `conflitos-fontes.md` — source-conflict decisions

When a product / fact appears differently across sources (e.g., Google Doc manual vs site copy vs drasacha funnel), document:

- The conflict (which sources disagree on which field).
- The decision (which source wins, with date).
- Pricing rules (currency, ranges, exchange rate caveats).

Never silently merge divergent facts. Log here first.

### `cultura-activa.md` — culture + anti-patterns

- Cultural acronym / values (e.g., A.C.T.I.V.A for Grupo US).
- Each letter / value → behavior expected + behavior forbidden.
- Anti-patterns observed in past copy / interactions.

---

## Optional sections

- **Locale specifics** — pt-BR vs other locales: tu/você usage, formal vs colloquial registers.
- **AI / RAG IDs** — namespace convention (`produto_*`, `pessoa_*`, `empresa_*`) so RAG retrieval is deterministic.

---

## File layout (new project)

```
.claude/skills/${skills.brand}/references/
├── template.md                    # this file — never edit per project
├── whatsapp-ssot.md               # mechanic (generic — values resolve from config)
└── values/
    └── <project>/                 # e.g., gpus-site/, drasacha-site/, new-vertical/
        ├── manual-resumo.md       # required
        ├── produtos-e-rotas.md    # required
        ├── conflitos-fontes.md    # recommended
        └── cultura-activa.md      # recommended
```

`SKILL.md` description points to `references/values/${project.name}/manual-resumo.md` as the canonical entry point per project.

---

## When to load more

- Concrete brand canon (gpus-site): `references/values/gpus-site/manual-resumo.md`
- WhatsApp mechanic: sibling `whatsapp-ssot.md`
- Brand identity / project metadata: `.claude/config.json::project`
- Theme tokens canon: `Skill('${skills.theme}')` → `references/values/<project>-canon.md`
