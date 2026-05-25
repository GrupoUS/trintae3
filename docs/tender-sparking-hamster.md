# Design Enhancement Plan — gpus-site

> Scope: A (audit) + B (foundation tokens) + D (visual uplift global)
> Date: 2026-05-25 · Branch target: `dev-test`
> Stack: Astro 6 static-only · Tailwind v4 `@theme` · React islands minimal · Navy/Gold dark-only

---

## Context

Site already mature: 9 routes, 13 landing components, 99% static, motion craft via `motion/react` + CSS keyframes, solid a11y baseline (skip link, `<main>` landmark, `prefers-reduced-motion`, focus rings, `<noscript>` reveal fallback). Recent work (2026-06-01) cleaned width-animation anti-patterns and removed dead deps.

Real gaps surfaced by audit:
- **A11y P0:** All button sizes (`sm/md/lg`) fall under 44×44px mobile minimum. `Button.astro:24-26` uses `px-4 py-2 / px-6 py-3 / px-8 py-4`.
- **Token foundation:** No depth scale, no motion duration/easing tokens, no button state utility presets, no ARIA live region helpers, no formal heading scale tokens.
- **Off-grid spacing:** `py-1.5` (6px) on `LandingHero.astro:41` badge; mixed 2/3/4/6/8 units breaking 8px grid in spots.
- **Focus rings:** `Button.astro` ships no `:focus-visible` block — relies on global gold ring (works, but per-component intent not declared).
- **Status semantics:** Color-only hover (no icon/text reinforcement) on CTAs — DESIGN.md §1 cardinal.

Outcome: lift WCAG AA compliance to clean baseline, formalize design language (8 cardinal token roles), polish every surface without touching content or component contracts.

---

## Phase A — Audit (deliverable: this section)

Findings sorted by priority. **No code changes in Phase A** — this is the report.

### P0 (a11y / cardinal violations)
| ID | File:line | Finding | Fix in |
|---|---|---|---|
| A0-1 | `src/components/shared/Button.astro:24-26` | Touch targets < 44×44px on all variants (mobile WCAG 2.2 SC 2.5.8 risk) | Phase D-1 |
| A0-2 | `src/components/shared/Button.astro` | No explicit `:focus-visible` — depends on global; intent should be local for premium CTAs | Phase B-3 + D-1 |
| A0-3 | `src/components/landing/LandingHero.astro:41` | Badge `py-1.5` (6px) off 8px/4px grid | Phase D-3 |

### P1 (token foundation gaps)
| ID | Gap | Resolved by |
|---|---|---|
| A1-1 | No depth scale — every shadow is bespoke per utility (`gold-glow`, `card-glow-hover`, `glass-card`) | Phase B-1 |
| A1-2 | No motion duration / easing tokens — values inlined per `@utility` (0.2s / 0.3s / 0.4s / 0.6s ad-hoc) | Phase B-2 |
| A1-3 | No button state utility — `Button.astro` uses raw Tailwind variant classes per CTA color | Phase B-3 |
| A1-4 | No ARIA live region helper (`.sr-only`, `aria-live` regions for async surfaces) | Phase B-4 |
| A1-5 | No formal heading scale tokens — sizes inlined per page (`text-4xl md:text-5xl lg:text-6xl`) | Phase B-5 |

