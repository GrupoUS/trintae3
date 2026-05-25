---
name: gpus-site
description: Site institucional Grupo US — vitrine de produtos e hub de tráfego para funis externos. Dark-only, Navy + Gold, Astro 6 + Tailwind v4.
mode: dark-only
colors:
  navy: "#1a1a2e"
  navy-light: "#2a2a40"
  navy-lighter: "#3d3d5c"
  gold: "#d4af37"
  gold-light: "#e8c96a"
  gold-dark: "#b8960c"
  text-primary: "#fafaf9"
  text-muted: "#94a3b8"
  whatsapp: "#25d366"
  whatsapp-hover: "#20bd5a"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontWeight: 700
    use: "Heros institucionais, headlines de seção"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    use: "Body, parágrafos, UI"
  font-variables:
    serif: "var(--font-playfair)"
    sans: "var(--font-inter)"
utilities-disponiveis:
  - gold-glow
  - glass-card
  - glass-card-bright
  - card-hover-lift
  - card-glow-hover
  - gold-pulse-glow
  - float-gentle
  - animate-spotlight
  - animate-aurora
  - landing-mesh-bg
  - text-shimmer
  - text-gradient-gold
spacing-grid: "8px (Tailwind default)"
focus-ring: "2px solid var(--color-gold), offset 2px"
---

# Design System — `gpus-site`

> Hub navegacional. Definições canônicas vivem em [`src/styles/global.css`](src/styles/global.css) (tokens) e nas skills + rules abaixo. **Este arquivo não é SSOT** — é índice.

## 1. Overview e Creative North Star

`gpus-site` veste o sistema **GPUS** (Azul Petróleo + Sovereign Gold) na variante **landing institucional dark-only**. North star contextualizada: **"The Architectural Monolith"** — permanência, peso, autoridade curada (do skill [`gpus-theme`](.claude/skills/gpus-theme/SKILL.md)). Aqui a doutrina é **autoridade institucional**, não sala de comando da clínica (esse é o NeonDash).

O site não é dashboard. É vitrine. Por isso opera em **dark-only** (canvas `#1a1a2e`), sem dual-mode, sem switcher. A escolha é deliberada: o navy carrega gravidade institucional, o ouro raro carrega decisão. Light mode é território do NeonDash; aqui não cabe.

Multi-Dimensional Analysis aplicada em toda página (per [`AGENTS.md`](AGENTS.md) § Core principles): psicológica (cognitive load), técnica (paint/reflow), acessibilidade (WCAG AAA quando viável), escala (manutenção).

## 2. Tokens — canon

**Fonte da verdade:** [`src/styles/global.css`](src/styles/global.css) bloco `@theme {}`. Frontmatter deste arquivo é resumo para discovery por agentes — quando divergir do CSS, **o CSS vence**.

Resumo:

| Role | Token | Hex |
|---|---|---|
| Canvas | `--color-navy` / `bg-navy` | `#1a1a2e` |
| Tier 1 (cards) | `--color-navy-light` | `#2a2a40` |
| Tier 2 (hover, inputs) | `--color-navy-lighter` | `#3d3d5c` |
| Primary CTA | `--color-gold` / `bg-gold` | `#d4af37` |
| Gold hover | `--color-gold-light` | `#e8c96a` |
| Gold deep (botões hover ou estados) | `--color-gold-dark` | `#b8960c` |
| Texto primário | `--color-text-primary` | `#fafaf9` (warm near-white, nunca `#fff`) |
| Texto secundário | `--color-text-muted` | `#94a3b8` |
| WhatsApp CTA secundário | `--color-whatsapp` | `#25d366` |

**Hex inline em componentes é proibido** (per [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md) § 1). Estender `@theme` em `global.css` quando precisar de role nova.

Cross-brand portfolio (dual-mode shadcn do NeonDash, dashboard Black NEON / TRINTAE3 / Na Mesa Certa) → `gpus-theme/references/css-variables.md` e `gpus-theme/design-system/BRAND-PORTFOLIO.md`. Não importar aqui.

## 3. Tipografia

Duas famílias, papel claro:

