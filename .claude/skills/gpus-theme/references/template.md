# Theme canon — template

> Schema for any Grupo US project's design-system tokens canon. Fork into `references/values/<project>-canon.md` and fill HSL palette + typography + utilities.
> This file is **structure only**. Concrete tokens for the current project live in `references/values/<project>-canon.md`.
> Stack-specific syntax (Tailwind v4 `@theme`, shadcn config) is shared via `assets/` and sibling `shadcn-config.md`.

---

## When to use

- Onboarding a new Grupo US vertical / project's design system.
- Drafting a new project's theme canon file.
- Auditing an existing project's tokens for parity with the schema.

For the **gpus-site current canon** (Navy + Gold + Playfair + Inter), read `references/values/gpus-canon.md` directly.

---

## Required sections (in `values/<project>-canon.md`)

### Color palette — HSL table

| Token | Light mode (`H S L`) | Dark mode (`H S L`) | Purpose |
|---|---|---|---|
| `background` | … | … | Page background |
| `foreground` | … | … | Text color |
| `primary` | … | … | Main actions / CTAs |
| `primary-foreground` | … | … | Text on primary |
| `secondary` | … | … | Secondary surfaces |
| `accent` | … | … | Highlights / hovers |
| `muted` | … | … | Muted backgrounds |
| `border` | … | … | Borders |
| `ring` | … | … | Focus rings |
| `destructive` | … | … | Errors / warnings |

Plus brand-specific named utilities (e.g., `navy-*`, `gold-*` for Grupo US sites) — table with shade ramp.

### Typography

- **Heading family** — e.g., Playfair Display (`weight: 400 / 600 / 700`).
- **Body family** — e.g., Inter (`weight: 300 / 400 / 500 / 600 / 700`).
- Source: Google Fonts / self-hosted / variable font URL.
- Display strategy: `display=swap`.
- Heading-to-body size ratio at the largest viewport.

### Border radius scale

- Base: e.g., `0.625rem` (10px).
- Derived: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-full`.

### Custom utilities

Brand utility classes — pattern, syntax, intended surface:

| Class | Effect | Used on |
|---|---|---|
| `.bg-mesh` | Radial gradient mesh background | Hero / section backdrop |
| `.glass-card` | Glassmorphism with blur | Premium cards |
| … | … | … |

### Theme strategy

- **Single-theme** (e.g., dark navy only) — declare; no toggle UI.
- **Light + dark** — class strategy (`.dark` on `<html>`), toggle component, transition behavior.

### Icon library

`config.json::cardinals.iconLibrary` (e.g., `lucide-react`). Declare the library + naming convention + tree-shaking pattern (named imports only).

### shadcn/ui config (when used)

- Base color (e.g., `zinc`).
- Style preset (e.g., `new-york`).
- CSS variables enabled (`true`).
- Icon library (must match the project icon library).
- Extended registries used (e.g., `@kokonutui`, `@aceternity`).

Full shadcn config template → sibling `shadcn-config.md` + `assets/components.json`.

---

## Optional sections

- **Mesh / texture overlays** — gradient stops, mix-blend-mode.
- **Motion tokens** — default durations / easings beyond DESIGN.md universals.
- **Brand glow / halo** — primary CTA halo color + spread.

---

## File layout (new project)

```
.claude/skills/${skills.theme}/
├── SKILL.md
├── assets/
│   ├── components.json           # shadcn config (generic — value file points back here)
│   ├── tailwind-theme.ts         # Tailwind config export (Tailwind v3 fallback)
│   └── theme-tokens.css          # gpus-canon CSS file (current default — fork per project if needed)
└── references/
    ├── template.md               # this file — never edit per project
    ├── shadcn-config.md          # shadcn methodology (generic)
    └── values/
        ├── gpus-canon.md         # gpus-site canon — Navy/Gold/Playfair/Inter
        └── <new-project>-canon.md  # fork per project if palette differs
```

`SKILL.md` description points to `references/values/<project>-canon.md` as the canonical entry point per project.

---

## When to load more

- Concrete theme canon (gpus-site): `references/values/gpus-canon.md`
- shadcn methodology: sibling `shadcn-config.md`
- Tailwind v4 syntax + `@theme` block: `Skill('${skills.stack}')` → `references/styling-tailwind.md`
- Universal design rules: `.claude/rules/DESIGN.md`
