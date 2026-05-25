# Bootstrap — new Grupo US project from `gpus-site` seed

> Checklist for spinning up a new Grupo US project (new vertical, new institutional site, new product landing) using `gpus-site` as the `.claude/` seed.
> Target time: **~30 min** from clone to first `bun run build` green.

---

## 0. Prerequisites

- Bun installed (or your chosen package manager).
- Access to `gpus-site` repo (this one) as the seed.
- Decided: project name, domain, locale, stack, whether WhatsApp SDR Laura applies, whether brand canon = GPUS or a new brand fork.

If any of those decisions are open, brainstorm first (use `Skill('superpowers:brainstorming')`).

---

## Step 1 — Clone + rename

```bash
# from outside the existing gpus-site folder
git clone <gpus-site-remote> <new-project-name>
cd <new-project-name>
git remote remove origin
# optionally: git remote add origin <new-remote-url>
```

Confirm the working tree builds before any edits:

```bash
bun install
bun run build
```

Baseline green. If red here, fix before continuing — never start from a broken seed.

---

## Step 2 — Clean project-specific content

Remove gpus-site-specific surfaces. Keep schemas + helpers + components.

- `src/content/products/*.json` — delete all (or keep one as `_template.json` for reference, gitignored if unused).
- `src/pages/<gpus-specific>.astro` — e.g., delete `mentoria-black-neon.astro`, `trintae3.astro`, `na-mesa-certa.astro`. Keep `index.astro` (rewrite copy) and `404.astro`.
- `astro.config.mjs::redirects` — remove all entries.
- `astro.config.mjs::sitemap.filter()` — clear the slug allowlist (or empty filter).
- `src/components/landing/*` — audit; delete components that reference deleted products. Keep generic primitives (`Header.astro`, `Footer.astro`, `FAQ.astro`, `CTA.astro`).
- `public/og-*` — replace with new project's default OG image. Keep `public/og-default.png` filename for fallback.
- `src/styles/global.css` — keep `@theme` block; you'll override tokens in Step 6 if brand differs.

Verify:

```bash
bunx astro check        # may fail until schema + content stub aligned — that's OK now
```

---

## Step 3 — Edit `.claude/config.json`

Open `.claude/config.json`. Update these fields **first** — everything else derives from them:

```json
{
  "project": {
    "name": "<new-project-id>",
    "displayName": "<New Project — Display Name>",
    "purpose": "<one-sentence purpose>",
    "stack": "<stack-id>",
    "stackSummary": "<human-readable stack list>",
    "domain": "<canonical-domain.com.br>",
    "stagingUrl": "<localhost-or-staging-url>",
    "productionUrl": "<production-url>",
    "locale": "<locale-code>",
    "brand": "<brand-skill-name>"
  },
  "skills": {
    "brand": "<brand-skill-name>",
    "theme": "<theme-skill-name>",
    "stack": "<stack-skill-name>"
  },
  "cardinals": {
    "renderMode": "<static-only | ssr | hybrid>",
    "spa": "<forbidden | allowed>",
    "ssrAdapter": "<forbidden | required>",
    "contentSsot": "<path-to-content-collection-root>",
    "themeSsot": "<path-to-theme-css-file>",
    "iconLibrary": "<icon-library>"
  },
  "whatsapp": {
    "enabled": <true | false>,
    "sdrName": "<SDR name or empty>",
    "sdrE164": "<E.164 with + or empty>",
    "messagePrefix": "<message prefix or empty>",
    "ssotFile": "<path or empty>"
  },
  "commit": {
    "scopes": ["<list-of-scopes-appropriate-for-this-project>"]
  }
}
```

Fields to leave **as-is** unless project genuinely differs: `paths.*`, `tooling.*`, `gates.*`, `protectedFiles.*`, `rulesDir`, `templatesDir`, `agentsFile`, `claudeMdFile`.

