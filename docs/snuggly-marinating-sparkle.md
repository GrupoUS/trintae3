# Plano — Landing Page nativa `/trintae3` (Grupo US Theme)

> **Complexidade:** L5 — Medium (uma nova rota, ~5 componentes novos, schema overlay, remoção de redirect, atualização de SSOT JSON, sem integrações externas além de WhatsApp Laura). **Não** upgrade para L6 porque: zero forms, zero CRM, zero auth, zero migração de assets (assets já presentes), single route, sem analytics nova.
> **Modo:** Astro 6 static-only · Bun · Tailwind v4 · React 19 islands (mínimo) · Lucide React · Playfair + Inter
> **Plano de:** 2026-05-25

---

## 1. Context

Hoje `/trintae3` é apenas um **redirect externo** (`astro.config.mjs:10` → `https://trintae3.drasacha.com.br/`) e está excluído do sitemap (linha 44). A página real vive fora do domínio institucional. Queremos **internalizá-la** como landing nativa no site do Grupo US, herdando o tema Navy/Gold + Playfair/Inter, narrativa cinematográfica e SSOT JSON, ao mesmo tempo em que preservamos a estrutura comercial validada da página atual (hero → dor → oferta → 3 fases práticas → 10 módulos → garantia → bio Dra. Sacha → FAQ → CTA final).

O conteúdo da página de referência (`trintae3.drasacha.com.br/trinta-e3-2026/`) é extenso (22 seções, 6 FAQs, 16 testimonials em screenshot, 10 módulos curriculares, 3 fases práticas com locais específicos) — vamos **rebuild** sem copiar código, reutilizando o template `mentoria-black-neon.astro` e os 12 componentes em `src/components/landing/`, criando apenas 4-5 componentes específicos (fases práticas, módulos curriculares, garantia, faculty/bio expandido) e estendendo o Zod schema de `products`.

A landing também é gatilho para limpar a entrada de redirect (`/trintae3`) em `astro.config.mjs`, recolocar `/trintae3` no sitemap com prioridade alta, e atualizar `src/content/products/trintae3.json` (remover `externalSiteUrl`, corrigir duração 18m → 6m, expandir conteúdo).

---

## 2. Decisões Críticas (DEFAULTS propostos — aprovação necessária)

| # | Decisão | Default proposto | Justificativa | Alternativa |
|---|---|---|---|---|
| D1 | **CTA primary destination** | **WhatsApp Laura via `whatsappUrlWithText("Olá, Laura! Quero saber mais sobre o TRINTAE3...")`** | Cardinal #6 + convenção institucional Grupo US (prefixo "Olá, Laura!" em `whatsapp-ssot.md`). Reference usa Typebot mas todos os outros produtos do site usam WhatsApp. | Manter Typebot `typebot.co/trintae3-abril` como primary; WhatsApp como secondary helperText |
| D2 | **CTA secondary** | **Typebot `typebot.co/trintae3-abril`** como secondary CTA (helperText "Prefere preencher um formulário rápido?") | Capture lead não-WhatsApp (e-mail, etc.) sem perder a convenção principal | Suporte direto via WhatsApp da Laura (sem alternativa Typebot) |
| D3 | **Duração do programa** | **6 meses** (alinha com manual interno + reference page) | `conflitos-fontes.md` registra que JSON FAQ tem 18m mas manual diz 6m. Reference confirma 6m. | Manter 18m (requer atualizar reference page externa) |
| D4 | **HOF / Odontólogos** | **Incluir** como destaque novo (badge "NOVO 2026" + linha dedicada em audience) | Reference enfatiza essa abertura como diferencial 2026 | Omitir até confirmação legal/conselho |
| D5 | **Testimonials text** | **Reutilizar 6 testimonials já presentes em `trintae3.json` (existentes)** + bloco `[NEEDS USER CONTENT]` no plano pedindo OCR/transcrição dos 16 screenshots WhatsApp da reference | Sem texto não há acessibilidade nem SEO. Imagens-only quebram a11y (sem alt útil) e padrão TestimonialCarousel exige `{name, role, quote}`. | Aceitar 6 testimonials existentes como suficiente sem ampliar |
| D6 | **Pricing / Investimento** | **Não exibir preço na landing** (manda para WhatsApp/Typebot) | Reference faz o mesmo. Evita compromissos numéricos no SSOT. | Exibir preço fixo (requer aprovação comercial) |
| D7 | **Faculty section** | **Estender `NeonBio.astro` para suportar `faculty?: [{name, role, photo?, bio?}]` opcional, abaixo da bio principal** | Reference cita "corpo de mentores" mas só temos nomes vagos. Manter Dra. Sacha como autoridade principal. | Componente Faculty.astro dedicado (mais código, menos LEVER) |
| D8 | **Pillars `length: 3` (schema rígido)** | **Relaxar schema para `min(3).max(6)` ou adicionar campo separado `differentialPillars` (1-6)** para suportar os 4 "Why Different" da reference | Schema atual fixa exatamente 3 pillars, mas reference usa 4 pillars secundários. Não queremos quebrar páginas existentes — preferimos campo separado. | Forçar 4 pillars em Pillars.astro (quebra schema) |
| D9 | **Header nav** | **Adicionar link `TRINTAE3` ao Header** se ele lista produtos hoje | Outros produtos (mentoria-black-neon, curso-auriculo, otb) podem estar listados; precisamos paridade | Sem link no Header — só acessível via home/sitemap |
| D10 | **Footer nav** | **Adicionar link `TRINTAE3` ao Footer** (mesmo motivo) | Idem | Sem link |

> **Se o usuário aceitar todos os DEFAULTS, prosseguir com plano abaixo.** Se algum DEFAULT for rejeitado, sinalizar antes de aprovar para ajuste.

---

## 3. Codebase Findings (confiança 5 salvo nota)

