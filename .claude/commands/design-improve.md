---
description: Iterative design enhancement chain (audit → bolder → animate → colorize → overdrive). 5 phases spawn frontend-specialist foreground. Use --from=<phase> to resume. Ends with /verify quick.
workflow_type: prompt-chaining
---

# /design-improve — Iterative Design Enhancement Chain

**ARGUMENTS**: $ARGUMENTS

> Sequential impeccable-skill chain. Each phase reads its reference file, spawns `frontend-specialist` (foreground, write-capable), produces a phase report under `${rulesDir}/agent-memory/design-improve/`, then advances. Single `/verify quick` gate at the end. Resume mid-chain with `--from=<phase>`.

---

## Stopping Conditions

- STOP if any phase reports a Maestro gate FAIL → present report, ASK user before retry
- STOP if a phase introduces hardcoded hex (`#[0-9a-fA-F]{3,8}`) in changed files
- STOP if a phase touches files outside the resolved SCOPE glob
- STOP if 2 consecutive phases produce zero file changes → ASK (likely scope mis-targeted)
- STOP after 3 phases if `bun run type-check` errors accumulate (do not let errors compound across phases)
- STOP if `/verify quick` returns `NEEDS-WORK` → surface gate + all agent-memory reports, ASK user (no auto-retry)
- ASK if glob resolves to 0 files
- ASK before Phase 5 (`overdrive`) when SCOPE includes any file under `apps/web/src/components/billing/**` or `apps/web/src/components/auth/**` (high-risk surfaces — overdrive can break checkout/login)

---

## 0. Context load (WISC)

```typescript
Skill("superpowers:using-superpowers"); // meta — bootstrap (per _shared.md § 0.5)
```

1. Run `/prime frontend` — loads `.claude/rules/DESIGN.md` (merged web-layer rule).
2. If continuing a prior session → read `${rulesDir}/docs/evolution/HANDOFF.md` first.

**Tier 2 (auto-loaded on `apps/web/**`):** `.claude/rules/DESIGN.md` — tokens, mobile scroll owner, motion canon.

**Tier 3 references (read on demand inside the spawned agent):**
- Project design system foundation: `Skill("gpus-theme")` → `references/design-foundation.md`
- Anti-AI-slop gates: `Skill("gpus-theme")` → `references/ux-product-review.md`
- impeccable methodology: `Skill("impeccable")` (SKILL.md is the router; per-phase reference files live in `.claude/skills/impeccable/reference/`)

---

## 1. Argument parsing

`$ARGUMENTS` shape: `<scope> [--from=<phase>]`

| Token | Meaning | Default |
|---|---|---|
| first positional (no `--` prefix) | scope (alias · file path · or glob) | **required** |
| `--from=audit\|bolder\|animate\|colorize\|overdrive` | resume at named phase | `audit` |

### 1.1 Scope resolution

The first positional token is classified into one of three forms:

| Form | Detection | Resolution |
|---|---|---|
| **Glob** | contains `*`, `?`, `{`, `[` | used as-is via `Glob(pattern)` |
| **Path** | contains `/` OR ends with `.tsx`/`.ts`/`.css`/`.md` | used as-is (single-file or directory) |
| **Alias** | bare word, no `/`, no extension, no glob char | expanded via the alias map below |

### 1.2 Alias map (NeonDash feature folders)

For an alias like `clientes`, expand to the union of these globs (any that exist):

```
apps/web/src/components/<alias>/**
apps/web/src/pages/<alias>.tsx
apps/web/src/pages/<alias>/**
apps/web/src/routes/_dashboard.<alias>.tsx
apps/web/src/routes/_dashboard.<alias>.*.tsx
apps/web/src/routes/_dashboard.<alias>.$*.tsx
```

Common aliases (not exhaustive — any folder under `apps/web/src/components/` works):

| Alias | Surface |
|---|---|
| `clientes` | CRM/clientes page + components |
| `chat` | WhatsApp chat workspace |
| `agenda` | Calendar / scheduling |
| `crm` | CRM dashboards |
| `financeiro` | Financial dashboards |
| `dashboard` | Main dashboard surface |
| `settings` / `configuracoes` | Settings (both aliases map to same surface; `configuracoes` is the route prefix) |
| `ads` / `facebook-ads` | Ad-campaign surfaces |
| `admin` | Admin tools |
| `marketing` | Marketing center |
| `notifications` | Notification center |
| `auth` | Auth flow components |
| `landing` | Landing page |
| `academia-neon` | Academia Neon surface |
| `ai-chat` | AI chat sidebar |