Validate JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/config.json','utf8')); console.log('OK')"
```

---

## Step 4 — Fork brand canon (`grupo-us` skill)

If the new project belongs to **Grupo US** (same group, possibly different vertical), reuse the `grupo-us` skill but fork the values per project:

```bash
# Create per-project values folder
mkdir -p .claude/skills/grupo-us/references/values/<new-project>
```

Then either:

**a) Same brand canon as gpus-site** (same products, same journey): symlink or copy `values/gpus-site/` → `values/<new-project>/` and edit only what differs.

**b) Different vertical** (e.g., drasacha-site standalone): create empty files matching the schema in `.claude/skills/grupo-us/references/template.md`:

- `manual-resumo.md` — required
- `produtos-e-rotas.md` — required
- `conflitos-fontes.md` — recommended
- `cultura-activa.md` — recommended

Fill them with the new project's brand canon (mission, products table, journey, people, anti-patterns).

If the project is **not Grupo US at all** (different brand), fork the skill itself: copy `.claude/skills/grupo-us/` → `.claude/skills/<new-brand>/` and update `config.json::skills.brand`.

---

## Step 5 — Fork stack overlay (`astro` skill)

Create the new project's Astro overlay values file:

```bash
touch .claude/skills/astro/references/values/<new-project>-overlay.md
```

Use `.claude/skills/astro/references/project-overlay-template.md` as the section structure. Fill:

- Cardinal values table (renderMode, contentSsot, themeSsot, iconLibrary).
- Hydration allowlist (which components use `client:load`, `client:idle`, etc.).
- External redirect slugs (if any).
- `Layout.astro` contracts (skip link id + copy in the project locale, font preconnect list).
- Smoke commands with concrete grep patterns for the project's slugs.

If the new project uses a non-Astro stack (e.g., Next.js, Remix), replace `config.json::skills.stack` and add the matching tech-stack skill instead.

---

## Step 6 — Decide brand visual (`gpus-theme` skill)

**a) Same brand visuals as Grupo US** (Navy + Gold + Playfair + Inter): leave `gpus-theme` skill and `assets/theme-tokens.css` as-is. Done.

**b) Different palette** (sister brand, new vertical with own identity):

```bash
# Create per-project theme canon
touch .claude/skills/gpus-theme/references/values/<new-project>-canon.md
```

Fill it using `.claude/skills/gpus-theme/references/template.md` as the section structure (HSL palette, typography, border radius, custom utilities, theme strategy, shadcn config).

Then override `src/styles/global.css` `@theme` block with the new HSL values. If divergence is large, fork the theme skill: copy `gpus-theme/` → `<new-brand>-theme/` and update `config.json::skills.theme`.

---

## Step 7 — Update content collection schema + seed

- Open `src/content.config.ts`. If product / FAQ / testimonial shape changes for the new project, update Zod schemas.
- Create the first content file under `src/content/<collection>/<slug>.json` (or `.md`).
- Update component reads to match new field names.

Verify schema + content alignment:

```bash
bunx astro check
```

Must pass before continuing.

---

## Step 8 — Validate

Run the full project gate chain:

```bash
bun run lint
bunx astro check
bun run build
bun run check:external-urls    # if external redirects defined
```

All must pass. If any fails, fix root cause — never `--no-verify`.

Smoke browser check:

- Open `bun run dev`, navigate `/`, confirm hero + CTA render with new copy.
- Tab from page top → skip link visible → focus jumps to `<main>`.
- Mobile width — confirm responsive nav.
- Disable JS in DevTools → confirm reveal sections still visible.

---

## Step 9 — Initial commit + branch protocol

```bash
git add .claude/ src/content/ src/styles/ src/pages/ astro.config.mjs public/
git commit -m "chore(.claude): bootstrap <new-project> from gpus-site seed"
```

Set up branch protection per `.claude/rules/commit.md § Branch protection` (HARD RULE — `main` read-only, work on `dev-test` → PR → user approves + merges).

---

## What you didn't have to do

This seed already ships:
- 12 agents (`.claude/agents/`)
- 15 commands (`.claude/commands/`)
- 6 templates (`.claude/templates/`)
- 4 universal rules (`frontend.md`, `DESIGN.md`, `stability.md`, `seo.md`)
- 4 generified rules (`astro.md`, `commit.md`, `mcp.md`, `commands.md`) — auto-resolve via `config.json`
- 10 generic skills (planning, debugger, senior-prompt-engineer, evolution-core, performance-optimization, ui-ux-pro-max, frontend-design, skill-creator, impeccable, xlsx)
- 2 brand-canon skills (`grupo-us`, `gpus-theme`) — fork values per project

You only touch: `config.json`, `values/<new-project>/` content, project-specific code (`src/`, `astro.config.mjs`).

---

## When something doesn't fit

- Cardinals are **non-negotiable** by design, but each has a config gate. If a project genuinely needs SSR, change `config.json::cardinals.renderMode` and the cardinal becomes "SSR rules apply" — don't delete it.
- If a routing matrix row in `.claude/CLAUDE.md` references a file the new project doesn't have, leave the row; it stays dormant for that project. Add new rows only if a genuine new pattern emerges.
- New brand vertical with a different SDR / no WhatsApp / different funnel — set `config.json::whatsapp.enabled = false` and cardinal #6 turns dormant project-wide.

---

## Cross-references

- Config schema: `.claude/scaffolding/init.example.json`
- Field-level mapping (old gpus-site → new project): `.claude/scaffolding/RENAME-MAP.md`
- Brand canon schema: `.claude/skills/grupo-us/references/template.md`
- Theme canon schema: `.claude/skills/gpus-theme/references/template.md`
- Stack overlay schema: `.claude/skills/astro/references/project-overlay-template.md`
- Cardinal rules: `.claude/CLAUDE.md § Cardinal rules`
- Routing matrix: `.claude/CLAUDE.md § Routing matrix`
