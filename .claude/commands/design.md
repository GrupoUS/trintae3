---
description: Canonical design workflow. Phase 0 (design spec) → Phase 1 (prototype, optional) → Phase 2 (convert to code) → Phase 3 (validate). frontend-specialist runs in foreground (requires file write permissions).
workflow_type: prompt-chaining
---

# /design — Design Workflow

**ARGUMENTS**: $ARGUMENTS

> Orchestration-only. Deep policy lives in `gpus-theme` (spec) + `frontend-design` (creative execution).

---

## Stopping Conditions

- STOP if 3 design iterations fail Template Test → present options, ask user
- ASK if no design tokens exist for the required color role
- ASK if design contradicts existing component patterns in `${paths.componentsRoot}/`

---

## 0. Context load (WISC)

```typescript
Skill("superpowers:using-superpowers"); // meta — bootstrap (per _shared.md § 0.5)
```

1. Run `/prime frontend` — loads `.claude/rules/DESIGN.md` (merged web-layer rule) first, then only the required references on demand.
2. If continuing a prior session → read `${rulesDir}/docs/evolution/HANDOFF.md` first.

**Tier 2 (auto-loaded on `apps/web/**`):** `.claude/rules/DESIGN.md` — merged web-layer rule (tokens, mobile scroll owner, polling, mutations).

**Tier 3 references (read on demand only):**
- Project design system foundation: `Skill("gpus-theme")` → `references/design-foundation.md`
- LEVER / extend-vs-create philosophy: `Skill("gpus-theme")` → `references/lever-philosophy.md` — only when deciding extend vs create new component
- Implementation handoff (design → build): `Skill("gpus-theme")` → `references/implementation-handoff.md`
- Relevant feature spec — only for the surface being designed

---

## 1. Assess complexity

Per `_shared.md` § 2.

| Complexity | Pattern | When |
|---|---|---|
| L1-L2 | Direct code | Bug fix, simple tweak |
| L3 | Single agent (foreground) | Component, known pattern |
| L4-L5 | Multiple agents | New feature, multi-component |
| L6+ | Agent Team | Full page, complex UX |

---

## 2. Design tool chain

```
Phase 0: explorer + Skill("gpus-theme") → design spec
Phase 1: optional — prototype tool (Stitch / Figma plugin / manual) → reference layout
Phase 2: frontend-specialist + Skill("frontend-design:frontend-design") → component code
Phase 3: debugger + performance-optimizer → validate
```

**Key rule:** `gpus-theme` generates the *spec* (Phase 0). `frontend-design` drives the *creative execution* (Phase 2). They never swap phases.

### 2.1 Phase 1 prototype tool selection

| Tool | When |
|---|---|
| `mcp__stitch__*` (if available) | New pages with available design system asset IDs in project's design-tokens skill |
| Figma / external prototype | When designer hands off in another tool |
| Manual reference | Skip Phase 1 — proceed directly to Phase 2 with the Phase 0 spec |

Pass `--prototype-tool=stitch|figma|manual` in `$ARGUMENTS` to force a specific tool. Default = `auto` (use Stitch if MCP available + design-system asset IDs known, else `manual`).

---

## 3. Pre-flight: design research (mandatory L3+)

Before ANY implementation, invoke the brainstorming-then-spec chain:

```typescript
Skill("superpowers:brainstorming"); // produces design spec at docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
```

The brainstorming skill walks: project context → clarifying questions (one at a time) → 2-3 approaches with tradeoffs → spec sections with user approval gate → spec written to `docs/superpowers/specs/`. NeonDash design tokens + branding then layer on top via `gpus-theme` in the explorer prompt below.

### 3.1 Impeccable `shape` enrichment (additive, runs BEFORE explorer)

Before spawning `explorer` for the gpus-theme spec, run impeccable's `shape` discovery-interview methodology. **Additive** to brainstorming + gpus-theme — never a replacement.

```typescript
Skill("impeccable"); // router (setup + register)
Read(".claude/skills/impeccable/reference/shape.md");
// node .claude/skills/impeccable/scripts/load-context.mjs  (loads PRODUCT.md + DESIGN.md)
```

Apply the shape interview cadence (Purpose & Context · Content & Data · States · Constraints), then hand BOTH the brainstorming spec AND the shape brief to the `explorer` agent. The explorer then synthesises the gpus-theme spec using BOTH as input.

**Critical:** `shape` enriches Phase 0 — it does NOT replace gpus-theme. gpus-theme remains the source of truth for tokens, palette anchors, and Stitch asset IDs. Compressing the shape gates because the brainstorming brief feels complete is the dominant failure mode — do not skip.

Spawn `explorer` (foreground) to generate the design specification using `gpus-theme` for token/branding fidelity.

