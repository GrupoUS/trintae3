---
name: gpus-theme
description: Use when applying GPUS branding (Portal Grupo US) to other projects, setting up shadcn/ui with Navy/Gold palette, or copying the complete light/dark theme configuration. Includes CSS variables, Tailwind v4 theme, and shadcn configuration. Project canon resolves from references/values/<project>-canon.md.
---

# GPUS Theme

Portable design system from the Portal Grupo US project featuring a Navy/Gold color palette with complete light and dark theme support.

> **Identity:** Navy backgrounds + Gold accents. Professional, premium, educational.
> **Project canon:** `references/values/gpus-canon.md` (HSL palette, typography, custom utilities).
> **Schema for new projects:** `references/template.md` (theme canon section structure).

## Institutional site (`gpus-site`) vs portable theme

Portable assets in this skill support **light and dark** (see palette table in `references/values/gpus-canon.md`). The **Grupo US Astro institutional site** in this repository uses **dark navy / gold only** per root `AGENTS.md` — **no light/dark product toggle** unless product scope changes.

When editing **that** site:

- Use `<themeSsot>` `@theme` block + project tokens — path from `config.json::cardinals.themeSsot` (currently `src/styles/global.css`). Tokens: `navy`, `gold`, semantic `bg-background`, etc.
- Treat **Dark Mode Toggle** and **View Transition API** theme-toggle notes below as **for other consumers** of `theme-tokens.css`, not as defaults for the institutional build.

---

## Quick Start

### Option 1: Copy CSS Variables

Copy `assets/theme-tokens.css` to your project's main CSS file.

```css
@import "tailwindcss";
@import "./theme-tokens.css"; /* Copy from assets/ */
```

### Option 2: Use shadcn Configuration

Copy `assets/components.json` to your project root:

```bash
cp .claude/skills/gpus-theme/assets/components.json ./components.json
```

### Option 3: Tailwind v3 Config

Import theme tokens into `tailwind.config.ts`:

```typescript
import { gpusTheme } from "./.claude/skills/gpus-theme/assets/tailwind-theme";

export default {
  theme: {
    extend: {
      colors: gpusTheme.colors,
    },
  },
};
```

---

## Theme Overview (gpus-canon values)

### Color Palette

| Token           | Light Mode              | Dark Mode          | Purpose         |
| --------------- | ----------------------- | ------------------ | --------------- |
| **background**  | White `0 0% 100%`       | Navy `211 49% 10%` | Page background |
| **foreground**  | Dark blue `222 47% 11%` | Gold `39 44% 65%`  | Text color      |
| **primary**     | Gold `38 60% 45%`       | Gold `39 44% 65%`  | Main actions    |
| **accent**      | Light gold `38 60% 95%` | Muted `26 5% 27%`  | Highlights      |
| **destructive** | Red `0 84% 60%`         | Red `0 84% 60%`    | Errors          |

Full token table → `references/values/gpus-canon.md`.

### Border Radius

- Base: `0.625rem` (10px)
- Derived: `--radius-lg`, `--radius-md`, `--radius-sm`

### Custom Utilities

| Class             | Effect                          |
| ----------------- | ------------------------------- |
| `.bg-mesh`        | Radial gradient mesh background |
| `.glass-card`     | Glassmorphism with blur         |
| `.bg-noise`       | Subtle noise texture overlay    |
| `.animate-ripple` | Button ripple animation         |

---

## Component Configuration

### shadcn/ui Settings

- **Style:** `new-york`
- **Base color:** `zinc`
- **CSS Variables:** Enabled
- **Icon Library:** `config.json::cardinals.iconLibrary` (currently `lucide-react`)

### Extended Registries

| Registry         | URL                 | Components          |
| ---------------- | ------------------- | ------------------- |
| @kokonutui       | kokonutui.com       | Premium components  |
| @aceternity      | ui.aceternity.com   | Animated components |
| @magicui         | magicui.design      | Magic effects       |
| @tweakcn         | tweakcn.com         | Theme generator     |
| @shadcnui-blocks | shadcnui-blocks.com | Page blocks         |
| @cult-ui         | cult-ui.com         | Cult components     |
| @originui        | originui.com        | Origin components   |
| @tailark         | tailark.com         | Tailark components  |

---

## Files Reference

| File                                       | Purpose                              | Scope |
| ------------------------------------------ | ------------------------------------ | ----- |
| `references/template.md`                   | Section schema for any project canon | TEMPLATE — never edit per project |
| `references/values/gpus-canon.md`          | gpus-site HSL palette + utilities    | VALUES — gpus-site |
| `references/shadcn-config.md`              | shadcn/ui configuration details      | GENERIC mechanic |
| `assets/theme-tokens.css`                  | Portable CSS file (gpus-canon)       | VALUES — fork per project if palette differs |
| `assets/tailwind-theme.ts`                 | Tailwind v3 config export            | GENERIC mechanic |
| `assets/components.json`                   | shadcn configuration                 | GENERIC mechanic |

For a new Grupo US project with a different palette, fork `references/values/<new-project>-canon.md` from `template.md`.

---

## Usage Tips

### Dark Mode Toggle (portable / other projects)

The portable theme uses `.dark` class on `<html>` element:

```typescript
document.documentElement.classList.toggle("dark");
```

### Smooth Transitions

Theme includes CSS for smooth color transitions:

```css
body {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
```

### View Transition API (portable / other projects)

For animated theme toggle when using portable tokens, use the View Transition API selectors in `theme-tokens.css`. **Not applicable** to the institutional gpus-site while it remains single-theme per `AGENTS.md`.

---

## When to load more

- Schema for a new project's theme canon: `references/template.md`
- Concrete canon (gpus-site): `references/values/gpus-canon.md`
- shadcn methodology: `references/shadcn-config.md`
- Tailwind v4 syntax + `@theme`: `Skill('${skills.stack}')` → `references/styling-tailwind.md`
- Universal design rules: `.claude/rules/DESIGN.md`
- Bootstrap new project: `.claude/scaffolding/BOOTSTRAP.md`