If the alias has no matching folder/file → STOP and ASK ("scope `<alias>` did not match any known surface; pass a path or glob instead").

### 1.3 Examples

```
/design-improve clientes                                   # alias → expands to clientes folder + route + page
/design-improve chat --from=animate                        # alias + resume mid-chain
/design-improve apps/web/src/components/agenda/**          # explicit glob
/design-improve apps/web/src/pages/dashboard/index.tsx     # single file
/design-improve "apps/web/src/components/{settings,profile}/**"  # multi-folder glob
```

Resolve via `Glob(pattern)` (after alias expansion if applicable). If 0 files match → STOP and ASK.

---

## 2. Phase sequence (strict order)

| # | Phase | Reference | Owner | Phase-specific constraint |
|---|---|---|---|---|
| 1 | audit | `audit.md` | frontend-specialist | Report-only if zero defects found; fix in-phase if defects found |
| 2 | bolder | `bolder.md` | frontend-specialist | Sovereign Gold accent budget ≤10% surface in Restrained mode |
| 3 | animate | `animate.md` | frontend-specialist | `prefers-reduced-motion` mandatory; only `transform`/`opacity` |
| 4 | colorize | `colorize.md` | frontend-specialist | Semantic tokens only — no new hex |
| 5 | overdrive | `overdrive.md` | frontend-specialist | Maestro Template Test must still pass post-overdrive |

`--from=<phase>` skips earlier phases. Later phases never run before earlier ones.

---

## 3. Phase blocks

Each phase below uses the same template. Variables shown in `{{...}}`.

### Shared phase-block template (DO NOT collapse)

```typescript
Agent({
  subagent_type: "frontend-specialist",
  run_in_background: false,
  description: "design-improve / {{PHASE_NAME}} — {{resolvedScope}}",
  prompt: `
    SCOPE: {{resolvedScope}}
    PHASE: {{PHASE_NAME}} ({{N}}/5) — impeccable methodology
    CHAIN: design-improve

    LOAD BEFORE ANY EDIT (mandatory, in order):
      1. Skill("superpowers:using-superpowers")
      2. Skill("gpus-theme")                              // NeonDash tokens — NEVER substitute
      3. Skill("frontend-design:frontend-design")         // creative execution layer
      4. Skill("impeccable")                              // router (setup + register)
      5. Read .claude/skills/impeccable/reference/{{PHASE_FILE}}
      6. Read .claude/agent-memory/design-improve/{{prev-phase-slug}}.md (if N > 1)
      7. node .claude/skills/impeccable/scripts/load-context.mjs

    HARD CONSTRAINTS (cardinal rules — non-negotiable):
      - Hardcoded hex FORBIDDEN — semantic tokens only (bg-primary, text-foreground, border-border, etc.)
      - Bun only — never npm / pnpm / yarn
      - LF line endings (Biome rejects CRLF)
      - Maestro 6 gates apply EVERY phase: Safe Split / Glass Trap / Glow Trap / Bento Trap / Blue Trap / Line Trap
      - Never animate CSS layout properties — transform / opacity only
      - prefers-reduced-motion mandatory if you change motion
      - impeccable LAYERS ON TOP of gpus-theme — never replace tokens, palette anchors (Sovereign Gold + Azul Petróleo), or motion canon

    PHASE-SPECIFIC CONSTRAINT:
      {{PHASE_SPECIFIC_CONSTRAINT}}

    DELIVERABLE (write to .claude/agent-memory/design-improve/{{phase-slug}}.md):
      - PHASE COMMITMENT (3–5 lines: what changes / what stays)
      - Files touched (absolute paths)
      - Diff summary (one line per file)
      - Deferred items (out-of-scope work owned by later phases)
      - Maestro self-check: 6 gates → PASS / N/A
      - Return < 2000 tokens to main context (per .claude/rules/agents.md)

    DO NOT:
      - Run /verify (chain controller runs it once at the end)
      - Spawn other agents (you are the leaf executor)
      - Touch files outside SCOPE glob
      - Substitute impeccable register for the GPUS palette
  `,
});
```

**Gate before advancing to Phase N+1 (chain controller checks):**