Prompt template:

```
Invoke Skill("gpus-theme") and analyze: [user request]

Using gpus-theme, generate a complete design spec:
1. Style selection (justify against request context)
2. Color palette (semantic design tokens — never hardcode hex)
3. Typography pairing (name + scale)
4. Layout system (grid, spacing, breakpoints)
5. Component inventory (list primitives to use — shadcn/ui or equivalent)
6. Interaction patterns (hover, focus, loading, error, empty states)
7. Accessibility requirements (WCAG AA minimum)
8. Animation strategy (entrance, micro-interactions, prefers-reduced-motion)

Context: existing patterns in ${paths.componentsRoot}/, current design tokens in ${paths.stylesRoot}/global.css (or equivalent)
Return: structured design spec (no code yet)
```

**Skip only for:** bug fixes (L1-L2) or trivial CSS tweaks.

---

## 4. Agent selection

| Task type | Agent | Background? |
|---|---|---|
| Component or new page | `frontend-specialist` | **No — foreground (Write/Edit required)** |
| Accessibility test | `debugger` | Yes |
| Performance review | `performance-optimizer` | Yes |
| SEO meta | `performance-optimizer` | Yes |

For parallel execution of write-capable agents: multiple foreground `Agent()` calls in **one message**.

---

## 5. Execution patterns

### 5.1 L1-L2 (bug fix / tweak)

Fix directly. Skip Phase 0 + background agents.

### 5.2 L3 (component / known pattern)

1. Pre-flight: spawn `explorer` foreground with design spec prompt
2. Wait for spec
3. Spawn `frontend-specialist` foreground with spec

### 5.3 L4-L5 (multi-component / feature)

1. Pre-flight: spawn `explorer` foreground with design spec prompt
2. Wait for spec
3. Spawn multiple `frontend-specialist` agents foreground (one per component/section) in same message

### 5.4 L6+ (full page / complex UX)

1. Pre-flight: spawn `explorer` foreground with design spec prompt
2. Phase 1 prototype (if new page + tool available): use Stitch MCP with project's design-tokens skill (`gpus-theme`, `design-tokens`, etc.)
3. Spawn `frontend-specialist` agents per section as foreground parallel calls

---

## 6. Skills to load

```
Phase 0 (in explorer):           Skill("gpus-theme")
Phase 1 (if Stitch):              Skill("gpus-theme")           // provides Stitch asset IDs (SKILL.md § Stitch Design System IDs)
Phase 2 (in frontend-specialist): Skill("frontend-design:frontend-design") + Skill("gpus-theme")
```

`gpus-theme` is the canonical NeonDash design-tokens skill — it ships Stitch asset IDs, the GPUS brand anchors, contrast safety rules, motion canon, and progressive-disclosure references. Live token source is `apps/web/src/styles/global.css` `@theme` (canonical) — `assets/theme-tokens.css` is a portable snapshot.

---

## 7. 4-phase pipeline

### Phase 0 — Design research (`explorer` + `gpus-theme`)

Always for L3+. Generates structured design spec. Pass spec to frontend-specialist prompt.

### Phase 1 — Prototype (optional)

**When:** new pages or landing pages where the design system supports prototype generation. Skip for components and bug fixes.

If using Stitch MCP:
1. Invoke project design-tokens skill — loads design system asset IDs
2. `mcp__stitch__generate_screen_from_text` with design prompt
3. `mcp__stitch__apply_design_system` using project asset IDs
4. Iterate with `mcp__stitch__edit_screens` if needed
5. `mcp__stitch__get_screen` → download HTML reference

If skipping prototype: pass Phase 0 spec directly to Phase 2.

### Phase 2 — Convert to code

For L4+ designs (multi-component / full page), invoke `Skill("superpowers:writing-plans")` to convert the Phase 0 spec into an implementation plan at `docs/superpowers/plans/YYYY-MM-DD-<topic>-plan.md` before any code lands. The plan enumerates the per-component build order, prop contracts, and per-component verify steps. Skip for L3 single-component work.

**`frontend-specialist` MUST invoke BOTH `Skill("frontend-design:frontend-design")` and the project design-tokens skill BEFORE writing any code.**

#### Pre-code preparation: impeccable `craft` methodology (additive)

Before declaring DESIGN COMMITMENT, `frontend-specialist` MUST load impeccable's `craft` end-to-end methodology to inform the commitment:

```typescript
Skill("frontend-design:frontend-design"); // existing, required
Skill("gpus-theme");                       // existing, required
Skill("impeccable");                       // router (setup + register)
Read(".claude/skills/impeccable/reference/craft.md");
```

