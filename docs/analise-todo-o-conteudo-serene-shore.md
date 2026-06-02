# Plano — Camada de marca TRINTAE3 sobre a landing atual

## Context

A landing já usa **só** o wordmark horizontal (`trintae3-wordmark.webp` no Header/Footer), as fotos da Dra. Sacha e a padronagem navy em 2 seções (`NeonStory`, `NeonBio`). O kit em `docs/identidade-visual` contém muito mais material de marca **não aproveitado**:

- **Símbolo isolado** "33" (Ɛ + Ɛ espelhado, forma ampulheta orgânica) — variantes de cor 01–07; hoje **não existe versão vetor limpa** no site (o `favicon.svg` é um PNG raster embutido em base64).
- **Selos circulares** — `Selo 1` "SAÚDE ESTÉTICA AVANÇADA", `Selo 2` "HOF", `Selo 3` — em ouro sobre transparente; **nenhum usado** (a Garantia usa um selo Lucide `shield-check` construído à mão).
- **Padronagem** (`fundos/padronagem_Color-01..06`) em bege-sobre-escuro e **ouro-sobre-escuro** — só a variante navy está em uso, em 2 seções.
- **Variantes de wordmark** — vertical, sem-tagline, duas-cores — só a horizontal é usada.
- `banco de imagens/` — majoritariamente **stock genérico** (mulheres de jaleco brindando, imagem Gemini); só as **texturas neutras** (`bg-neutro-2.jpg`, milky-way) têm uso pontual.
- Lixo: `public/images/products/trintae3.svg` é um placeholder ("Grupo US placeholder", hex hardcoded, Georgia), **sem referência** em `src/`.

**Objetivo:** aplicar uma camada de marca coesa (símbolo, selos, padronagem ouro, variantes de wordmark) na landing atual — reforçando presença de marca e sofisticação — **sem** tocar copy, rotas, render-mode ou destino de lead/tracking. Tudo reversível e token-compliant.

Mapa de cor das variantes (confirmado visualmente): **01 = bege claro** (`#d2cfc6`-ish, p/ fundo escuro), **02 = taupe**, **05 = ouro** (`~#c2a36a`/`#b8960c`). Casam com os tokens `--color-gold-brand` / `--color-gold` / `--color-text-primary`.

---

## Fase 1 — Preparação de assets (gerar arquivos otimizados)

Os fontes são PNGs enormes (~4500px). Criar um script one-off de preparação e rodar com Bun (sharp já é dependência transitiva do Astro — **verificar** `bunx sharp --version` ou import; se ausente, pedir aprovação antes de instalar).

**`scripts/prepare-brand-assets.mjs`** (Node/sharp, executar via `bunx`):
- trim + resize + converter para WebP otimizado, preservando transparência:
  - `marcas/Símbolo/…Color-05.png` → `public/images/brand/symbol-gold.webp` (~512px) *(fallback raster p/ usos onde SVG não cabe)*
  - `marcas/Selo 1/…Color-05.png` → `public/images/brand/selo-saude-estetica.webp` (~512px, transparente)
  - `marcas/Selo 2/…Color-05.png` → `public/images/brand/selo-hof.webp` (~512px)
  - `fundos/padronagem_Color-05.png` → `public/images/brand/pattern-gold.webp`
  - `marcas/Marca vertical/…duas-cores.png` → `public/images/brand/wordmark-vertical.webp`
  - `marcas/Marca sem tagline/…duas-cores.png` → `public/images/brand/wordmark-compact.webp`
- **Confirmar transparência** dos selos (os PNGs de marca costumam ser transparentes; o branco no preview é só o viewer). Se vierem com fundo, aplicar trim/threshold no script.

**Símbolo vetor (manual, não via script):**
- Criar `public/favicon.svg` recriando o símbolo "33" como path(s) vetor limpo (duas curvas espelhadas, stroke arredondado), substituindo o blob raster atual. Asset standalone de marca → fill explícito em ouro `#c2a36a` (mesma classe dos PNGs de logo; exceção de asset de marca, fora de `.astro`/`.tsx`/`global.css`).
- Criar componente **`src/components/shared/BrandSymbol.astro`** com o mesmo path em SVG inline usando `fill="currentColor"` → respeita tokens (`text-gold`, `text-gold-brand`) sem hex hardcoded. Props: `class`, `aria-hidden`/`title`. **Verificar fidelidade** lado-a-lado com `marca-simbolo_Color-05.png`.
- (Opcional, confirmar) regenerar `favicon-32/96.png`, `apple-touch-icon.png`, `icon-512.png` a partir do símbolo.

---

## Fase 2 — Componentes compartilhados novos

1. **`src/components/shared/BrandSymbol.astro`** — símbolo inline SVG, `currentColor`, escalável. Base de divisores/watermark/accents.
2. **`src/components/shared/SectionDivider.astro`** — régua fina `border-gold/15` + `<BrandSymbol>` centralizado em ouro. Usado em 2–3 costuras estratégicas (não todas — preservar ritmo).
3. **`src/components/shared/BrandSeal.astro`** — `<img>` do selo (width/height explícitos, `loading="lazy"`), variante `spin` opcional (rotação lenta `animation: spin 24s linear infinite`) **honrando `prefers-reduced-motion`** (sem girar quando reduzido). Props: `seal` (`saude-estetica` | `hof`), `spin`, `size`.