- **Playfair Display** (serif, 400/600/700) — heros, headlines de seção, momentos institucionais. Carrega autoridade clássica que sustenta a doutrina "Architectural Monolith".
- **Inter** (sans, 300/400/500/600/700) — body, UI, navegação, captions. Carrega legibilidade densa no scroll.

Configuração viva: [`astro.config.mjs`](astro.config.mjs) (`fontProviders.google()` + `cssVariable`).

**Named Rule — Hierarchy by weight + size, never by family swap.** Quando precisar destacar dentro de body, mudar peso/tamanho do Inter; não embaralhar Playfair em parágrafo.

**Tabular-nums em coluna numérica** — preço, contadores, datas. Per [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md) § 2.

Detalhamento (line-height, tracking, hierarchy completa) em `gpus-theme/references/design-foundation.md §3`.

## 4. Named Rules de marca (vindas do skill `gpus-theme`)

Reproduzo o **título** das regras + onde estão definidas. Texto completo na fonte original.

| Regra | Fonte canônica |
|---|---|
| **The One Voice Rule** — ouro em ≤10% da superfície de cada tela | `gpus-theme/references/design-foundation.md` |
| **The Petróleo-on-White Contrast Rule** — `#AC9469` falha sobre branco (2.97:1); usar `#8B6914` quando precisar de gold-text light | `gpus-theme/references/design-foundation.md §2.5` |
| **The Brand-Color-Never-Body Rule** — `text-gold`/`text-neon-petroleo` para chrome de identidade, nunca body | `gpus-theme/SKILL.md` |
| **The Single-Family-by-Role Rule** — Playfair é heros, Inter é tudo o mais. Sem terceira família | este DESIGN.md § 3 |

## 5. Componentes — resumo

Cada bloco tem 2–3 bullets de "the why" e ponteiro para fonte. **Sem tabelas de variantes** (essas vivem nos skills + rules).

### Buttons
- Hierarquia: **primary** (CTA, fundo gold, texto navy escuro), **secondary** (WhatsApp verde quando aplicável), **ghost** (link de navegação), **destructive** raríssimo (não há fluxos de exclusão no institucional).
- Texto em fundo dourado: **navy escuro**, nunca branco (anti-pattern Petróleo-on-White).
- Touch target ≥ 44×44px em mobile (utilitário `.skip-link` mostra o padrão em [`global.css`](src/styles/global.css)).
- Detalhe completo → [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md) § 3 (Buttons).

### Cards
- `bg-navy-light` no padrão, `bg-navy-lighter` no hover/active.
- Utilitário `card-hover-lift` aplica `translateY(-6px) scale(1.01)` em hover. **Nunca animar `width`/`height`/`top`/`margin`** (per rules § 7).
- Glass card existe (`glass-card`, `glass-card-bright`) — usar com parcimônia, somente em hero / CTAs principais. Não é padrão.
- Cards aninhados banidos (per rules § 11).
- Detalhe → [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md) § 3 (Cards).

### Inputs / Forms
- Form único do site: contato (`src/pages/contato.astro`). Pattern: label sempre visível, `:focus-visible` ring 2px gold com offset 2px (per `global.css`).
- Erro: cor + ícone + texto, nunca cor isolada (per rules § 1).
- Detalhe → [`.claude/rules/frontend.md`](.claude/rules/frontend.md) § Forms.

### Hero / Mesh background
- Hero das landings usa `landing-mesh-bg` (radial-gradient com `mesh-drift` 20s) e `animate-spotlight` (1× forward) para entrada.
- **`min-h-[100dvh]` em hero**, nunca `h-screen` (bug iOS Safari, per `gpus-theme/references/design-taste.md §12`).
- Mesh anima `background-position` apenas; `prefers-reduced-motion` desliga (per `global.css` linha 99 e 246).

### Reveal-on-scroll
- Padrão `[data-reveal="up|left|right|scale"]` + IntersectionObserver. Stagger via `data-reveal-delay="1..6"`.
- Animação roda em `opacity` + `transform` apenas (per rules § 7).
- `<noscript>` fallback obrigatório quando reveal esconde conteúdo via opacity (per rules § Accessibility).

