---
globs: src/**, astro.config.mjs, src/content.config.ts, .claude/**
---

# Astro Invariants (Tier 2 — Auto-loaded, Project-Specific)

> Lightweight overlay marking **non-negotiable Astro invariants** for gpus-site. Framework deep-dive + examples live in `Skill('astro')` → `references/gpus-overlay.md`.
> Stack: Astro 6 + React 19 (islands) + Tailwind v4 + Bun, **static-only** MPA. Deploy: Railway.

---

## 1. Render-mode invariant (cardinal #4)

- Project ships **static HTML** built by `bun run build`. No SSR adapter installed.
- **Never** add `export const prerender = false;` to any page.
- **Never** install an SSR adapter (`@astrojs/node`, `@astrojs/vercel`, `@astrojs/cloudflare`).
- **Never** introduce client-side routing (`ClientRouter`). Astro is MPA by design; View Transitions are progressive enhancement.

## 2. Hydration directive routing (`client:*`)

| Directive | When | Use case |
|---|---|---|
| (none) | Always when possible | Static `.astro` markup, zero JS |
| `client:load` | Above-fold + interactive on first paint | Mobile menu toggle, sticky header dropdown |
| `client:idle` | Above-fold pure-visual, can wait for idle | Hero animation (per CLAUDE.md routing row "Hero island animation") |
| `client:visible` | Below-fold interactive | Pricing reveal, FAQ accordion, testimonial slider |
| `client:media="(min-width: 768px)"` | Only on certain viewport | Desktop-only floating sidebar |
| `client:only="react"` | Component cannot SSR | Last resort only — third-party widgets with module-top `window` ref |

**`client:only` ban exceptions:** Only when component references `window` / `document` at **module-top scope** (not inside `useEffect`). Lifecycle-gated browser APIs **CAN SSR** — use `client:load` / `client:visible` instead.

**Default = no directive.** Pure `.astro` for static; `.tsx` island only when interactivity is proven.

## 3. Content Collections SSOT (cardinal #5)

- Copy (products, FAQs, testimonials, team, pricing) lives in `src/content/<collection>/*.{md,mdx,yaml,json}` validated by Zod schema in `src/content.config.ts` (**protected file**).
- Components read via `getCollection('<name>')` / `getEntry('<name>', '<slug>')`. **Never** inline product / FAQ / testimonial string literals.
- Schema validation runs in `bunx astro check` (predeploy gate). Type errors block CI.
- Adding a content field: update schema + content file + reading component **in one commit**.

## 4. Redirect tri-sync

External-product redirects move in **one commit** across three locations:

1. **`src/content/products/<slug>.json::externalSiteUrl`** — source of truth for destination.
2. **`astro.config.mjs::redirects`** — slug → destination URL (must match `externalSiteUrl`).
3. **`astro.config.mjs::integrations.sitemap.filter`** — return `false` for the slug (otherwise sitemap split-indexes slug + destination).

Drift on any one = SEO split-index hazard.

**Don't:** hardcode `Astro.redirect()` or `<meta http-equiv="refresh">` outside `astro.config.mjs::redirects`. The config block is the single source of truth.

Current redirect slugs: `/na-mesa-certa`, `/trintae3`, `/comunidade-us`, `/neon-dash`. Verify in `astro.config.mjs` before adding.

## 5. WhatsApp SSOT (cardinal #6)

- **Never** inline `wa.me/...` URLs.
- Phone E.164: `src/lib/whatsapp.ts::WHATSAPP_SDR_E164` (single source).
- URL building: `whatsappUrlWithText()` helper (in `src/lib/whatsapp.ts`, **protected file**).
- Message text: `cta.whatsappMessage` in `src/content/products/<slug>.json`, always prefixed `Olá, Laura!`.
- Detail → `Skill('grupo-us')` → `references/whatsapp-ssot.md`.

## 6. View Transitions (opt-in)

If wired via `<ViewTransitions />` from `astro:transitions` in `src/layouts/*.astro`:

- `astro:page-load` listener **must** feature-detect (`if ('startViewTransition' in document)`).
- Transition CSS must fall back gracefully when API unsupported.
- `prefers-reduced-motion: reduce` honored (cardinal #8 — no layout-property animation).

## 7. `Layout.astro` contracts

Root layout owns:
- `<html lang="pt-BR">`
- `<meta>` block (title, description, OG, Twitter, canonical, JSON-LD Organization + BreadcrumbList)
- Skip link (first focusable) → `<main id="conteudo-principal" tabindex="-1">`
- Default OG image fallback (`public/og-default.png`)
- Preconnect to Google Fonts (Playfair Display + Inter)
- `<noscript>` reveal fallback for any scroll-reveal opacity/transform islands

Pages override `title` / `description` / `ogImage` via frontmatter — never inline alternative `<meta>` blocks.

## 8. Tailwind v4 `@theme`

- All design tokens live in `src/styles/global.css` `@theme` block.
- Hex hardcoded outside this block = cardinal violation #7.
- Token canon (Navy/Gold HSL, semantic map) → `Skill('gpus-theme')`.

## Anti-patterns (Astro)

| Don't | Why |
|---|---|
| `client:only="react"` when component gates `window` only in `useEffect` | Component CAN SSR — `client:load` / `client:visible` instead |
| `client:load` on hero animation | Use `client:idle` (post-paint) per CLAUDE.md routing |
| Inline `Astro.redirect("/x")` in page frontmatter | Use `astro.config.mjs::redirects` (single source of truth) |
| Add redirect without updating sitemap `filter` | SEO split-index |
| `view-transition` listener without feature detection | Breaks browsers without API |
| Heavy lib (`motion`, `lucide-react`) imported in `Layout.astro` | Loads on every page → blow initial JS 50KB budget |
| Hardcoded copy in `*.astro` instead of `getCollection()` | Cardinal #5 violation; bypasses Zod schema |
| `export const prerender = false` | Cardinal #4 violation (static-only) |

## Pointers

- Framework deep-dive + examples + escape hatches → `Skill('astro')` (+ `references/gpus-overlay.md`).
- Token / theme syntax (`@theme`, Navy/Gold canon) → `Skill('gpus-theme')`.
- Brand voice / WhatsApp Laura SSOT → `Skill('grupo-us')`.
- Universal frontend rules → `.claude/rules/frontend.md`.
- Universal stability + smoke → `.claude/rules/stability.md`.
- SEO + sitemap config → `.claude/rules/seo.md`.
- Cardinal rules + routing matrix → `.claude/CLAUDE.md`.
