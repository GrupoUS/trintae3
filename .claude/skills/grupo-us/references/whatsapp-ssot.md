# WhatsApp SDR — Single Source of Truth (mechanic)

> Mechanic for the SDR (Sales Development Representative) WhatsApp channel: URL building, helper signatures, anti-patterns, smoke commands.
> Concrete values (E.164, SDR name, message prefix, helper file path) resolve from `.claude/config.json::whatsapp`.
> **Skip this file entirely when `config.json::whatsapp.enabled = false`** — cardinal #6 dormant for that project.
> Cardinal #6 in `.claude/CLAUDE.md`: **NEVER inline `wa.me/...` URLs** — always go through `config.json::whatsapp.ssotFile`.

---

## Identity (values from `config.json::whatsapp`)

| Field | Source | gpus-site current |
|---|---|---|
| SDR name | `config.json::whatsapp.sdrName` | `Laura` |
| E.164 (with `+`) | `config.json::whatsapp.sdrE164` | `+556294705081` |
| Without `+` (used by `wa.me/<E164>`) | strip leading `+` | `556294705081` |
| Message prefix | `config.json::whatsapp.messagePrefix` | `Olá, Laura!` |
| Helper file | `config.json::whatsapp.ssotFile` | `src/lib/whatsapp.ts` |

---

## SSOT module — `${whatsapp.ssotFile}`

Every project with `whatsapp.enabled = true` exports the same shape from the helper file:

| Export | Type / Value | Purpose |
|---|---|---|
| `WHATSAPP_SDR_E164` | `string` (no `+`) | Brazilian E.164 used by `wa.me/<E164>` |
| `WHATSAPP_DEFAULT_SITE_MESSAGE` | `string` | Institutional default for floating button + generic CTAs (starts with `messagePrefix`) |
| `whatsappUrlWithText(message)` | `(message: string) => string` | Builds `https://wa.me/<E164>?text=<encoded>` |
| `isWhatsAppDestination(url)` | `(url: string) => boolean` | Returns `true` for `wa.me/`, `api.whatsapp.com`, `wa.link/` — used to dedup CTAs |

---

## Conventions

### Every product CTA message starts with `${whatsapp.messagePrefix}`

In `<contentSsot>/products/<slug>.json` (path from `config.json::cardinals.contentSsot`):

```json
{
  "cta": {
    "url": "https://wa.me/<E164>?text=<encoded>",
    "whatsappMessage": "<prefix> Gostaria de saber mais sobre <produto>..."
  }
}
```

The `whatsappMessage` field is the source. URL building goes through `whatsappUrlWithText(message)` at render time.

### Generic CTAs use `WHATSAPP_DEFAULT_SITE_MESSAGE`

Footer, contact page generic, header CTA — all use the default constant rather than hand-rolled copy.

### CTA dedup — `isWhatsAppDestination`

When `cta.url` is already a WhatsApp URL, landing components auto-suppress the secondary green WhatsApp button (would be redundant). **Don't bypass this dedup** by adding a manual second button.

### `aria-label` always names the SDR

Every WhatsApp button explicitly includes `${whatsapp.sdrName}` in its `aria-label`:

```astro
<a href={url} aria-label="Falar com Laura no WhatsApp">Conversar com a Laura</a>
```

Screen-reader users hear the SDR's name + channel — clearer than "Open WhatsApp".

### Floating button — only `client:load` island

Per project's hydration allowlist (see `astro/references/values/<project>-overlay.md`). For gpus-site: `src/components/WhatsAppFloatingButton.tsx` is the only `client:load` use. Persistent across-route floating UI requires immediate hydration. Any other `client:load` use needs written justification.

---

## Anti-patterns

### Forbidden

```astro
<!-- Inline URL — bypasses SSOT, drift risk -->
<a href="https://wa.me/5511920474028">Falar conosco</a>

<!-- Wrong number (not config.json::whatsapp.sdrE164) -->
<a href="https://wa.me/5511920474028?text=...">CTA</a>

<!-- wa.link short URL — not the canonical pattern -->
<a href="https://wa.link/abc123">Falar com Laura</a>

<!-- Generic aria-label -->
<a href={url} aria-label="Open WhatsApp">CTA</a>

<!-- Manual second button when cta.url is already WhatsApp (bypasses dedup) -->
<a href={ctaUrl}>Inscrever</a>
<a href="https://wa.me/...">Falar com Laura</a>
```

### Required

```astro
<!-- SSOT import + helper -->
---
import { whatsappUrlWithText, WHATSAPP_DEFAULT_SITE_MESSAGE } from '@/lib/whatsapp';
const url = whatsappUrlWithText(WHATSAPP_DEFAULT_SITE_MESSAGE);
---
<a href={url} aria-label="Falar com Laura no WhatsApp">Conversar com a Laura</a>

<!-- Product-specific message via JSON field -->
---
import { whatsappUrlWithText } from '@/lib/whatsapp';
import { getEntry } from 'astro:content';
const product = await getEntry('products', 'mentoria-black-neon');
const url = whatsappUrlWithText(product.data.cta.whatsappMessage);
---
<a href={url} aria-label="Falar com Laura no WhatsApp sobre Mentoria Black NEON">CTA</a>
```

---

## Smoke commands

Substitute `<E164>` for `config.json::whatsapp.sdrE164` (without `+`), `<prefix>` for `config.json::whatsapp.messagePrefix`, `<ssot>` for `config.json::whatsapp.ssotFile`.

### No inline `wa.me/` URLs in components

```bash
grep -rn "wa\.me/\|api\.whatsapp\.com" src/components src/pages \
  --include="*.astro" --include="*.tsx" \
  --exclude="<ssot>"
# expect: empty (every WhatsApp URL goes through the SSOT helper)
```

### Every product `whatsappMessage` starts with `<prefix>`

```bash
# gpus-site concrete:
grep -L "\"whatsappMessage\":\s*\"Olá, Laura" src/content/products/*.json
# expect: empty (every product file matches; exclude external-only products if no whatsappMessage field)
```

### `WHATSAPP_SDR_E164` is the only number

```bash
# gpus-site concrete (E.164 prefix 55…):
grep -rnE "55[0-9]{10,11}" src/ | grep -v "WHATSAPP_SDR_E164\|src/lib/whatsapp.ts"
# expect: empty (no other Brazilian numbers hardcoded)
```

---

## Debug triage — WhatsApp URL drift

**Symptom:** Landing CTA opens WhatsApp with wrong number / wrong message.

**Root cause:**
- Inline `wa.me/<oldnumber>` bypassed the SSOT helper
- `cta.whatsappMessage` doesn't start with `config.json::whatsapp.messagePrefix`
- Manual second WhatsApp button bypassing `isWhatsAppDestination()` dedup

**Fix:**
1. Run grep above — must be empty.
2. All WhatsApp URL building goes through `whatsappUrlWithText(message)`.
3. Every product `cta.whatsappMessage` starts with `config.json::whatsapp.messagePrefix`.
4. Re-test failing CTA — clicked URL is `https://wa.me/<config.json::whatsapp.sdrE164>?text=...`.

---

## When to load more

- Brand voice + product canon (gpus-site): `references/values/gpus-site/manual-resumo.md`, `references/values/gpus-site/produtos-e-rotas.md`
- Astro hydration / island patterns (e.g., why `WhatsAppFloatingButton` uses `client:load`): `Skill('astro')` + `references/values/gpus-site-overlay.md § Hydration allowlist`
- Cardinal #6: `.claude/CLAUDE.md`
- WhatsApp toggle per project: `.claude/config.json::whatsapp`