### 3.1 Páginas e routing
- `src/pages/` — 9 páginas. Template de landing comercial validado: `mentoria-black-neon.astro` (1-86 linhas, pattern: getEntry → desestruturação → composição de seções).
- `astro.config.mjs:8-13` — `redirectTargets` inclui `/trintae3 → trintae3.drasacha.com.br/` (a ser **removido**).
- `astro.config.mjs:38-54` — sitemap `filter()` exclui `/trintae3` (a ser **invertido**: incluir).
- `astro.config.mjs:55-77` — sitemap `serialize()` define prioridade. Adicionar entry `/trintae3 → 0.9 monthly`.

### 3.2 Layout
- `src/layouts/Layout.astro:1-192` — aceita `title`, `description`, `ogImage`, `activeNav`, `breadcrumbs`, `whatsappMessage`, `hasBottomBar`, `jsonLd`. Já emite JSON-LD Organization + BreadcrumbList. Skip link em linha 145. IntersectionObserver para scroll-reveal em 164-190. Fonts via Astro 6 Fonts API (96-97).

### 3.3 Componentes landing/ (12 prontos)
| Componente | Reutilizar para | Mudanças |
|---|---|---|
| `LandingHero.astro` | Hero | Aceitar badges (MEC, HOF, 6 meses) — adicionar prop `badges?: [{label, icon}]` |
| `PainPoints.astro` | Problem/Emotional Hook | Usar com 4-6 pain points |
| `NeonStory.astro` | "O que é TRINTAE3" | Usar com `story.headline + paragraphs + highlight` |
| `Pillars.astro` | 3 pillars técnicos (formação, mentoria, networking) | Manter (já existe trintae3.json com 3 pillars) |
| `Differentials.astro` | 4-6 "Por que diferente" | Suportar via novo campo `differentialPillars` opcional |
| `Deliverables.astro` | "Tudo que está incluído" | Usar com 9 deliverables (534h, 100h, mentoria business, TD33, app, certificação MEC, etc.) |
| `NeonBonus.astro` | Bônus / comunidade | Bonus items opcionais |
| `FAQ.astro` | FAQ section | Native `<details>` (sem height tween — cardinal #8) |
| `NeonBio.astro` | About Dra. Sacha | Estender pra opcional `faculty[]` abaixo |
| `TestimonialCarousel.tsx` | Testimonials | React island `client:visible`. Precisa quotes textuais. |
| `LandingCTA.astro` | Investment CTA + Final CTA | Usar 2× |
| `MobileCTABar.astro` | Sticky mobile CTA | Ativar via `hasBottomBar=true` no Layout |

### 3.4 Componentes NOVOS necessários (4)
| Novo componente | Path | Motivo |
|---|---|---|
| `PracticePhases.astro` | `src/components/landing/PracticePhases.astro` | 3 fases (cadáver SP/ITC → real-patient → imersão Goiânia) — não há componente análogo |
| `CurriculumModules.astro` | `src/components/landing/CurriculumModules.astro` | 10 módulos numerados com carga horária — não há componente análogo |
| `Guarantee.astro` | `src/components/landing/Guarantee.astro` | Bloco garantia 7 dias com selo/visual — não há componente análogo |
| `AudienceFit.astro` (opcional, se Pillars não cobrir) | `src/components/landing/AudienceFit.astro` | "Para quem é" + "Para quem NÃO é" + lista de profissões (HOF NOVO!) |

### 3.5 Content Collections schema
- `src/content.config.ts:4-119` — schema `products` rico. **Precisa overlay** (campos opcionais novos):
  - `practicePhases?: array(object({ title, location, days?, description, image? })).min(1).max(5)`
  - `curriculumModules?: array(object({ number, title, description, hours? })).min(5).max(15)`
  - `guarantee?: object({ title, body, daysCount })`
  - `faculty?: array(object({ name, role, photo?, bio? })).min(1).max(12)`
  - `audienceList?: array(object({ label, highlight? })).min(1)` (profissões: enfermeiros, biomédicos, fisioterapeutas, farmacêuticos, **odontólogos HOF NOVO**)
  - `differentialPillars?: array(object({ number?, title, description })).min(1).max(6)` (para os 4 "Why Different")
  - `secondaryCTA?: object({ label, url, helperText? })` (Typebot)
  - `badges?: array(object({ label, icon? })).min(1).max(5)` (MEC, HOF, 6 meses, etc.)
- Hoje `pillars.length === 3` (exact). **Não mexer** — usar `differentialPillars` separado para os 4 "Why Different" da reference.

### 3.6 Tema
- `src/styles/global.css:6-59` — `@theme` block. Navy `#1a1a2e`, Gold `#d4af37`, Playfair + Inter, motion tokens (`--duration-*`, `--ease-*`).
- Utilities: `gold-glow`, `glass-card`, `card-hover-lift`, `landing-mesh-bg`, `text-shimmer`, `text-gradient-gold`, `btn-primary|secondary|ghost|whatsapp`. **Não criar tokens novos** — usar existentes.
- **Risco cardinal #7:** zero hex hardcoded fora do `@theme` block confirmado.

### 3.7 WhatsApp SSOT
- `src/lib/whatsapp.ts:1-26` — `WHATSAPP_SDR_E164 = "556294705081"`, `whatsappUrlWithText(message)`, `whatsappUrlBase`, `WHATSAPP_DEFAULT_SITE_MESSAGE`. **Não tocar** (arquivo protegido).
- Padrão no JSON: `cta.whatsappMessage = "Olá, Laura! Quero saber mais sobre o TRINTAE3 — [...]"` (prefixo obrigatório).

### 3.8 Scripts
- `package.json:8-19` — `bun run lint` (biome + oxlint), `bunx astro check`, `bun run build`, `bun run check:external-urls`, `bun run smoke-test`, `bun run lighthouse:audit`. Gate chain pré-deploy: `bun run lint && bunx astro check && bun run build`.

### 3.9 Assets já disponíveis
- `public/images/products/trintae3.webp` — hero image ✓
- `public/images/products/trintae3.svg` — logo TRINTAE3 ✓
- `public/images/sacha-about.webp` + `public/images/sacha-hero.webp` — fotos Dra. Sacha ✓
- **Falta:** `public/og/trintae3.png` (1200×630 OG card). **[NEEDS USER CONTENT]**
- **Falta:** fotos dos 3 fases (cadáveres ITC, atendimento real, imersão Goiânia) — pode reusar placeholders e marcar `[NEEDS USER CONTENT]`.

### 3.10 Cardinals — riscos confirmados
- ✓ Static-only (sem SSR adapter, sem `prerender=false`)
- ✓ Lucide React único icon lib
- ✓ Sem hex hardcoded fora de global.css
- ✓ Sem `wa.me/` inline (tudo via `src/lib/whatsapp.ts`)
- ✓ Sem analytics/pixels instalados — landing **não** introduz nenhum (Decisão D-out-of-scope)

---

## 4. Reference Page Findings (confiança 4-5 onde extraído verbatim, 1-2 onde inferido)

### 4.1 Estrutura 22-seções (DOM order)
Hero → Problem → "O que é TRINTAE3" → 6 Differentiators → Para Quem → Profissões (HOF NOVO) → 4 Pillars Why-Different → Hands-on intro → Fase 1 Cadáveres SP → Fase 2 Real Patients → Fase 3 Imersão Goiânia → 10 Modules → Faculty → Community Bonus → Testimonials (16 WhatsApp screenshots) → Included → Investment CTA → Guarantee 7 dias → About Dra. Sacha → Authority Badges → FAQ (6 items) → Final CTA → Footer.

### 4.2 CTA flow (confiança 5)
- Primary x3: `https://typebot.co/trintae3-abril` (label varia: "QUERO ME TORNAR ESPECIALISTA DE ALTO NÍVEL!" / "Quero ser TRINTAE3!")
- Support: `https://drasacha.com.br/lucas-trintae3` (label "FALAR COM A EQUIPE DE SUPORTE")
- **Sem `wa.me/` direto** na reference. Convertendo para Grupo US: primary = WhatsApp Laura, secondary = Typebot mantido.

### 4.3 FAQ (6 items, verbatim, confiança 5)
1. Quanto tempo tenho acesso ao conteúdo? → 1 ano de acesso + app offline
2. Quando posso começar? → Acesso imediato após matrícula
3. Qual o prazo para desistência? → 7 dias corridos, reembolso integral sem justificativa
4. Custos com hospedagem/passagens? → Por conta do aluno; programação divulgada com antecedência
5. Odontólogos podem participar? → SIM, TRINTAE3 agora é HOF
6. Ainda tem dúvidas? → Fale com a equipe pelo WhatsApp

### 4.4 Logística (confiança 5)
- Duração: **6 meses** (reference)
- Carga: 534h teóricas + 100h presenciais supervisionadas
- 3 fases: SP (cadáveres ITC) → cidade à escolha (real-patient, 3 dias) → Goiânia (Rennova + CEOHG)
- Certificação MEC reconhecida
- Suporte: TD33 plantões, mentoria business, masterclasses ao vivo, comunidade exclusiva

### 4.5 10 Módulos curriculares (confiança 5)
1. Legislação · 2. Anamnese & Avaliação · 3. Consulta Estética · 4. Injetáveis Complementares · 5. Ativo Application · 6. Toxina Botulínica · 7. Preenchedores Faciais · 8. Bioestimuladores de Colágeno · 9. Fios de Sustentação · 10. Harmonização Glútea

### 4.6 Lacunas críticas
- **Textos dos 16 testimonials** — só temos screenshots. Marcar `[NEEDS USER CONTENT: OCR/transcrição]`.
- **Pricing/scarcity** — não visível (Typebot). Não exibir.
- **Faculty names** — vagos. Marcar `[NEEDS USER CONTENT]` ou omitir seção até confirmação.
- **Datas exatas** — não publicadas. Omitir / "Próximas turmas — consulte Laura".
- **Analytics scripts** — não extraídos. **Não instalar nenhum** (out-of-scope).

---

## 5. Assumptions & Unknowns

### 5.1 Assumed (proceguir com base)
- [ASSUMED] Usuário tem autorização para usar copy, posicionamento e visuals TRINTAE3/Dra. Sacha no domínio Grupo US.
- [ASSUMED] Landing nativa em `/trintae3` substitui o redirect (sem manter dual-source — cardinal SEO).
- [ASSUMED] WhatsApp Laura é o CTA correto institucional (alinha com cardinal #6).
- [ASSUMED] Imagens em `public/images/products/trintae3.{webp,svg}` são aprovadas e atualizadas.

### 5.2 Unverified — NEEDS USER CONTENT
- [NEEDS USER CONTENT] OCR/transcrição de até 16 testimonials WhatsApp da reference (ou aprovação dos 6 já em `trintae3.json`).
- [NEEDS USER CONTENT] OG image `/og/trintae3.png` 1200×630.
- [NEEDS USER CONTENT] Fotos das 3 fases práticas (cadáveres ITC, real-patient setting, imersão Goiânia). Fallback: omitir imagens dessa seção, usar ícone Lucide grande + cor de fundo.
- [NEEDS USER CONTENT] Lista nominal do corpo docente/faculty (nomes, fotos, especialidades) — caso D7 inclua seção faculty.
- [NEEDS USER CONTENT] Confirmar duração definitiva 6m (D3) — atualizar manual + JSON FAQ junto.
- [NEEDS USER CONTENT] Confirmar destination CTA secondary (Typebot URL ainda ativo? `typebot.co/trintae3-abril`).

### 5.3 Out of scope
- Analytics/pixels (não há infra no projeto)
- Form HTML nativo (vai via WhatsApp/Typebot externo)
- LGPD checkbox (não há coleta de dados na landing — todo lead vai externo)
- Pricing/checkout (deferido para Laura/Typebot)
- E2E tests (projeto não tem Playwright/Cypress hoje — manual smoke apenas)

---

## 6. Layer Map (dependency order)

```
Data → Service/API → Router → Client/query → Presentation → Cross-cutting → Verification
```

### Data
- `src/content.config.ts` — **estender schema** `products` com 7 campos opcionais (D8 + practicePhases + curriculumModules + guarantee + faculty + audienceList + secondaryCTA + badges)
- `src/content/products/trintae3.json` — **expandir** (remover `externalSiteUrl`, atualizar `cta.url` para WhatsApp Laura, adicionar `practicePhases`, `curriculumModules`, `guarantee`, `audienceList`, `differentialPillars`, `badges`, `secondaryCTA`; corrigir FAQ duração 18m → 6m; manter 6 testimonials existentes ou ampliar com OCR)

### Service/API
- N/A — sem endpoints, sem CRM, sem form handler.

### Router
- `astro.config.mjs` — **remover** `/trintae3` de `redirectTargets` (linha 10); **remover** `/trintae3` de `sitemap.filter()` (linha 44); **adicionar** `/trintae3 → 0.9 monthly` ao `sitemap.serialize()` config (linha 62 area).
- `src/pages/trintae3.astro` — **CRIAR** (espelhar `mentoria-black-neon.astro`).

### Client/query
- `LandingHeroEntrance.tsx` — reusar (`client:visible`)
- `TestimonialCarousel.tsx` — reusar (`client:visible`)
- Nenhum novo island.

### Presentation
- `src/components/landing/PracticePhases.astro` — **CRIAR**
- `src/components/landing/CurriculumModules.astro` — **CRIAR**
- `src/components/landing/Guarantee.astro` — **CRIAR**
- `src/components/landing/AudienceFit.astro` — **CRIAR** (ou inline no .astro page se trivial)
- `src/components/landing/LandingHero.astro` — **estender** props (`badges?`)
- `src/components/landing/NeonBio.astro` — **estender** props (`faculty?`)
- `src/components/landing/Differentials.astro` — **reusar** com input `differentialPillars`
- `src/components/layout/Header.astro` — **atualizar** nav (link TRINTAE3)
- `src/components/layout/Footer.astro` — **atualizar** nav (link TRINTAE3)

### Cross-cutting
- SEO meta — frontmatter no `src/pages/trintae3.astro` (`title`, `description`, `ogImage="/og/trintae3.png"`, `breadcrumbs`, `whatsappMessage`)
- JSON-LD adicional: passar `jsonLd` ao Layout com `@type: "Course"` (schema.org Course) — fields: name, description, provider Organization, courseMode, hasCourseInstance.duration P6M, educationalCredentialAwarded, inLanguage pt-BR
- A11y — herda do Layout (skip link, focus ring tokens, FAQ native `<details>`, `<noscript>` reveal)
- Performance — hero image `loading="eager" fetchpriority="high"`; demais lazy. Imagens com `width`/`height` explícitos. Manter <50KB JS initial.
- Reduced motion — global.css já gate animations via `@media (prefers-reduced-motion: reduce)` (verificar linhas finais)

### Verification
- `bun run lint` (biome + oxlint)
- `bunx astro check` (valida Content Collections schema + tipagem)
- `bun run build` (catch hydration + asset issues)
- `bun run check:external-urls` (testa cardinal #1 — destinos externos reachable)
- `bun run lighthouse:audit` (gates: perf 95 / a11y 95 / bp 95 / SEO 95)
- `bun run smoke-test` (forbidden hex scan, icon mix, heading discipline)
- Manual: tab order, skip link, FAQ keyboard, JS-off `<noscript>`, mobile sticky CTA não cobre conteúdo, viewports 360/768/1280, `prefers-reduced-motion: reduce` no DevTools

---

## 7. Recommended Approach

**Estratégia:** **Extend over create** (LEVER). Mirror `mentoria-black-neon.astro`. Reusar 9 componentes existentes + criar 4 novos. Schema overlay (adicionar campos opcionais — não quebra outros products). Single PR. Sem dependências novas. Sem analytics. Theme tokens existentes cobrem 100% das necessidades visuais (Navy/Gold + glass + gold-glow + scroll-reveal).

**Alternativas consideradas:**

| Alt | Vantagem | Desvantagem | Veredicto |
|---|---|---|---|
| A. Refatorar `mentoria-black-neon.astro` → componente reutilizável `<LandingTemplate>` com slots | DRY de longo prazo | Refactor adicional, risco para mentoria-black-neon, expande escopo | **Rejeitada** — fora do escopo, fazer em sprint futuro |
| B. Página única gigante sem componentes novos (inlinear practicePhases/modules) | Menos arquivos | Quebra max-150-linhas, dificulta manutenção, duplica markup em página futura | **Rejeitada** |
| C. **Plano atual: extend over create, 4 componentes novos, schema overlay** | Reuso máximo, sem breakage, schema retrocompatível | Aceita ~4 arquivos novos | **Recomendada** |

---

## 8. Atomic Task Plan

> Cada tarefa ≤ 30min, reversível, testável. Implementação **só após aprovação do plano**.

### Sprint 1 — Data + Schema (foundation)

#### TASK-01: Estender schema `products` em `src/content.config.ts`
- **Layer:** Data
- **Goal:** adicionar 7 campos opcionais sem quebrar products existentes
- **Files:** `src/content.config.ts` (linhas 4-119) — **arquivo protegido** (`config.json::protectedFiles.exact`). Confirmar mudança.
- **Subtarefas:**
  - [ ] Adicionar `practicePhases: z.array(z.object({ title, location, days?, description, image? })).min(1).max(5).optional()`
  - [ ] Adicionar `curriculumModules: z.array(z.object({ number, title, description, hours? })).min(5).max(15).optional()`
  - [ ] Adicionar `guarantee: z.object({ title, body, daysCount }).optional()`
  - [ ] Adicionar `faculty: z.array(z.object({ name, role, photo?, bio? })).min(1).max(12).optional()`
  - [ ] Adicionar `audienceList: z.array(z.object({ label, highlight? })).min(1).optional()`
  - [ ] Adicionar `differentialPillars: z.array(z.object({ number?, title, description })).min(1).max(6).optional()`
  - [ ] Adicionar `secondaryCTA: z.object({ label, url, helperText? }).optional()`
  - [ ] Adicionar `badges: z.array(z.object({ label, icon? })).min(1).max(5).optional()`
- **Validação:** `bunx astro check` deve passar para todos os products existentes (otb, curso-auriculo, mentoria-black-neon, na-mesa-certa, comunidade-us, neon-dash).
- **Approval needed:** **YES** — `src/content.config.ts` é arquivo protegido.

#### TASK-02: Atualizar `src/content/products/trintae3.json`
- **Layer:** Data
- **Goal:** transformar entry de redirect placeholder em conteúdo full landing
- **Files:** `src/content/products/trintae3.json`
- **Subtarefas:**
  - [ ] Remover campo `externalSiteUrl` (linha do `https://trintae3.drasacha.com.br/`)
  - [ ] Atualizar `tagline` — versão Grupo US do reference headline
  - [ ] Atualizar `audience` para incluir odontólogos HOF (D4)
  - [ ] Atualizar `hero.headline`, `hero.subheadline` per reference (D3: 6 meses)
  - [ ] Atualizar `cta.url` para `whatsappUrlWithText("Olá, Laura! Quero saber mais sobre o TRINTAE3 — [campo]")` (vai gerar via build helper — na prática, inline `https://wa.me/556294705081?text=...` é forbidden por cardinal #6, então deixar `cta.url = ""` e LandingHero/LandingCTA chamar `whatsappUrlWithText(cta.whatsappMessage)` em build time). **OU** revisitar pattern em outros products (verificar como mentoria-black-neon.json estrutura cta.url).
  - [ ] `cta.whatsappMessage` = `"Olá, Laura! Quero saber mais sobre o TRINTAE3 e me tornar Especialista em Saúde Estética Avançada."`
  - [ ] Adicionar `secondaryCTA: { label: "Prefere preencher um formulário?", url: "https://typebot.co/trintae3-abril", helperText: "Vagas limitadas — fale com a Laura primeiro." }` (D2)
  - [ ] Adicionar `badges: [{ label: "Pós-Graduação MEC", icon: "GraduationCap" }, { label: "HOF NOVO 2026", icon: "Sparkles" }, { label: "6 meses", icon: "Calendar" }, { label: "534h + 100h prática", icon: "BookOpen" }]`
  - [ ] Atualizar `painPoints` — 4-6 pain points alinhados à reference (ex: "Sente que estudou muito mas o reconhecimento não chega", "Cansou de trocar hora por dinheiro", etc.)
  - [ ] `pillars` (manter exatamente 3): Formação Técnica Avançada · Mentoria de Negócios · Networking Premium (já existem)
  - [ ] Adicionar `differentialPillars` (4 items): "Técnica que você pratica de verdade (534h+100h)" · "Mentoria de Business e Posicionamento High-Ticket" · "6 meses de Suporte Contínuo (TD33, masterclasses)" · "Certificação MEC Reconhecida"
  - [ ] Adicionar `practicePhases` (3 items): Fase 1 — Cadáveres Fresh Frozen (SP, ITC, 3 dias) · Fase 2 — Atendimento Real com Preceptor (cidade à escolha, 3 dias) · Fase 3 — Imersão Clínica em Goiânia (Rennova + CEOHG)
  - [ ] Adicionar `curriculumModules` (10 items): conforme §4.5 com `hours` aproximada (ex: módulo 6 toxina = ~80h)
  - [ ] Adicionar `audienceList`: enfermeiros, biomédicos, fisioterapeutas, farmacêuticos, **odontólogos (HOF NOVO 2026)**
  - [ ] Adicionar `deliverables` (9 items): per reference §1.4 "Tudo que está incluído"
  - [ ] Adicionar `bonus` (community access) opcional
  - [ ] Adicionar `guarantee: { title: "7 dias de garantia. Risco zero.", body: "<verbatim reference>", daysCount: 7 }`
  - [ ] Atualizar `bio` Dra. Sacha (já existe? — confirmar) com paragraphs per reference About section
  - [ ] **OPCIONAL** adicionar `faculty` se nomes confirmados (D7) — senão omitir
  - [ ] Atualizar/manter `differentials[]` (campo existente, 2+ items)
  - [ ] Atualizar `faqs` — 6 perguntas verbatim da reference (§4.3) + remover/corrigir entry sobre duração 18m → 6m
  - [ ] Atualizar `testimonials` — manter os 6 existentes OU expandir com OCR (D5)
  - [ ] Marcar `[NEEDS USER CONTENT]` no plano para: fotos das 3 fases, OG image, OCR testimonials, faculty nominal
- **Validação:** `bunx astro check` valida Zod schema; `bun run check:external-urls` valida que `cta.url` e `secondaryCTA.url` são reachable.
- **Approval needed:** No (content file, not protected list).

### Sprint 2 — Components (presentation)

#### TASK-03: Estender `LandingHero.astro` (badges prop)
- **Layer:** Presentation
- **Files:** `src/components/landing/LandingHero.astro`
- **Subtarefas:**
  - [ ] Adicionar `badges?: Array<{ label: string; icon?: string }>` na interface Props
  - [ ] Renderizar badges como row de chips (`rounded-full px-3 py-1 text-xs uppercase tracking-wider` + ícone Lucide opcional) abaixo do subheadline e acima do CTA
  - [ ] Manter compatibilidade com chamadas sem `badges` (otb, curso-auriculo, mentoria-black-neon)
- **Validação:** type-check + visual smoke em `/mentoria-black-neon` (não regressão)

#### TASK-04: Criar `PracticePhases.astro`
- **Layer:** Presentation
- **Files:** `src/components/landing/PracticePhases.astro` (novo)
- **Subtarefas:**
  - [ ] Aceitar props: `phases: Array<{ title, location, days?, description, image? }>` + `sectionHeading?` + `sectionSubtitle?`
  - [ ] Layout: alternar imagem/texto esquerda-direita (zigzag asymmetric — DESIGN.md §4 anti-50/50), número grande (01/02/03 em Playfair Display gold)
  - [ ] Glass-card variant + card-hover-lift
  - [ ] Scroll-reveal staggered (reveal-up + delay incremental)
  - [ ] Imagem com `<img>` Astro nativo + width/height (zero CLS) — quando `image` ausente, mostrar ícone Lucide grande (MapPin / Activity / Sparkles)
  - [ ] Reduced-motion gate
- **Validação:** componente <150 linhas

#### TASK-05: Criar `CurriculumModules.astro`
- **Layer:** Presentation
- **Files:** `src/components/landing/CurriculumModules.astro` (novo)
- **Subtarefas:**
  - [ ] Props: `modules: Array<{ number, title, description, hours? }>` + sectionHeading
  - [ ] Layout: grid asymmetric (não 50/50). Sugestão: lista numerada vertical com hover-lift, number em Playfair display gold +Inter para título +text-muted para description +hours como badge à direita
  - [ ] Total de horas (sum) renderizado no topo como anchor stat (ex: "534 horas teóricas + 100 horas práticas")
- **Validação:** type-check + visual

#### TASK-06: Criar `Guarantee.astro`
- **Layer:** Presentation
- **Files:** `src/components/landing/Guarantee.astro` (novo)
- **Subtarefas:**
  - [ ] Props: `title`, `body`, `daysCount`
  - [ ] Layout: card de destaque com selo (ícone ShieldCheck Lucide) grande à esquerda + heading + body. `gold-glow` utility + glass-card-bright variant
  - [ ] CTA secundário discreto pra Laura ("Tem dúvidas? Fale com a Laura")
- **Validação:** type-check + visual

#### TASK-07: Criar `AudienceFit.astro` (ou inline)
- **Layer:** Presentation
- **Files:** `src/components/landing/AudienceFit.astro` (novo) — opcional, se Pillars + audienceList não cobrir
- **Subtarefas:**
  - [ ] Props: `audienceList: Array<{ label, highlight? }>` + `notForSection?: { headline, items[] }`
  - [ ] Layout: dois cards lado-a-lado em desktop (Para Quem É vs Para Quem NÃO É) ou stacked em mobile
  - [ ] Ícone Lucide CheckCircle/XCircle
  - [ ] Highlight visual nos itens marcados (ex: odontólogos HOF NOVO)
- **Validação:** type-check + visual

#### TASK-08: Estender `NeonBio.astro` (faculty opcional)
- **Layer:** Presentation
- **Files:** `src/components/landing/NeonBio.astro`
- **Subtarefas:**
  - [ ] Adicionar `faculty?: Array<{ name, role, photo?, bio? }>` à interface Props
  - [ ] Quando presente, renderizar grid responsivo de cards (3 col desktop, 2 tablet, 1 mobile) abaixo da bio principal com section heading "Você vai aprender com quem vive o que ensina"
  - [ ] Manter compatibilidade (omitir bloco se ausente)
- **Validação:** type-check + visual

### Sprint 3 — Page + Router + Layout

#### TASK-09: Criar `src/pages/trintae3.astro`
- **Layer:** Router / Presentation
- **Files:** `src/pages/trintae3.astro` (novo)
- **Subtarefas:**
  - [ ] Frontmatter: `import` Layout + todos os componentes landing/ usados + `getEntry('products', 'trintae3')`
  - [ ] Desestruturar `data` do entry
  - [ ] Layout props: `title`, `description`, `ogImage="/og/trintae3.png"`, `activeNav="trintae3"`, `breadcrumbs=[{name:"Início",url:"/"},{name:"TRINTAE3",url:"/trintae3"}]`, `whatsappMessage=cta.whatsappMessage`, `hasBottomBar={true}`, `jsonLd={ courseSchema }`
  - [ ] courseSchema: `@type: "Course"`, `name`, `description`, `provider: Organization`, `educationalCredentialAwarded: "Pós-Graduação Lato Sensu (MEC)"`, `inLanguage: "pt-BR"`, `hasCourseInstance: { @type: "CourseInstance", courseMode: "blended", duration: "P6M", instructor: "Dra. Sacha Gualberto" }`
  - [ ] Ordem das seções:
    1. `<LandingHero {name, tagline, hero, type, cta, badges} />`
    2. `<PainPoints {audience, painPoints} />`
    3. `<NeonStory {story} />` (se `story` definido)
    4. `<Differentials differentials={differentialPillars} />` ou `<Differentials {differentials} />` — confirmar uso
    5. `<AudienceFit {audienceList, notForSection?} />`
    6. `<Pillars {pillars} />`
    7. `<PracticePhases phases={practicePhases} />`
    8. `<CurriculumModules modules={curriculumModules} />`
    9. `<Deliverables {deliverables} />`
    10. `<NeonBonus {bonus} />` (se definido)
    11. `<LandingCTA {name, cta, secondaryCTA?} />` (CTA intermediário)
    12. `<TestimonialCarousel testimonials={testimonials} client:visible />`
    13. `<Guarantee {guarantee} />`
    14. `<NeonBio {bio, faculty?} />`
    15. `<FAQ {faqs} />`
    16. `<LandingCTA {name, cta} />` (final)
    17. `<MobileCTABar {cta} />` (via hasBottomBar=true no Layout, automático)
  - [ ] Manter total <150 linhas (delegação para componentes)
- **Validação:** `bunx astro check` + `bun run build` + manual visual

#### TASK-10: Atualizar `astro.config.mjs` (tri-sync)
- **Layer:** Router
- **Files:** `astro.config.mjs` — **arquivo protegido** (`config.json::protectedFiles.exact`)
- **Subtarefas:**
  - [ ] Remover `"/trintae3": "https://trintae3.drasacha.com.br/"` de `redirectTargets` (linha 10)
  - [ ] Remover `/trintae3` da lista `sitemap.filter()` exclusion (linha 44)
  - [ ] Adicionar `"/trintae3": { priority: 0.9, changefreq: "monthly" }` ao `sitemap.serialize()` config (linha 62 area, alinhar com curso-auriculo/mentoria-black-neon/otb)
- **Validação:** `bun run build` deve gerar `dist/trintae3/index.html` (página estática) e sitemap incluir `/trintae3`. `bun run check:external-urls` continua passando.
- **Approval needed:** **YES** — arquivo protegido.

#### TASK-11: Atualizar Header + Footer nav (D9 + D10)
- **Layer:** Presentation
- **Files:** `src/components/layout/Header.astro`, `src/components/layout/Footer.astro`
- **Subtarefas:**
  - [ ] Adicionar link `TRINTAE3 → /trintae3` à lista de produtos do Header (mesma posição que mentoria-black-neon, otb, curso-auriculo)
  - [ ] Adicionar mesmo link ao Footer
  - [ ] `activeNav="trintae3"` deve marcar o link como ativo
- **Validação:** type-check + visual em todas páginas existentes (verificar que `activeNav` sem trintae3 não quebra outros)

### Sprint 4 — Cross-cutting + Verification

#### TASK-12: Criar OG image placeholder ou request user
- **Layer:** Cross-cutting
- **Files:** `public/og/trintae3.png` (1200×630)
- **Subtarefas:**
  - [ ] **[NEEDS USER CONTENT]** OG image final. Fallback: gerar placeholder usando ferramenta de design ou reutilizar `public/og-image.png` default temporariamente.
- **Validação:** OG card preview no Twitter/Facebook validator após deploy.

#### TASK-13: Adicionar JSON-LD Course schema
- **Layer:** Cross-cutting
- **Files:** `src/pages/trintae3.astro` (passa via Layout `jsonLd` prop)
- **Subtarefas:**
  - [ ] Schema Course conforme §6 Cross-cutting acima
  - [ ] Validar em Google Rich Results Test
- **Validação:** Rich Results Test pass.

#### TASK-14: Gate chain final
- **Layer:** Verification
- **Subtarefas:**
  - [ ] `bun run lint` — 0 errors
  - [ ] `bunx astro check` — 0 errors (Zod schema + .astro + .ts + .tsx)
  - [ ] `bun run build` — success, output em `dist/`
  - [ ] `bun run check:external-urls` — todos URLs reachable (especialmente Typebot e WhatsApp)
  - [ ] `bun run lighthouse:audit` — gates `perf ≥ 95, a11y ≥ 95, bp ≥ 95, seo ≥ 95` (config.json::gates)
  - [ ] `bun run smoke-test` — sem hex hardcoded, sem icon mix, sem inline `wa.me/`, sem `console.log`
  - [ ] Manual: Tab order → skip link first, FAQ keyboard nav, JS-off `<noscript>` reveal, viewport 360/768/1280, `prefers-reduced-motion: reduce`, mobile sticky CTA não cobre conteúdo, CTA → WhatsApp Laura abre wa.me corretamente
- **Validação:** todos os gates pass.

---

## 9. Sprint Contracts

```
Sprint 1 — Data Foundation
Scope:
  - TASK-01: schema overlay
  - TASK-02: trintae3.json full content
Done when:
  - [ ] bunx astro check passes for all products
  - [ ] [NEEDS USER CONTENT] flags listed
  - [ ] Conflict (duration 6m vs 18m) resolved
Out of scope:
  - Any .astro/.tsx code
  - Sitemap/router changes
```

```
Sprint 2 — Components
Scope:
  - TASK-03 to TASK-08: extend 2, create 4 components
Done when:
  - [ ] Each component < 150 lines
  - [ ] Type-check passes
  - [ ] No regression em /mentoria-black-neon /curso-auriculo /otb
Out of scope:
  - Page composition
  - Router changes
```

```
Sprint 3 — Page + Router
Scope:
  - TASK-09: trintae3.astro
  - TASK-10: astro.config.mjs tri-sync
  - TASK-11: Header + Footer nav
Done when:
  - [ ] bun run build generates dist/trintae3/index.html
  - [ ] Sitemap includes /trintae3 with priority 0.9
  - [ ] bun run check:external-urls passes
Out of scope:
  - OG image, JSON-LD Course, full lighthouse
```

```
Sprint 4 — Cross-cutting + Verification
Scope:
  - TASK-12: OG image
  - TASK-13: JSON-LD Course
  - TASK-14: full gate chain
Done when:
  - [ ] Lighthouse gates met
  - [ ] Rich Results Test passes
  - [ ] Manual a11y smoke complete
  - [ ] All [NEEDS USER CONTENT] resolved OR explicitly deferred
Out of scope:
  - Analytics
  - E2E
```

---

## 10. Validation Plan (commands existentes apenas)

| # | Comando | Quando | Espera |
|---|---|---|---|
| V1 | `bun run lint` | Toda task | 0 errors |
| V2 | `bunx astro check` | Após TASK-01, TASK-02, TASK-09 | 0 errors |
| V3 | `bun run build` | Após TASK-09, TASK-10 | Success + `dist/trintae3/index.html` |
| V4 | `bun run check:external-urls` | Após TASK-02, TASK-10 | All URLs 2xx |
| V5 | `bun run lighthouse:audit` | Após TASK-09 + dist | Perf/A11y/BP/SEO ≥ 95 |
| V6 | `bun run smoke-test` | Final | 0 hex outside global.css, 0 inline wa.me, 0 console.log |
| V7 | Manual: keyboard tab, JS-off, reduced-motion, viewports | Após TASK-14 | A11y baseline pass |
| V8 | Google Rich Results Test | Após deploy preview | Course + Organization + BreadcrumbList valid |

---

## 11. Risks & Rollback (top 5)

| Risk | Likelihood | Impact | Mitigation | Rollback |
|---|---|---|---|---|
| R1: Schema overlay quebra products existentes | Low | High | Todos campos novos são `.optional()`; rodar `bunx astro check` em todos products antes de PR | `git revert` no `content.config.ts`; sem mudança de runtime |
| R2: Duração 6m vs 18m gera conflito comercial | Medium | Medium | Confirmar com usuário (D3) ANTES de TASK-02; atualizar conflitos-fontes.md | Reverter `trintae3.json` ao state anterior; manter redirect ativo temporariamente |
| R3: Remover redirect quebra inbound links externos | Medium | Low | Trintae3.drasacha.com.br segue existindo separado; landing nova é canonical no domínio Grupo US. Adicionar 301 reverso (drasacha→grupous) opcional fora-de-escopo. | Restaurar entry em `redirectTargets` + entry em `sitemap.filter()` |
| R4: CTA WhatsApp quebra conversão (usuários esperam Typebot) | Low | Medium | Manter Typebot como `secondaryCTA` (D2) — usuário escolhe canal | Trocar `cta.url` para Typebot e mover WhatsApp para secondaryCTA |
| R5: Lighthouse a11y < 95 em mobile (sticky CTA cobrindo conteúdo) | Medium | High | Padding-bottom 50px no `<main>` quando `hasBottomBar=true` (Layout já trata via `data-attr`?); revisar; teste mobile real | Desativar `hasBottomBar` em mobile via media query; refazer layout sticky |

---

## 12. Acceptance Criteria

A implementação só será considerada completa quando:

- [ ] `/trintae3` retorna HTML estático nativo (não redirect)
- [ ] Página espelha as 16+ seções principais da reference em narrativa equivalente
- [ ] Todos componentes seguem `src/styles/global.css` `@theme` (zero hex hardcoded)
- [ ] Todos CTAs primary apontam para WhatsApp Laura via `whatsappUrlWithText()` helper (sem `wa.me/` inline)
- [ ] CTA secundário (Typebot) presente e verificado reachable
- [ ] Schema Zod valida `trintae3.json` sem erros
- [ ] `astro.config.mjs::redirects` não contém mais `/trintae3`
- [ ] Sitemap inclui `/trintae3` com priority 0.9 monthly
- [ ] Layout passa `jsonLd` com Course schema, validável em Rich Results Test
- [ ] Header e Footer linkam para `/trintae3`
- [ ] Lighthouse mobile + desktop atingem todos os 4 gates ≥ 95
- [ ] Manual a11y: skip link, focus rings, FAQ keyboard, `prefers-reduced-motion`
- [ ] `bun run lint && bunx astro check && bun run build && bun run check:external-urls && bun run smoke-test` passam todos
- [ ] OG image `/og/trintae3.png` presente (ou explicitamente deferida com fallback documentado)
- [ ] HOF/odontólogos destacado como diferencial 2026 (D4)
- [ ] Duração 6 meses consistente (hero + FAQ + bio) (D3)
- [ ] Garantia 7 dias presente como bloco dedicado
- [ ] 3 fases práticas (SP cadáveres + cidade-real-patient + Goiânia imersão) presentes com locais/duração
- [ ] 10 módulos curriculares listados com carga horária

---

## 13. Implementation Order (TL;DR)

```
Sprint 1: TASK-01 (schema) → TASK-02 (JSON content)
Sprint 2: TASK-03 (LandingHero badges) + TASK-08 (NeonBio faculty) [parallel]
          → TASK-04 (PracticePhases) + TASK-05 (CurriculumModules) + TASK-06 (Guarantee) + TASK-07 (AudienceFit) [parallel]
Sprint 3: TASK-09 (trintae3.astro page) → TASK-10 (astro.config.mjs) → TASK-11 (Header+Footer)
Sprint 4: TASK-12 (OG image) → TASK-13 (JSON-LD Course) → TASK-14 (gate chain final)
```

**Total estimado:** 14 tarefas atômicas. 3-4h de execução foreground se sem bloqueios externos. Bloqueio principal: aprovações sobre D1-D10 + entrega de [NEEDS USER CONTENT].

---

## 14. Handoff (após implementação)

```
## Context Handoff
- Status: PLANNED — awaiting user approval of D1-D10 defaults
- Confidence: 5/5 codebase, 4/5 reference content, 2/5 testimonials text
- Artifacts: [
    { path: "src/content.config.ts", action: "extend schema" },
    { path: "src/content/products/trintae3.json", action: "rewrite content" },
    { path: "src/pages/trintae3.astro", action: "create" },
    { path: "src/components/landing/PracticePhases.astro", action: "create" },
    { path: "src/components/landing/CurriculumModules.astro", action: "create" },
    { path: "src/components/landing/Guarantee.astro", action: "create" },
    { path: "src/components/landing/AudienceFit.astro", action: "create" },
    { path: "src/components/landing/LandingHero.astro", action: "extend (badges)" },
    { path: "src/components/landing/NeonBio.astro", action: "extend (faculty)" },
    { path: "src/components/layout/Header.astro", action: "add nav link" },
    { path: "src/components/layout/Footer.astro", action: "add nav link" },
    { path: "astro.config.mjs", action: "remove redirect + update sitemap" },
    { path: "public/og/trintae3.png", action: "create (or [NEEDS USER CONTENT])" }
  ]
- Quality gates: lint + astro check + build + check:external-urls + lighthouse + smoke-test
- Decisions pending: D1-D10 (Section 2)
- Risks: R1-R5 (Section 11)
- Next agent: frontend-specialist (after approval) — foreground only (Write/Edit required per cardinal)
- Resume hint: aprovar D1-D10, então /implement docs/snuggly-marinating-sparkle.md
```
