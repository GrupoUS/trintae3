# Project Overlay — Astro (template)

> Template for project-specific Astro overlays. Each new project forks `values/<project>-overlay.md` filling slugs, paths, copy, and stack decisions.
> This file holds the **structure**; values live in `references/values/<project>-overlay.md` and `.claude/config.json`.
> Generic Astro patterns: parent `SKILL.md` + sibling `references/{core-concepts,islands-architecture,content-collections,styling-tailwind,performance,view-transitions,troubleshooting}.md`.

---

## Render mode invariants

A project's render mode is fixed at design time. Document it in `.claude/config.json::cardinals.renderMode`. Common values: `static-only` (default for marketing sites), `ssr`, `hybrid`.

When `renderMode = static-only`, these become non-negotiable (override generic Astro guidance):

| Forbidden | Why | Verify |
|---|---|---|
| `export const prerender = false` on any page | Breaks static build contract | `grep -rn "prerender = false\|prerender: false" src/pages` → empty |
| `output: 'server' \| 'hybrid'` in `astro.config.mjs` | Static-only deploy contract | `grep -n "output:" astro.config.mjs` — only `'static'` or omitted |
| Server adapters (`@astrojs/node` / `@astrojs/vercel` / `@astrojs/cloudflare`) | No server runtime | `grep "@astrojs/(node\|vercel\|cloudflare)" package.json` → empty |
| `<ClientRouter />` from `astro:transitions` | No SPA — MPA with full reloads | `grep -rn "ClientRouter" src/` → empty |
| `astro:after-swap` event listeners | Implies SPA router | `grep -rn "astro:after-swap" src/` → empty |

> The project overlay **wins** over generic Astro docs that allow View Transitions / `<ClientRouter />` in Astro 5+/6.

When `renderMode = ssr` or `hybrid` — drop this section; document the SSR adapter + per-page render mode declarations instead.

---

## Hydration (project rule)

Beyond generic guidance, every project should declare its hydration discipline. Common patterns:

- **`client:load`** — list **exact components allowed** here (e.g., persistent floating UI like a WhatsApp button, sticky chat). Any other use needs written justification.
- **Hero islands / pure-visual components** — `client:idle` (post-paint hydration). SSR text first, hydrate visual island after browser idle.
- **Below-fold interactive** — `client:visible` (default).
- **`client:only="react"`** — forbidden unless component cannot SSR (references `window`/`document` at module-top scope).

Verify (template — slugs vary per project):

```bash
grep -rn "client:load" src/
# expect: exactly N hits (per project allowlist in values/<project>-overlay.md)

grep -rn "client:idle" src/components/<hero-folder>
# expect: hero islands only
```

---

## External redirect tri-sync

Three places must move together when an external destination changes (or when a product becomes external):

**1. Content data** (`<contentSsot>/<collection>/<slug>.json` — see `config.json::cardinals.contentSsot`):

```json
{
  "slug": "<slug>",
  "externalSiteUrl": "<destination>",
  "cta": {
    "url": "<destination>",
    "label": "<copy>",
    "type": "primary"
  }
}
```

When `externalSiteUrl` is set, listing components link externally with `target="_blank" rel="noopener noreferrer"` and `sr-only` "(abre em nova guia)" affordance (locale-appropriate).

**2. `astro.config.mjs::redirects`**:

```js
redirects: {
  '/<slug>': { status: 301, destination: '<destination>' },
}
```

Astro emits static HTML stub with `meta refresh` + `noindex` + `canonical` to destination. Handles deep links (bookmarks, marketing).

**3. `astro.config.mjs::sitemap.filter`**:

```js
sitemap({
  filter: (page) => !['<slug-1>', '<slug-2>'].some((p) => page.endsWith(p)),
})
```

Excludes redirect-only paths from `dist/sitemap-*.xml`. Without this, search engines split-index `/<slug>` AND `<externalSiteUrl>`.

**Verification after sync** (substitute `<pm>` from `config.json::tooling.packageManager`):

```bash
<pm> run check:external-urls   # destination reachable
<pm>x astro check              # types still valid
<pm> run build                 # static output regenerated
grep -E "/(<slug-1>|<slug-2>)" dist/sitemap-*.xml  # expect empty
```

External funnels (third-party sites) are owned by other teams. If destination 404s, coordinate before silently changing the URL.

Concrete redirect slugs per project → `values/<project>-overlay.md`.

---

## Layout.astro contracts

Root layout owns these contractual elements — touch carefully:

### Skip link
- Class `.skip-link` (defined in `<stylesRoot>/global.css` — see `config.json::cardinals.themeSsot`).
- Hidden by `transform: translateY(-200%)` until `:focus-visible`; slides in (transform-only, GPU-friendly).
- Target: `<main id="<main-id>" tabindex="-1">` (id is contractual — keep exact per project).
- **Position: first focusable element on every page**.
- Copy: localized to `config.json::project.locale`. Concrete copy in `values/<project>-overlay.md`.