### P2 (uplift opportunities, no violation)
| ID | Surface | Opportunity |
|---|---|---|
| A2-1 | `src/pages/index.astro` section transitions | Add tonal-step backgrounds between adjacent sections (DESIGN.md §9 level 1) |
| A2-2 | `StatsSection.astro`, `AnimatedStats.tsx` | Apply `tabular-nums` on counters (currently default proportional) |
| A2-3 | `FAQ.astro` | Confirm uses native `<details>` OR CSS grid `0fr↔1fr` (verify; if height tween, restore cardinal #8 compliance) |
| A2-4 | `Card.astro`, all landing cards | Standardize all hover lifts on `card-hover-lift` utility instead of per-component scale variants |
| A2-5 | All sections | Generous vertical spacing audit — desktop ≥ 96px, mobile ≥ 64px (DESIGN.md §4) |
| A2-6 | `LandingHero.astro` Framer Motion island | Already `client:visible` ✓ — consider `client:idle` for hero on initial product landing where motion is above-fold (per CLAUDE.md routing row "Hero island animation"). Verify trade-off via Lighthouse before flip. |

---

## Phase B — Foundation token additions

Single file modified: `src/styles/global.css` (cardinal #7 themeSsot). All tokens scoped inside the existing `@theme` block + new `@utility` blocks. Zero new dependencies.

### B-1. Depth scale (DESIGN.md §9)
Add semantic shadow tokens to `@theme`, then expose `@utility depth-{0..6}` classes:

```css
@theme {
  --shadow-depth-1: 0 1px 2px color-mix(in srgb, var(--color-navy) 30%, transparent);
  --shadow-depth-2: 0 4px 12px color-mix(in srgb, var(--color-navy) 35%, transparent);
  --shadow-depth-3: 0 12px 24px color-mix(in srgb, var(--color-navy) 40%, transparent);
  --shadow-depth-4: 0 18px 48px color-mix(in srgb, var(--color-navy) 45%, transparent);
  --shadow-depth-5: 0 0 30px color-mix(in srgb, var(--color-gold) 18%, transparent),
                    0 24px 60px color-mix(in srgb, var(--color-navy) 50%, transparent);
  --shadow-depth-6: 0 32px 80px color-mix(in srgb, var(--color-navy) 55%, transparent),
                    0 0 0 1px color-mix(in srgb, var(--color-gold) 12%, transparent);
}
```

Existing `glass-card`, `glass-card-bright`, `gold-glow`, `card-glow-hover` stay (named brand utilities per DESIGN.md §11). New depth tokens **complement**, not replace.

### B-2. Motion tokens
Add to `@theme`:

```css
--duration-hover: 150ms;
--duration-reveal: 300ms;
--duration-page: 200ms;
--duration-accordion: 250ms;
--ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

Refactor existing keyframe consumers to reference tokens (`reveal-up`, `reveal-left`, `reveal-right`, `reveal-scale`, `card-hover-lift`, `card-glow-hover`). One-line swap per `@utility`. No behavioral change — values match current inlined defaults.

### B-3. Button state utility presets
Add `@utility btn-base` carrying:
- `min-height: 44px` (mobile-first) → `lg:min-height: 36px` for desktop refinement (DESIGN.md §3)
- `:focus-visible` ring (already global, but local declaration for intent + override safety)
- `active:scale-[0.98]` (transform-only, cardinal #8)
- `disabled` opacity + `cursor-not-allowed`
- `transition` using `--duration-hover` + `--ease-out-soft`

Then `@utility btn-primary | btn-secondary | btn-ghost | btn-whatsapp` extend `btn-base` with color tokens. `Button.astro` refactor in Phase D-1 consumes these.

### B-4. ARIA helpers
Add to `global.css`:
- `.sr-only` (visually-hidden, screen-reader accessible — standard Tailwind/shadcn pattern)
- `[role="status"][aria-live="polite"]` default styling hook (no visual change, marks intent)

Used by future async surfaces (form submit feedback, dynamic state). Drop-in ready; no current consumer broken.

### B-5. Heading scale tokens
Add `@theme` size tokens aligned to existing usage:

```css
--text-display: clamp(2.5rem, 5vw + 1rem, 4.5rem);  /* h1 hero — current text-4xl→6xl */
--text-h1: clamp(2rem, 3vw + 1rem, 3rem);            /* page title — current text-3xl→5xl */
--text-h2: clamp(1.5rem, 2vw + 0.5rem, 2.25rem);
--text-h3: 1.5rem;
--text-h4: 1.25rem;
```

Refactor uplift in Phase D applies these via `font-size: var(--text-display)` etc. — never inline `text-Nxl` chains.

---

## Phase D — Visual uplift global

Per-pattern pass. Every change uses tokens from Phase B. No content edits (cardinal #5 — copy stays in `src/content/`). No new components — refactor existing.

### D-1. `src/components/shared/Button.astro` — refactor
- Swap variant class chains → `btn-base btn-{variant}` utilities (B-3).
- Min-height 44px mobile / 36px desktop.
- Explicit `:focus-visible` block.
- Active scale via `--duration-hover`.
- Touch target ≥ 44×44px confirmed across `sm/md/lg`.

### D-2. `src/components/shared/Card.astro` — depth + hover unification
- Apply `depth-2` baseline shadow.
- Hover state → `depth-4` + `card-hover-lift` (already exists).
- Border-radius confirmed `rounded-xl` (DESIGN.md §5).
- All landing children (Benefits, Pillars, Deliverables, Differentials, PainPoints) inherit.

### D-3. `src/components/landing/LandingHero.astro` — spacing + targets
- Badge `py-1.5` → `py-1` (4px) or `py-2` (8px) — pick `py-2` for breathing room.
- Vertical section padding audit: confirm `pt-32 pb-20` → desktop ≥ 96px ✓, mobile compress to `pt-20 pb-14` ✓.
- Hydration directive unchanged (`client:visible` already optimal — flag A2-6 ratified to KEEP).

### D-4. `src/pages/index.astro` + section components — tonal steps
- Even-indexed sections get `bg-navy-light/40` (depth-1 tonal step).
- Vertical rhythm: every section `py-24 lg:py-32` (192px / 256px desktop) — confirm match across `Hero, ProductsGrid, JourneyTimeline, TestimonialCarousel, StatsSection, AboutPreview, CTASection`.
- Asymmetric splits: where `grid-cols-2` 50/50 found in existing layout, evaluate 7/5 swap. Single representative sweep — no exhaustive enumeration.

### D-5. `src/components/StatsSection.astro` + `AnimatedStats.tsx` — `tabular-nums`
- Add `tabular-nums` Tailwind class on counter spans (single attribute).

### D-6. `src/components/landing/FAQ.astro` — verify cardinal #8 compliance
- Read file → confirm uses native `<details>` OR CSS grid `0fr↔1fr`. If height tween found, swap to grid pattern.
- Add `--duration-accordion` consumer if currently inlined.

### D-7. Focus ring audit pass
- Spot-check every interactive (`<button>`, `<a>`, `<details>`, mobile menu toggle, form inputs if any) — ensure global `:focus-visible` 2px gold + 2px offset visible on dark surfaces. Pass on each `.astro` / `.tsx` under `src/components/`.

---

## Critical files

Modifications:
- `src/styles/global.css` — **all** Phase B token additions + utility presets (single-file foundation change)
- `src/components/shared/Button.astro` — Phase D-1 refactor
- `src/components/shared/Card.astro` — Phase D-2 depth/hover
- `src/components/landing/LandingHero.astro` — Phase D-3 spacing
- `src/pages/index.astro` — Phase D-4 tonal step props on section wrappers
- `src/components/StatsSection.astro` + `src/components/AnimatedStats.tsx` — Phase D-5 numerics
- `src/components/landing/FAQ.astro` — Phase D-6 verify/repair
- Spot-edits across `src/components/landing/*.astro` for focus ring D-7

No edits to: `src/content/`, `src/content.config.ts`, `src/lib/whatsapp.ts`, `astro.config.mjs`, `src/layouts/Layout.astro` (no token rename — additive only).

Reuse:
- `card-hover-lift` (`global.css:259`) — keep, all hover lifts consume this
- `glass-card` / `glass-card-bright` (`global.css:49, 344`) — keep as premium named utilities
- `gold-glow` / `gold-pulse-glow` (`global.css:45, 267`) — keep for CTA halo
- `text-shimmer` / `text-gradient-gold` (`global.css:451, 467`) — keep for hero accents
- Existing IntersectionObserver `data-reveal` machinery — keep, only swap duration values to tokens

---

## Verification

Run **in order** after each phase. Block on first failure.

### After Phase B (token additions, no behavior change expected)
```bash
bun run lint                      # 0 errors
bunx astro check                  # 0 type errors
bun run build                     # success
grep -rnE '#[0-9a-fA-F]{3,8}' src/components src/pages src/layouts  # 0 hits (cardinal #7)
bun run check:external-urls       # cardinal #1
```

### After Phase D (visual uplift)
```bash
bun run lint && bunx astro check && bun run build
bun run lighthouse:audit          # confirm gates per .claude/config.json::gates
bun run smoke-test
```

### Manual a11y smoke (browser)
- Tab from page top → skip link is first focusable, Enter jumps to `<main>`.
- Every button focus ring visible (gold 2px + 2px offset).
- Mobile viewport: every button ≥ 44×44px touch target.
- Disable JS in DevTools → all `[data-reveal]` content visible.
- DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` → all keyframes / shimmer / pulse / mesh-drift cease.
- FAQ expands on Enter/Space → no layout jank (cardinal #8).

### Manual visual smoke
- All 9 routes (`/`, `/sobre`, `/contato`, `/curso-auriculo`, `/mentoria-black-neon`, `/otb`, `/politica-de-privacidade`, `/termos`, `/404`) render with no console errors.
- Hero LCP < 2.5s on `/` (Lighthouse mobile).
- CLS = 0 across all routes.
- Initial JS < 50KB on prerendered pages (cardinal — frontend.md performance).

### Stopping conditions
- 3 fix attempts on same lighthouse regression → escalate to `evaluator` Mode 3.
- Bundle size regresses > 10% post-Phase D → roll back D-4 tonal steps, investigate.
- Any cardinal violation surfaces in grep → fix root cause, never `--no-verify`.

---

## Execution sequencing

1. **Phase B first** (additive — zero breakage risk). Land in one commit: `feat(theme): add depth + motion + button + a11y token foundation`.
2. **Phase D-1 to D-3** next (highest-priority a11y fixes — touch targets, badge spacing). One commit per file: `fix(a11y): bump Button touch targets ≥ 44px`, `refactor(landing): align LandingHero spacing to 8px grid`.
3. **Phase D-4 to D-7** as polish — separate commits per surface, each gated by verification.
4. **No PR until** all verification gates green + manual a11y smoke passes.

Estimated touchpoints: ~9 files, ~250 lines net diff (mostly `global.css` additions + Button refactor).

