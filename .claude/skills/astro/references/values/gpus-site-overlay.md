# gpus-site — Astro overlay values

> Project-specific values for `gpus-site` (Grupo US institutional Astro site).
> Structure / templated patterns: sibling `project-overlay-template.md`.
> Resolves alongside `.claude/config.json` (`project.*`, `cardinals.*`, `whatsapp.*`).

---

## Cardinal values (gpus-site)

| Cardinal | Value | Source |
|---|---|---|
| `renderMode` | `static-only` | `config.json::cardinals.renderMode` |
| `spa` / `ssrAdapter` | `forbidden` | `config.json::cardinals.*` |
| `contentSsot` | `src/content/` | `config.json::cardinals.contentSsot` |
| `themeSsot` | `src/styles/global.css` | `config.json::cardinals.themeSsot` |
| `iconLibrary` | `lucide-react` | `config.json::cardinals.iconLibrary` |

---

## Hydration allowlist

`client:load` allowed exactly once:

- `src/components/WhatsAppFloatingButton.tsx` — rendered in `src/layouts/Layout.astro`. Persistent floating UI across-route requires immediate hydration.

Hero islands (`client:idle`):
- `AuroraBackground`, `TextGenerateEffect`, and other pure-visual hero components.
- Text-first heroes (Mentoria Black NEON, Curso de Aurículo) SSR text first, hydrate visual island after browser idle.

All other islands default to `client:visible`.

`client:only="react"` — forbidden. Every island in this site can SSR.

Verify:

```bash
grep -rn "client:load" src/
# expect: exactly 1 hit (Layout.astro WhatsAppFloatingButton)

grep -rn "client:idle" src/components/landing src/components/home
# expect: hero islands only
```

---

## External redirect tri-sync — concrete slugs

Current redirect-only paths (move together across product JSON + `astro.config.mjs::redirects` + `sitemap.filter`):

- `/comunidade-us` → `https://drasacha.com.br/pagina-de-inscricao-comu-us/`
- `/na-mesa-certa` → external (see `astro.config.mjs`)
- `/neon-dash` → external
- `/otb` → external
- `/trintae3` → external

Verify after sync:

```bash
bun run check:external-urls
bunx astro check
bun run build
grep -E "/(comunidade-us|neon-dash|na-mesa-certa|otb|trintae3)" dist/sitemap-*.xml
# expect: empty
```

External funnels live on `drasacha.com.br`, Kiwify, `lovable.app` — owned by marketing/external teams. Coordinate before silently changing destinations.

---

## Layout.astro contracts — concrete values

### Skip link
- Class `.skip-link` (defined in `src/styles/global.css`).
- Target: `<main id="conteudo-principal" tabindex="-1">` (id is contractual).
- Copy: `"Pular para o conteúdo principal"` (pt-BR).

### Font preconnect
Google Fonts — Playfair Display + Inter:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" />
```

`display=swap` mandatory.

### Image discipline overrides
- `NeonStory` image is **below-fold** on Mentoria Black NEON landing → keep `loading="lazy"` + `fetchpriority="low"` (per `docs/learnings-log.md` entry [2026-03-26]).

---

## Smoke commands — gpus-site concrete

```bash
# External destination reachability
bun run check:external-urls

# No hardcoded hex outside src/styles/global.css @theme
grep -rn "bg-\[#\|text-\[#\|border-\[#" src/

# Lucide-only icon enforcement
grep -rn "material-symbols\|<i class=\"fa\|font-awesome" src/ \
  --include="*.astro" --include="*.tsx" --include="*.ts"

# Static-only render mode
grep -rn "prerender = false\|prerender: false" src/pages
grep -rn "ClientRouter\|astro:after-swap\|@astrojs/node\|output: 'server'" src/ astro.config.mjs

# Hydration discipline (allowlist: only WhatsAppFloatingButton)
grep -rn "client:load" src/
# expect: 1 hit

# Sitemap excludes redirects
grep -E "<loc>https?://[^<]+(/comunidade-us|/neon-dash|/na-mesa-certa|/otb|/trintae3)" dist/sitemap-*.xml
# expect: empty

# WhatsApp leak — full mechanic: skills/grupo-us/references/whatsapp-ssot.md
grep -rn "wa\.me/\|api\.whatsapp\.com" src/components src/pages \
  --include="*.astro" --include="*.tsx" --exclude="src/lib/whatsapp.ts"
# expect: empty
```

---

## Cross-references

- Generic Astro overlay structure: sibling `../project-overlay-template.md`
- Generic Astro patterns: parent `SKILL.md` + sibling `../{core-concepts,islands-architecture,content-collections,styling-tailwind,performance,view-transitions,troubleshooting}.md`
- WhatsApp SSOT mechanic: `.claude/skills/grupo-us/references/whatsapp-ssot.md`
- Theme tokens canon: `.claude/skills/gpus-theme/references/values/gpus-canon.md`
- 8 cardinals + routing matrix: `.claude/CLAUDE.md`
