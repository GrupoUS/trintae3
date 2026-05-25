---
name: grupo-us
description: Use when writing Grupo US copy, answering questions about company products, aligning brand voice or sales journeys, mapping CTAs, or reconciling the institutional Astro repo with the internal Google manual and drasacha.com.br funnel. Project values resolve from references/values/${project.name}/.
---

# Grupo US — company and products

Domain knowledge for **Grupo US** (health aesthetics education ecosystem): brand voice, official product IDs, student journey, culture, routes, and source-of-truth rules.

> This skill carries the **brand canon shared across all Grupo US projects**. Per-project values (product IDs, route mapping, conflict log, culture) live in `references/values/<project>/` — see `template.md` for the section schema.

## When to use

- Draft or review **Portuguese** marketing copy, FAQ, WhatsApp scripts, or landing messaging for Grupo US offers.
- Decide **which product** fits a persona or funnel stage (student journey).
- Edit content collection product JSONs (path from `config.json::cardinals.contentSsot`) or institutional pages — keep alignment with schema and avoid inventing facts.
- **UI or layout** that changes home journey, product grid order, CTAs, landing copy, or product JSON — load this skill **early**, together with `Skill('${skills.stack}')` / `Skill('${skills.theme}')` (see `.claude/commands/design.md`).
- Explain **differences** between institutional site (`config.json::project.domain`), external funnels (e.g., **drasacha.com.br**), and the **Google Doc manual**.
- Onboard an agent to **IDs** (`produto_*`, `pessoa_*`, `empresa_grupo_us`) for tools or RAG.
- Onboard a **new Grupo US vertical / project** — start at `references/template.md`.

## Source hierarchy

1. **Brand voice, product IDs, internal sales logic** → read `references/values/${project.name}/manual-resumo.md` (gpus-site: from the [Google Doc](https://docs.google.com/document/d/1EV8aXBMqXG_bIKEqUs0xGZkc_xbbncweiK1ZLOpCGw0/edit?usp=drive_link); refresh via `.../export?format=txt`).
2. **Published institutional site copy and slugs** → content collection (`config.json::cardinals.contentSsot`) + [AGENTS.md](../../../AGENTS.md) (no hardcoded product copy in components).
3. **Live funnel URLs** → `cta.url`, `externalSiteUrl` in JSON, plus external funnels (e.g., **drasacha.com.br**) when the task is campaigns or external LPs.
4. **Culture** → `references/values/${project.name}/cultura-activa.md` ([Notion — Quem Somos](https://five-iguana-d79.notion.site/Quem-Somos-2694d8c589888005b889e1213682dd58)).

If sources conflict, open `references/values/${project.name}/conflitos-fontes.md` and **do not silently merge** divergent facts.

## Procedure

1. Classify the task: **institutional repo** (`config.json::project.name`), **vitrine / external funnel**, or **internal manual / IA voice**.
2. Load only the needed reference files from `references/values/${project.name}/`:
   - Identity, IDs, journey, contacts → `manual-resumo.md`
   - Culture behaviors → `cultura-activa.md`
   - Slugs, routes, redirects → `produtos-e-rotas.md`
   - Conflicts and decisions → `conflitos-fontes.md`
3. For **prices or dates**, never fabricate: point to official checkout, WhatsApp, or confirm with the team.
4. After marketing updates the Google Doc, re-export text and **diff** against `manual-resumo.md`.

## Student journey (for gpus-site — recommendation order)

1. Entry / beginner: **Comunidade US** or **Curso de Aurículo**.
2. Solid training: **TRINTAE3**.
3. Networking: **Na Mesa Certa**.
4. Scale: **Mentoria Black NEON**.
5. Top of pyramid: **OTB (MBA)**.

Details and alternate framing → `references/values/gpus-site/manual-resumo.md`.

## Bundled references

| File | Purpose | Scope |
|------|---------|-------|
| `references/template.md` | Schema for any Grupo US project's brand canon | TEMPLATE — never edit per project |
| `references/whatsapp-ssot.md` | WhatsApp SDR SSOT — URL building, helper signatures, anti-patterns, smoke commands (values from `config.json::whatsapp`) | GENERIC mechanic |
| `references/values/gpus-site/manual-resumo.md` | Voice, phrases, mission/vision/values, product IDs, journey, people IDs, support contacts | VALUES — gpus-site |
| `references/values/gpus-site/cultura-activa.md` | A.C.T.I.V.A. culture table and anti-patterns | VALUES — gpus-site |
| `references/values/gpus-site/produtos-e-rotas.md` | ID ↔ slug ↔ institutional route ↔ external URLs | VALUES — gpus-site |
| `references/values/gpus-site/conflitos-fontes.md` | OTB location, TRINTAE3 duration, Neon Dash gap, pricing rules | VALUES — gpus-site |

For a new Grupo US project, fork `values/<new-project>/` from the schema in `template.md`.

## Quick grep (references)

- Product IDs: `produto_`
- People IDs: `pessoa_`
- Company: `empresa_grupo_us`

## When to load more

- Skill template + new-project onboarding: `references/template.md`
- WhatsApp mechanic: `references/whatsapp-ssot.md`
- gpus-site Astro overlay: `Skill('astro')` → `references/values/gpus-site-overlay.md`
- Theme tokens canon: `Skill('${skills.theme}')` → `references/values/gpus-canon.md`
- Bootstrap new project: `.claude/scaffolding/BOOTSTRAP.md`