1. Expected agent-memory file exists at `.claude/agent-memory/design-improve/{{phase-slug}}.md`
2. Maestro self-check section shows no FAIL
3. `Grep("#[0-9a-fA-F]{3,8}")` on changed files = 0 matches
4. If any gate fails → STOP, surface report, ASK user before retry

### Phase 1 — audit (`frontend-specialist` + impeccable/audit.md)

**Skip when:** `--from` resolves to `bolder`, `animate`, `colorize`, or `overdrive`.
**Inputs:** `$ARGUMENTS` SCOPE only (first phase).
**PHASE_SPECIFIC_CONSTRAINT:** If zero defects found → produce report only, do NOT change files. If defects found → fix in-phase before producing report.

### Phase 2 — bolder (`frontend-specialist` + impeccable/bolder.md)

**Skip when:** `--from` resolves to `animate`, `colorize`, or `overdrive`.
**Inputs:** `.claude/agent-memory/design-improve/audit.md` (Phase 1 deferred bold-up opportunities).
**PHASE_SPECIFIC_CONSTRAINT:** Respect Sovereign Gold accent budget ≤10% surface (Restrained register). Only adjust intensity, weight, contrast, and structural boldness — never replace token anchors.

### Phase 3 — animate (`frontend-specialist` + impeccable/animate.md)

**Skip when:** `--from` resolves to `colorize` or `overdrive`.
**Inputs:** `.claude/agent-memory/design-improve/bolder.md`.
**PHASE_SPECIFIC_CONSTRAINT:** `prefers-reduced-motion` block mandatory in every motion change. Animate `transform` / `opacity` only — never `top` / `left` / `width` / `height` / `margin`.

### Phase 4 — colorize (`frontend-specialist` + impeccable/colorize.md)

**Skip when:** `--from` resolves to `overdrive`.
**Inputs:** `.claude/agent-memory/design-improve/animate.md`.
**PHASE_SPECIFIC_CONSTRAINT:** Semantic tokens only. No new hex values. If a color role is missing → STOP and ASK before introducing a new token.

### Phase 5 — overdrive (`frontend-specialist` + impeccable/overdrive.md)

**Skip when:** never (last phase).
**Inputs:** `.claude/agent-memory/design-improve/colorize.md`.
**PHASE_SPECIFIC_CONSTRAINT:** Maestro Template Test must still pass post-overdrive. Re-run the 6-gate self-check after the change. Pre-flight ASK gate fires if SCOPE includes `billing/**` or `auth/**`.

---

## 4. End-of-chain verification

After the last executed phase (full chain OR last phase when `--from` was used) completes its gate:

```typescript
SlashCommand("/verify quick");
```

`/verify quick` runs Phase 0 gates (biome / type-check / lint / vitest) + `/debug` + spec compliance only — single gate at chain end, NOT per phase.

On `NEEDS-WORK`:
- Report the failing gate
- Surface every `.claude/agent-memory/design-improve/<phase>.md` from this run
- ASK user (do not auto-retry)

On `VERIFIED` / `VERIFIED-WITH-NOTES`:
- Summarize files touched per phase
- Hand off to `/evolve` if the user wants learning capture

---

## 5. Anti-patterns

| Don't | Do |
|---|---|
| Run phases out of order | Strict audit → bolder → animate → colorize → overdrive |
| Run `frontend-specialist` background | Foreground only (background silently denies Write/Edit) |
| Skip `Skill("gpus-theme")` in phase prompts | Load EVERY phase — impeccable LAYERS on top of gpus-theme |
| Substitute impeccable palette for GPUS anchors | impeccable enriches color strategy; Sovereign Gold + Azul Petróleo stay canonical |
| Run `/verify` per phase | Single `/verify quick` at end-of-chain (locked decision) |
| Use `tsc --noEmit` / `bunx tsc` | `bun run type-check` (tsgo) per AGENTS.md cardinal rules |
| Hardcode hex during `colorize` / `bolder` | Semantic tokens (`bg-primary`, `text-gold-500`, etc.) |
| Skip Maestro Template Test after `overdrive` | Re-run all 6 gates after overdrive — it's the highest-risk phase |
| Auto-retry on `/verify quick` failure | Stopping conditions require ASK — never silent retry |
| Spawn other agents from inside a phase | Leaf executor only — chain controller orchestrates |
