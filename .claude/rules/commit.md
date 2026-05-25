---
globs: src/**, .claude/**, public/**, scripts/**, astro.config.mjs, package.json, src/content/**
---

# Commit Format + Pre-Commit Gate (Tier 2 — Auto-loaded)

> Canonical for all commits. Conventional Commits + lefthook pre-commit hook + manual gate checklist.
> Project-specific values (scopes, package manager, protected files, WhatsApp SSOT) resolve from `.claude/config.json`.

## Conventional Commits

Format: `<type>(<scope>): <subject>` — `feat | fix | docs | refactor | chore | test | perf | style | build | ci`.

**Scopes** — canonical list lives in `.claude/config.json::commit.scopes`. For gpus-site today: `site`, `theme`, `content`, `seo`, `astro`, `redirects`, `config`, `scripts`, `.claude`, `deps`, `a11y`, `perf`.

Examples (gpus-site):
- `feat(site): add /<slug> landing` (where `<slug>` is the new page)
- `fix(redirects): tri-sync /<slug> exclusion in sitemap filter`
- `chore(.claude): expand config.json schema (whatsapp + cardinals + scopes)`
- `refactor(theme): collapse token aliases per theme skill`
- `fix(content): WhatsApp message prefix per brand SSOT`

One logical change per commit. Reference touched rule when relevant (e.g., `fix(astro): redirect tri-sync per .claude/rules/astro.md §4`).

## Pre-Commit Gate (automated via lefthook)

`lefthook.yml` runs on every `git commit` (no skip without explicit user request):

```yaml
pre-commit:
  commands:
    lint:
      run: <packageManager> run lint
      glob: "{src/**,astro.config.mjs}"
```

Today (`config.json::tooling.packageManager = bun`) → `bun run lint` = `bunx biome check src astro.config.mjs && bunx oxlint src --ignore-pattern 'src/layouts/*'`.

## Manual Gate Checklist (before staging)

Run **in order** — substitute `<pm>` for `config.json::tooling.packageManager` (currently `bun`). Failure of any step blocks commit — fix root cause, re-stage, restart:

1. **Format + Lint** — `<pm> run lint` → 0 errors.
2. **Type-check** — `<pm>x astro check` → 0 errors (validates `.astro` + `.ts` + `.tsx` + Content Collections schema in `src/content.config.ts`).
3. **Build** — `<pm> run build` → success (catches schema / hydration / asset issues).
4. **External URL check** — `<pm> run check:external-urls` → all redirect destinations reachable (cardinal #1 — verify before applying).
5. **Hardcoded hex scan** — staged UI files (`src/**/*.{astro,tsx,ts}` excluding `config.json::cardinals.themeSsot`) → `grep -nE '#[0-9a-fA-F]{3,8}' <files>` must be **0** (cardinal #7).
6. **WhatsApp inline scan** *(only when `config.json::whatsapp.enabled = true`)* — `grep -rnE 'wa\.me/' src/ --include='*.astro' --include='*.tsx' --include='*.ts' --exclude='<whatsapp.ssotFile>'` must be **0** (cardinal #6).
7. **Content drift scan** — staged `.astro` / `.tsx` → no hardcoded product / FAQ / testimonial literals (cardinal #5 — must read from `config.json::cardinals.contentSsot`).
8. **Production noise** — staged files → `grep -nE '\bconsole\.log\b|\bdebugger\b' <files>` must be **0**.

For UI / a11y / perf changes, also run:

9. **Lighthouse audit** — `<pm> run lighthouse:audit` → meets gates from `.claude/config.json::gates`.
10. **Smoke test** — `<pm> run smoke-test`.

## Protected files (cardinal — confirm before touching)

Canonical list lives in `.claude/config.json::protectedFiles.exact`. Edit only with explicit reason. Schema changes to Content Collections schema file trigger downstream content-shape audits.

## On gate failure

STOP. Report which gate + exact error. **Never `git commit --amend`** after hook failure — original commit did NOT happen; amending modifies PREVIOUS commit (data loss risk). Instead: fix → re-stage touched files → fresh `git commit -m "..."`.

**Never `--no-verify`** unless user explicitly requests.

## CRLF mass recovery

If CI surfaces hundreds of formatter errors at once, likely line-ending mismatch:

```bash
<pm>x biome check --write && git add --renormalize .
```

## Branch protection (HARD RULE — non-negotiable)

`main` is **read-only** mirror of approved + merged work. Workflow: `dev-test → PR → user approves + merges`.

- **Never** `git checkout main` or work on main.
- **Never** `git push origin main`.
- **Never** `gh pr merge --auto` on a PR you opened.
- **Never** force-push to shared branches.

Detail: `.claude/CLAUDE.md § Branch protection` (when present) + project routing.

## When to load more

| Need | Load |
|---|---|
| Universal stability + smoke template | `.claude/rules/stability.md` |
| MCP + terminal + debug discipline | `.claude/rules/mcp.md` |
| Commands inventory + skill phase ordering | `.claude/rules/commands.md` |
| Stack invariants (current: Astro) | `.claude/rules/astro.md` |
| Cardinal rules + project routing | `.claude/CLAUDE.md` |
