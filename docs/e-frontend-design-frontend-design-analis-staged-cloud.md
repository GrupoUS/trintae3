# Plano — Reformulação de copy + design da landing TRINTAE3

## Context

A landing `trintae3.gpus.com.br` é a página do produto pago (Pós-Graduação MEC + Mentoria). Hoje:

- **Logo genérico**: `Logo.astro` usa `/images/products/trintae3.svg` (446 B, não é a marca real). Favicon e OG também genéricos.
- **Hero textual centralizado, sem rosto** — o playbook interno da marca (`docs/logos/landing-pages-design-conversao-2026-06-01.md`, §8.4 e §14.4) pede explicitamente: foto da Dra. Sacha + card de oferta + barra de prova + fórmula do método + comparativo.
- **Sem fotos profissionais** — existem 4 fotos premium de estúdio não usadas (`docs/logos/fotos/`, ~2.5 MB cada, sem otimização).
- **Paleta monótona** — navy/gold corretos, mas falta profundidade (navy 950/800), contraste de texto secundário fraco (`#94a3b8`) e o gold `#d4af37` destoa do tom mais suave da nova logo.

A referência `aula33.gpus.com.br` (topo de funil que alimenta o trintae3) ensina tom empático, filtro de público, fórmula simples e prova humana — padrões a adaptar, **não clonar** (aula33 = aula grátis; trintae3 = produto pago).

**Resultado esperado:** landing premium com marca correta (wordmark + símbolo + favicon + OG), hero split com rosto + card de oferta, fotos reais nas seções, novas seções de conversão (barra de prova, método, comparativo), copy reescrita conforme playbook e sistema de cor/fundo/motion mais rico — mantendo render estático, SSOT de conteúdo, WhatsApp SSOT, tokens-only e a11y.

## Decisões travadas (confirmadas pelo usuário)

1. **Escopo:** reformulação completa.
2. **Dourado:** híbrido — logo/headlines/editorial no gold suave da marca (~`#c2a36a`); CTAs/ações mantêm `#d4af37` vibrante; + profundidade navy e contraste de texto.
3. **Copy:** reescrever hero + CTAs conforme playbook (guardrails de saúde — sem promessa financeira).
4. **Hero:** split com foto da Dra. Sacha + card de oferta flutuante.

---

## Workstream 1 — Pipeline de assets de marca

> Logo/símbolo/favicon/OG vivem em `public/` (não passam pelo `astro:assets`) → pré-otimizar via script `sharp` (dep já presente do Astro). Fotos de seção vão para `src/assets/` e usam `<Image>` (webp + responsivo automático).

**Script novo:** `scripts/gen-brand-assets.mjs` (Node/`sharp`, rodar com `bun run`):