Apply craft's pre-code gate sequence (Steps 0–4: project foundation check · shape brief confirmed · direction questions · palette confirmed · mock direction approved-or-delegated). Each gate informs the DESIGN COMMITMENT below — it does not replace it.

**Critical:** `craft` layers on top of `frontend-design:frontend-design`. It does NOT replace the DESIGN COMMITMENT block below, the Maestro auditor gates in Phase 3, or any anti-cliché rule. Compressing gates 2–4 because the shape brief feels complete is the dominant failure mode of this flow — do not skip.

#### Declare DESIGN COMMITMENT (mandatory — before first line of code)

```
DESIGN COMMITMENT: [Style Name]
  Geometry:    [specific layout — not "clean grid"]
  Typography:  [font + scale decision]
  Palette:     [specific design tokens]
  Effects:     [specific animations / micro-interactions]
  Anti-cliché: NOT Bento / glass / mesh / safe 50-50 split
```

> If you can describe the layout as "clean and minimal" without specifics, you haven't committed — restart thinking.

#### Implement

1. Break into components (max ~150 lines each)
2. Use design system primitives (shadcn/ui or project equivalent)
3. All colors → semantic design tokens (never hardcode hex)
4. Add data queries (per project's data layer — tRPC / server actions / loaders / fetch)
5. TypeScript interfaces
6. Scroll-triggered entrance animations (staggered) — gated by `prefers-reduced-motion`
7. Micro-interactions (`scale` / `translate` / `opacity` only — never animate layout properties)
8. `prefers-reduced-motion` support mandatory

### Phase 3 — Validate

```typescript
Skill("superpowers:verification-before-completion"); // capture type-check + lint + visual gate evidence
```

Maestro auditor + UX/visual/code-quality checks below must all be backed by captured output (snapshot path, gate exit code, viewport check). No "looks fine" without evidence.

#### Maestro auditor (auto-rejection gates)

If ANY trigger is true → delete the implementation and restart:

| Trigger | Fail condition | Fix |
|---|---|---|
| Safe Split | `grid-cols-2`, 50/50, 60/40, 70/30 layouts | Switch to 90/10, 100% stacked, or overlapping |
| Glass Trap | `backdrop-blur` without solid borders | Remove blur → solid colors + raw 1-2px borders |
| Glow Trap | Soft gradients to "pop" elements | High-contrast solid colors or grain textures |
| Bento Trap | Safe rounded grid boxes | Fragment grid, break alignment intentionally |
| Blue Trap | Default blue/teal as primary | Use project tokens or distinctive accent |
| Line Trap | `1px solid` border dividers | Background shifts, thick padding, ghost borders |

**Template test:** "Could this be a Vercel/Stripe template?" → YES = FAIL.

#### UX quality

- [ ] Loading states (skeletons shaped like expected output — not spinners)
- [ ] Error states
- [ ] Empty states with user guidance
- [ ] Keyboard navigation + focus not obscured by sticky elements (WCAG 2.2 SC 2.4.11)
- [ ] Touch targets ≥ 44×44px; minimum 24×24px with spacing (WCAG 2.2 SC 2.5.8)
- [ ] Drag interactions have non-drag alternatives (WCAG 2.2 SC 2.5.7)
- [ ] Key content left-aligned (NN Group: 69% more attention on left half)
- [ ] Choices grouped if >7 options (Hick's Law)
- [ ] Hover/state animations via CSS transitions, not JS (protects INP < 200ms at p75)

#### Visual quality

- [ ] Semantic tokens only (no hardcoded hex)
- [ ] Dark mode tested (if dark mode is in scope)
- [ ] Responsive breakpoints verified

#### Code quality (per `_shared.md` § 1)

- [ ] Design system primitives used
- [ ] Type-check passes
- [ ] Lint passes

#### Tail — request a review

For L4+ design surfaces (new page, full page redesign), invoke `Skill("superpowers:requesting-code-review")` to capture BASE/HEAD SHAs + scope + reviewer focus (accessibility, design system fidelity, performance) before handing off to `/verify` Phase 5. Skip for L3 single-component edits — `/verify` will handle the review pass.

---

## Anti-patterns

| Don't | Do |
|---|---|
| Skip Phase 0 for L3+ | Always run explorer + gpus-theme first |
| Run frontend-specialist in background | Foreground only (background silently denies Write/Edit) |
| Skip Skill("frontend-design:frontend-design") | Invoke before any code in frontend-specialist |
| Write code before DESIGN COMMITMENT | Declare geometry/typography/palette/effects first |
| Use gpus-theme in frontend-specialist | Phase 0 (explorer) only |
| Hardcode colors | Semantic design tokens |
| Custom modal from scratch | Design system Dialog primitive |
| Nested ScrollArea | Single at layout level |
| Components in `ui/` | `components/[feature]/` |