### Navigation
- Header sticky (`src/components/layout`), CTA primário em ouro à direita. Hamburger em mobile.
- Footer com produtos, contato, social, redes.

## 6. Do's and Don'ts (focados em landing)

Espelho enxuto da matriz universal em [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md) § 11. Foco nas violações mais comuns ao montar landing de produto.

### Do

- **Do** usar tokens semânticos (`bg-navy`, `text-gold`, `text-text-muted`) — hex inline é falha de CI.
- **Do** respeitar `prefers-reduced-motion` em toda animação decorativa (`global.css` já implementa o global, mas confirmar em utilities novas).
- **Do** importar de `motion/react`, nunca `framer-motion` (per [`AGENTS.md`](AGENTS.md) — pacote oficial é `motion`).
- **Do** usar `:focus-visible` ring de ouro 2px com offset 2px em todo interativo.
- **Do** lazy-load ícones e componentes pesados; manter initial JS < 50KB em página prerenderizada (per [`.claude/rules/stability.md`](.claude/rules/stability.md) § Performance gates).
- **Do** usar `loading="eager"` + `fetchpriority="high"` em hero image; `loading="lazy"` no resto.

### Don't

- **Don't** copiar template SaaS (hero 50/50 com gradient text, three-up de cards equal-width, glassmorphism decorativo padrão). Falha o AI slop test (per [`PRODUCT.md`](PRODUCT.md) § Anti-references).
- **Don't** hex inline em `.astro` / `.tsx` (`bg-[#1a1a2e]`, `text-[#d4af37]`). CI biome bloqueia.
- **Don't** animar layout properties (`width`, `height`, `top`, `left`, `padding`, `margin`). Use `transform` + `opacity` apenas (per rules § 7).
- **Don't** usar `transition: all`. Listar propriedades explícitas.
- **Don't** misturar bibliotecas de ícones — Lucide-only (per [`package.json`](package.json), `lucide-react`).
- **Don't** abrir um segundo scroll owner em mobile. Uma página, um scroll.
- **Don't** colocar texto em ouro sobre branco sem usar `#8B6914` (gold-text-safe). Ouro `#d4af37` ou `#AC9469` sobre branco falha contraste — relevante se o site ganhar bloco em fundo claro no futuro.
- **Don't** usar `text-gradient-gold` em corpo / parágrafos. Reservar para chrome de marca (logo, eyebrow de hero, número de impacto isolado).
- **Don't** abusar de `glass-card` / `glass-card-bright`. São acentos cirúrgicos, não fundo default.
- **Don't** introduzir nova família tipográfica. Playfair + Inter cobrem tudo.

## 7. Routing — onde ir

| Pergunta | Abrir |
|---|---|
| Tokens HSL completos (dashboard NeonDash) | `.claude/skills/gpus-theme/references/css-variables.md` |
| Contrast safety, depth model dual-mode, design taste matrix | `.claude/skills/gpus-theme/references/design-foundation.md` + `design-taste.md` |
| Component arsenal (Bento, Liquid Glass, magnetic micro-physics) | `.claude/skills/gpus-theme/references/component-arsenal.md` |
| Motion craft (easing, hardware-acceleration, perpetual motion) | `.claude/skills/gpus-theme/references/motion-craft.md` |
| Regras universais Do/Don't, layout, focus, motion | [`.claude/rules/DESIGN.md`](.claude/rules/DESIGN.md) |
| Hidratação Astro, content collections, forms, performance | [`.claude/rules/frontend.md`](.claude/rules/frontend.md) |
| Smoke checklist + anti-patterns + debug triage | [`.claude/rules/stability.md`](.claude/rules/stability.md) |
| SEO + OG + JSON-LD + GEO/AI citation | [`.claude/rules/seo.md`](.claude/rules/seo.md) |
| Astro 6 patterns + render mode + redirects | `.claude/skills/astro/SKILL.md` + `references/gpus-overlay.md` |
| Voz, copy, jornada, IDs de produto | `.claude/skills/grupo-us/SKILL.md` + `references/manual-resumo.md` |
| Brief de produto deste site | [`PRODUCT.md`](PRODUCT.md) |
