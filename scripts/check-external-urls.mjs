#!/usr/bin/env node
/**
 * Verifica que destinos externos do CTA do TRINTAE3 (WhatsApp Laura + Typebot)
 * são URLs bem-formadas e que o produto canonical tem cta.url alinhado ao
 * whatsappMessage encodado.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function normalizeUrl(u) {
	if (!u || typeof u !== "string") return null;
	return u.replace(/\/$/, "") || u;
}

const productPath = join(root, "src/content/products/trintae3.json");
const data = JSON.parse(readFileSync(productPath, "utf8"));

let failed = false;

const ctaUrl = normalizeUrl(data.cta?.url);
const ctaMsg = data.cta?.whatsappMessage;
if (!ctaUrl) {
	console.error("[check-external-urls] trintae3: missing cta.url");
	failed = true;
} else if (!ctaUrl.includes("wa.me/")) {
	console.error(
		`[check-external-urls] trintae3: cta.url "${ctaUrl}" must be a wa.me/... link`,
	);
	failed = true;
} else if (ctaMsg) {
	const encoded = encodeURIComponent(ctaMsg);
	if (!ctaUrl.includes(encoded)) {
		console.error(
			"[check-external-urls] trintae3: cta.url query text does not match encodeURIComponent(cta.whatsappMessage)",
		);
		failed = true;
	}
}

const secUrl = data.secondaryCTA?.url;
if (secUrl) {
	try {
		new URL(secUrl);
	} catch {
		console.error(
			`[check-external-urls] trintae3: secondaryCTA.url "${secUrl}" is not a valid URL`,
		);
		failed = true;
	}
}

if (!failed) {
	console.log("[check-external-urls] OK: TRINTAE3 CTA URLs aligned");
}

process.exit(failed ? 1 : 0);