### `<noscript>` reveal fallback
- Inline `<style>` block forces `[data-reveal]` `opacity: 1` + `transform: none` when JS off.
- **Never drop without like-for-like replacement** — JS-off users would see blank sections.

### `[data-reveal]` IntersectionObserver
- Inline script in `Layout.astro` adds `.revealed` class when section enters viewport.
- CSS handles `opacity 0→1` + `translateY(Xpx → 0)` (transform + opacity only, never height).
- Wrapped in try/catch + degrade silently if observer fails.

### Font preconnect
- `<link rel="preconnect" href="<font-host>" />` (e.g., Google Fonts).
- Font family list per project → `values/<project>-overlay.md`.
- `display=swap` mandatory — prevents FOIT.

---

## Content Collections SSOT

Project-specific addendum to generic Astro Content Collections (sibling `references/content-collections.md`):

- `src/content.config.ts` (project root) is SSOT — Zod schemas + glob loaders.
- **Cardinal #5: never hardcode product / team / landing copy** in `.astro` or `.tsx`. Always `getCollection()` / `getEntry()` from `config.json::cardinals.contentSsot`.
- Component template: read `data` from collection, render JSX/Astro from data fields. No string literals from JSON in component file.
- Schema validation is enforced by `astro check` — Zod re-runs on type-check. JSON edits → run check before commit.
- Schema fields are documented in `src/content.config.ts`. Adding a field: update schema + JSON files + component reading the field.

WhatsApp prefix rule (when `config.json::whatsapp.enabled = true`): every product's `whatsappMessage` field starts with `config.json::whatsapp.messagePrefix`. Full mechanic → `Skill('<config.json::skills.brand>')` → `references/whatsapp-ssot.md`.

---

## Image discipline

Already covered in sibling `references/performance.md`. Project rules:

- Hero / above-fold: Astro `<Image>` `loading="eager"` + `fetchpriority="high"`.
- Below-fold: `loading="lazy"` + `fetchpriority="low"`.
- Always explicit `width` + `height` (CLS = 0).
- Decorative: `alt=""` + `aria-hidden="true"`.
- Meaningful: descriptive `alt` in project locale (who + role + context).

Per-image overrides per project → `values/<project>-overlay.md` (e.g., specific below-fold candidates that need explicit lazy hints).

---

## Smoke commands (template — substitute `<pm>` and project slugs)

```bash
# External destination reachability
<pm> run check:external-urls

# No hardcoded hex outside @theme (config.json::cardinals.themeSsot)
grep -rn "bg-\[#\|text-\[#\|border-\[#" src/

# Icon library enforcement (config.json::cardinals.iconLibrary)
grep -rn "material-symbols\|<i class=\"fa\|font-awesome" src/ \
  --include="*.astro" --include="*.tsx" --include="*.ts"

# Static-only render mode (when config.json::cardinals.renderMode = static-only)
grep -rn "prerender = false\|prerender: false" src/pages
grep -rn "ClientRouter\|astro:after-swap\|@astrojs/node\|output: 'server'" src/ astro.config.mjs

# Hydration discipline (allowlist in values/<project>-overlay.md)
grep -rn "client:load" src/
# expect: N hits per project allowlist

# Sitemap excludes redirects (slugs from values/<project>-overlay.md)
grep -E "<loc>https?://[^<]+(/<slug-1>|/<slug-2>)" dist/sitemap-*.xml
# expect: empty

# WhatsApp leak (when config.json::whatsapp.enabled = true)
grep -rn "wa\.me/\|api\.whatsapp\.com" src/components src/pages \
  --include="*.astro" --include="*.tsx" --exclude="<whatsapp.ssotFile>"
# expect: empty
```

Concrete smoke commands for the current project → `values/<project>-overlay.md`.

---

## Quality gates

Final before merge (substitute `<pm>` from `config.json::tooling.packageManager`):

```bash
<pm> run lint
<pm>x astro check
<pm> run build
<pm> run check:external-urls
```

All must pass. Cardinal #2: never mark a task done without evidence.

---

## Cross-references

- Generic Astro patterns: parent `SKILL.md` + sibling `references/*.md`
- Brand voice + WhatsApp SSOT (when `whatsapp.enabled`): `Skill('${skills.brand}')` → `references/whatsapp-ssot.md`
- Theme tokens: `Skill('${skills.theme}')`
- 8 cardinals + routing matrix: `.claude/CLAUDE.md`
- Universal stability checklist: `.claude/rules/stability.md`
- Concrete project values: `values/<project>-overlay.md`