---

## Fase 3 — Mapa de aplicação (seção → asset → como)

| Onde | Arquivo | Asset | Como |
|---|---|---|---|
| **Favicon** | `public/favicon.svg` + `Layout.astro` | Símbolo vetor | Substituir blob raster por vetor limpo |
| **Hero** | `src/components/landing/LandingHero.astro` | Símbolo (watermark) | `<BrandSymbol>` grande, baixa opacidade, ouro, `absolute` atrás do conteúdo, `aria-hidden`. Soma ao mesh/glow existente |
| **Divisores** | `index.astro` (2–3 costuras, ex.: Mechanism→Differentials, Comparison→AudienceFit) | Símbolo | `<SectionDivider>` |
| **Garantia** | `src/components/landing/Guarantee.astro:29-49` | Selo "Saúde Estética Avançada" | Trocar o selo Lucide hand-built pelo `<BrandSeal seal="saude-estetica">`; manter badge "{daysCount} dias" sobreposto |
| **Autoridade/Bio** | `src/components/landing/NeonBio.astro` | Selo (rotativo) | `<BrandSeal seal="hof" spin>` perto da foto da Dra. Sacha |
| **Faixa CTA** | `src/components/landing/LandingCTA.astro` | Padronagem ouro | `pattern-gold.webp` ~8% opacidade como textura de fundo do card (atrás, `aria-hidden`) |
| **HeroTrustBar** | `src/components/landing/HeroTrustBar.astro:22` | Selo (pequeno, estático) | Âncora visual opcional na barra "Selos e provas" |
| **Footer** | `src/components/shared/Footer.astro` | Wordmark vertical/compact + símbolo | Lockup vertical + accent de símbolo |
| **Cards** | `Pillars` / `Differentials` | Símbolo (corner accent) | `<BrandSymbol>` muito sutil no canto, opcional |
| **OG image** | `public/og/trintae3.png` + `og-image.png` | Símbolo + padronagem + wordmark | Regenerar 1200×630 com marca (confirmar — superfície de SEO/identidade) |
| **Texturas neutras** | 1–2 seções (ex.: `PainPoints` ou fundo de `NeonStory`) | `bg-neutro-2` / milky-way | Overlay sutil de profundidade, tratado em navy (baixa opacidade, blend `overlay`/`multiply`, mascarado) — só isto do banco de imagens |

---

## Fase 4 — Limpeza

- Remover `public/images/products/trintae3.svg` (placeholder, hex hardcoded, sem referência) — **confirmar antes de deletar**.
- Avaliar `public/images/products/trintae3.webp` (uso?) — manter por ora.

---

## Compliance (cardinal rules)

- **Sem hex hardcoded** em `.astro`/`.tsx`: `BrandSymbol` usa `currentColor` + classes de token. Cor de marca via `text-gold`/`text-gold-brand`. `favicon.svg`/PNGs/selos são assets standalone de marca (exceção, fora de source/`global.css`).
- **Render-mode**: nenhuma ilha React nova; tudo Astro puro + CSS/script vanilla. Animação do selo é CSS, honra `prefers-reduced-motion`.
- **Imagens**: `width`/`height` explícitos (CLS=0), `loading="lazy"` abaixo da dobra, WebP otimizado.
- **SSOT**: zero copy hardcoded; nada toca `productJson`, WhatsApp helper, endpoint de lead ou IDs de tracking.
- **Main-only**: editar em `main`, sem branch/push/deploy salvo pedido.
- **Protected files**: `Layout.astro` não é protegido, mas favicon/OG são identidade → mudança consciente; `astro.config.mjs` não muda.

---

## Verificação (end-to-end)

1. `bun run lint && bunx astro check && bun run build` — gate padrão.
2. **Fidelidade do símbolo**: comparar `BrandSymbol`/`favicon.svg` lado-a-lado com `marca-simbolo_Color-05.png`.
3. **Hex scan**: nenhum `#[0-9a-fA-F]{3,8}` novo em `.astro`/`.tsx` fora de `global.css`.
4. **Reduced-motion**: DevTools → emular `prefers-reduced-motion: reduce` → selo rotativo para; sem jank.
5. **Favicon**: renderiza vetor nítido na aba (não pixelado).
6. **Perf/CWV (advisory)**: novos assets com `width`/`height`, lazy abaixo da dobra; conferir top chunks/bundle inalterados; selos/pattern dentro de orçamento.
7. **A11y**: assets decorativos `aria-hidden="true"`; selos com `alt`/`title` significativo quando informativos.
8. Preview local + olhar Hero, divisores, Garantia, Bio, faixa CTA, Footer em mobile e desktop.

---

## Fora de escopo

- Copy, FAQ, oferta, datas (vivem em `productJson`).
- Rotas, redirects, sitemap.
- WhatsApp/lead endpoint, GA4/Pixel.
- Stock genérico do `banco de imagens` (mulheres de jaleco / Gemini) — descartado por anti-genérico.
- Nova dependência sem aprovação (verificar sharp antes).