- **Wordmark** (`docs/logos/marca-horizontal_Marca-horizontal_Color-05.png` = Image #1) → `public/images/brand/trintae3-wordmark.webp` + `.png` fallback (trim + downscale para ~600px de largura, preservar alpha).
- **Símbolo** (`docs/logos/marca-simbolo_Color-05.png` = Image #2) → `public/favicon-32.png`, `public/favicon-96.png`, `public/apple-touch-icon.png` (180), `public/icon-512.png`, e `public/favicon.ico` (16/32/48). SVG vetorial do símbolo = best-effort opcional.
- **OG** → `public/og/trintae3.png` (1200×630): fundo navy + glow gold + wordmark + recorte da Dra. Sacha (IMG_5243) + tagline. Sobrescrever também `public/og-image.png` (duplicata).

**Fotos de seção** → copiar os 4 JPGs para `src/assets/photos/` e consumir via `astro:assets` `<Image>` (gera webp, define width/height → CLS 0). Atribuição:

| Foto | Uso |
|---|---|
| `IMG_5243` (blazer navy, autoridade, vertical) | **Hero** (coluna direita) + recorte do OG |
| `IMG_5875` (sorriso, fundo azul, vertical) | **NeonStory** (seção clara) |
| `IMG_6380` (blazer creme, horizontal) | **NeonBio** (crop ~4:5) |
| `IMG_5492` (apontando, vertical) | **Faixa/CTA final** (engajamento) |

**Arquivos editados:**
- `src/components/shared/Logo.astro` — trocar `src` para o wordmark webp + `width/height` reais; manter `loading=eager`/`fetchpriority=high`. Avaliar `h-8 sm:h-10` para a largura do wordmark.
- `src/layouts/Layout.astro` — atualizar `<link rel="icon">` (svg→png set), adicionar `apple-touch-icon`, adicionar `<meta name="theme-color" content="#1a1a2e">`, e trocar `organizationSchema.logo` para o novo wordmark.

---

## Workstream 2 — Sistema de cores, fundos e motion (`src/styles/global.css`)

Tudo via tokens no bloco `@theme` (zero hex hardcoded fora dele — cardinal rule 7).

**Tokens novos/alterados:**
- Profundidade navy: `--color-navy-950: #10101f` (hero base), `--color-navy-800: #24243a` (seção alternada), `--color-surface-2: #34344f` (cards em destaque).
- Gold da marca (suave): `--color-gold-brand: #c2a36a` (amostrar do PNG na implementação) — para logo, eyebrows, gradientes de headline. `--color-gold` (`#d4af37`) permanece para CTAs/ações.
- Texto: `--color-text-muted: #b8c0d0` (subir de `#94a3b8`); `--color-text-subtle: #8f9aaf` (metadados).
- Gradientes (`text-gradient-gold`, `text-shimmer`) re-ancorados em `gold-brand → gold-light` para harmonizar com a logo.

**Fundos / alternância de seções** (quebrar monotonia — playbook §4):
- Hero sobre `navy-950` + mesh + glow gold atrás da foto.
- Alternar `navy → navy-800 → text-primary (claro) → navy` entre seções.
- Tratamento de foto: `rounded-2xl` + borda gold sutil + vinheta leve + `depth-5`.

**Motion** (transform/opacity-first; honrar `prefers-reduced-motion` já global):
- Entrada coreografada do hero (manter `LandingHeroEntrance`), float do card de oferta, **count-up** dos números (IntersectionObserver, gate `.js`).
- Reveal das fotos com moldura gold; stagger nas linhas do comparativo.
- **Gotcha (stability.md #1):** em cards com hover/tilt, não usar `animation: … forwards` que trava o `transform` final e mascara o hover — fixar estado final com `.revealed{opacity:1}`.

---

## Workstream 3 — Copy + schema (SSOT)

**Copy reescrita em `src/content/products/trintae3.json`** (cardinal rule 5 — nada hardcoded em componente):
- `hero.headline` → orientada a autoridade (base playbook §14.4): *"A pós que une técnica avançada, prática supervisionada e mentoria para formar autoridades em Saúde Estética."*
- `hero.subheadline` → foco em profissionais habilitados + acompanhamento Dra. Sacha + comunidade.
- `cta.label` / `cta.whatsappMessage` → CTA consultivo (ex.: *"Quero falar com a Laura sobre minha vaga"*), mantendo prefixo WhatsApp SSOT e guardrails (sem promessa de faturamento).
- Novos campos de conteúdo para as seções novas (ver Workstream 4).

**Schema em `src/content.config.ts`** — ⚠️ **arquivo protegido** (`protect_files.py` bloqueia Write/Edit; commit.md lista como protegido). Editar exige confirmação no hook. Adições (todas `.optional()` p/ não quebrar outros produtos):
- `hero.image?: string`
- `hero.highlights?: { value: string; label: string }[]` (card de oferta / barra de prova)
- `mechanism?: { eyebrow?, title?, steps: string[], result: string }`
- `comparison?: { title?, traditional: string[], trintae3: string[] }`

> Regra: schema + JSON + leitor numa só mudança.

---

## Workstream 4 — Componentes e nova arquitetura de seções

**Hero split** (`src/components/landing/LandingHero.astro`):
- `lg`: 2 colunas — texto + badges + CTAs à esquerda (≈7/12), foto (`IMG_5243` via `<Image>`) à direita (≈5/12) com **card de oferta** glass flutuante (4 stats de `hero.highlights`: 634h · 100h prática · 6 meses · Garantia 7 dias).
- Mobile: texto + CTAs primeiro (conversão), foto + card abaixo. `MobileCTABar` já cobre o sticky.
- Manter helpers WhatsApp (`whatsappUrlWithText`, `isWhatsAppDestination`).

**Componentes novos** (`src/components/landing/`):
- `HeroTrustBar.astro` — faixa fina pós-hero: MEC · 534h+100h · mentoria individual · comunidade (ícones Lucide, sem emoji).
- `Mechanism.astro` — fórmula do método: *Técnica + Prática Supervisionada + Posicionamento + Mentoria = Autoridade* (lê `mechanism`).
- `Comparison.astro` — "Curso tradicional vs TRINTAE3" (2 cards: tradicional neutro com `X`, TRINTAE3 borda gold com `Check`; lê `comparison`).

**Fotos nas seções existentes:**
- `NeonStory.astro` → `<Image>` com `IMG_5875` (default atualizado).
- `NeonBio.astro` → `<Image>` com `IMG_6380`; atualizar `bio.photo` no JSON.
- Faixa/`LandingCTA` final ou nova faixa → `IMG_5492`.

**Ordem em `src/pages/index.astro`** (jornada playbook §5.1):
`Hero(split)` → `HeroTrustBar` → `PainPoints` → `NeonStory` → `Mechanism` → `Differentials` → `Comparison` → `AudienceFit` → `Pillars` → `PracticePhases` → `CurriculumModules` → `Deliverables` → `NeonBonus` → `LandingCTA` → `TestimonialCarousel` → `Guarantee` → `NeonBio` → `Differentials(final)` → `FAQ` → `LandingCTA`.

> Reuso: `Button.astro`, `SectionHeading.astro`, utilitários `glass-card`/`glass-card-bright`/`depth-*`/`card-glow-hover` já existentes. Ícones só Lucide/SVG inline.

---

## Arquivos tocados (resumo)

| Arquivo | Mudança |
|---|---|
| `scripts/gen-brand-assets.mjs` | **novo** — gera wordmark/favicons/OG via sharp |
| `public/images/brand/*`, `public/favicon*`, `public/apple-touch-icon.png`, `public/icon-512.png`, `public/og/trintae3.png`, `public/og-image.png` | assets de marca gerados |
| `src/assets/photos/*` | **novo** — 4 fotos otimizadas via `<Image>` |
| `src/components/shared/Logo.astro` | wordmark da marca |
| `src/layouts/Layout.astro` | favicon set + apple-touch + theme-color + logo no JSON-LD |
| `src/styles/global.css` | tokens navy/gold-brand/texto, fundos, motion |
| `src/content/products/trintae3.json` | copy reescrita + campos novos + `bio.photo` |
| `src/content.config.ts` | ⚠️ protegido — campos opcionais novos |
| `src/components/landing/LandingHero.astro` | hero split + card de oferta |
| `src/components/landing/{HeroTrustBar,Mechanism,Comparison}.astro` | **novos** |
| `src/components/landing/{NeonStory,NeonBio}.astro` | `<Image>` + fotos novas |
| `src/pages/index.astro` | nova ordem de seções |

**Não tocar:** `astro.config.mjs`, `src/lib/whatsapp.ts`, `package.json`, `tsconfig.json`, `biome.json`, `lefthook.yml`. Sem feature branch (main-only). Deploy só quando pedido.

---

## Verificação

1. **Gates:** `bun run lint && bunx astro check && bun run build` (LF, sem erros).
2. **Scans:** sem `#hex` fora de `global.css @theme`; sem `wa.me/` fora de `src/lib/whatsapp.ts`; sem copy hardcoded em `.astro`/`.tsx`; sem `console.log`.
3. **Assets:** favicon/OG/wordmark carregam (sem 404); imagens com `width`/`height` (CLS 0); fotos em webp.
4. **A11y (hard floor):** skip link 1º foco; `prefers-reduced-motion` desliga todo motion (incl. count-up/float); contraste AA do texto secundário novo; foco visível; `<Image>` com `alt` descritivo; `aria-hidden` em decorativos.
5. **Visual:** `bun run dev` + verificação Playwright (verification-agent) — hero split desktop/mobile, card de oferta, novas seções, sem layout shift; console limpo.
6. **Perf (advisory):** `bun run lighthouse:audit` em rotas críticas; auditar bundle (libs de animação fora da entry).
7. **SEO:** OG/Twitter resolvem, JSON-LD válido (Rich Results), canonical intacto.
