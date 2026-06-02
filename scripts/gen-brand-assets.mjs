// @ts-nocheck
/**
 * gen-brand-assets.mjs — gera assets de marca TRINTAE3 a partir dos originais em docs/logos.
 *
 * Saídas:
 *  - public/images/brand/trintae3-wordmark.{webp,png}  (logo horizontal)
 *  - public/favicon-32.png, public/favicon-96.png, public/favicon.svg (símbolo)
 *  - public/apple-touch-icon.png (180, fundo navy), public/icon-512.png
 *  - public/og/trintae3.png + public/og-image.png (1200x630)
 *  - src/assets/photos/*.webp (4 fotos de estúdio, ~1600px)
 *
 * Uso: bun run gen:assets  (ou: node scripts/gen-brand-assets.mjs)
 */
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const p = (...s) => resolve(root, ...s);

const NAVY = "#1a1a2e";
const NAVY_950 = "#10101f";
const GOLD = "#d4af37";
const GOLD_BRAND = "#c2a36a";

const SRC = {
	wordmark: p("docs/identidade-visual/marca-horizontal_Marca-horizontal_Color-05.png"),
	symbol: p("docs/identidade-visual/marca-simbolo_Color-05.png"),
	photoHero: p("docs/identidade-visual/fotos/IMG_5243-Editarcopiar.jpg"),
	photoStory: p("docs/identidade-visual/fotos/IMG_5875-Editarcopiar.jpg"),
	photoBio: p("docs/identidade-visual/fotos/IMG_6380-Editarcopiar2.jpg"),
	photoCta: p("docs/identidade-visual/fotos/IMG_5492-Editarcopiar.jpg"),
	patternNavy: p("docs/identidade-visual/fundos/padronagem_Color-04.png"),
};

async function ensureDir(file) {
	await mkdir(dirname(file), { recursive: true });
}

async function out(file, buf) {
	await ensureDir(file);
	await writeFile(file, buf);
	console.log("  ✓", file.replace(root, "").replace(/\\/g, "/"));
}

async function wordmark() {
	console.log("Wordmark…");
	const base = sharp(SRC.wordmark).trim();
	const webp = await base.clone().resize({ width: 720 }).webp({ quality: 92 }).toBuffer();
	await out(p("public/images/brand/trintae3-wordmark.webp"), webp);
	const png = await sharp(SRC.wordmark).trim().resize({ width: 720 }).png().toBuffer();
	await out(p("public/images/brand/trintae3-wordmark.png"), png);
	// also keep a navy-bg version for light backgrounds? wordmark gold works on navy. skip.
}

async function favicons() {
	console.log("Favicons (símbolo)…");
	const sym = () => sharp(SRC.symbol).trim();

	const png32 = await sym().resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
	await out(p("public/favicon-32.png"), png32);

	const png96 = await sym().resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
	await out(p("public/favicon-96.png"), png96);

	const icon512 = await sym().resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
	await out(p("public/icon-512.png"), icon512);

	// Apple touch icon: needs opaque bg + padding (símbolo gold sobre navy)
	const symPadded = await sym()
		.resize(132, 132, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.toBuffer();
	const apple = await sharp({
		create: { width: 180, height: 180, channels: 4, background: NAVY },
	})
		.composite([{ input: symPadded, gravity: "center" }])
		.png()
		.toBuffer();
	await out(p("public/apple-touch-icon.png"), apple);

	// favicon.svg: SVG wrapper embedding the 96px PNG (crisp o suficiente p/ favicon, escalável no slot svg)
	const b64 = png96.toString("base64");
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><image width="96" height="96" href="data:image/png;base64,${b64}"/></svg>`;
	await out(p("public/favicon.svg"), Buffer.from(svg, "utf8"));
}

async function ogImage() {
	console.log("OG image…");
	const W = 1200;
	const H = 630;

	// Foto da Dra. Sacha cobrindo a direita (~46%)
	const photoW = 560;
	const photo = await sharp(SRC.photoHero)
		.resize(photoW, H, { fit: "cover", position: "top" })
		.toBuffer();

	// Fade navy sobre a borda esquerda da foto + vinheta
	const fade = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${photoW}" height="${H}">
			<defs>
				<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stop-color="${NAVY_950}" stop-opacity="1"/>
					<stop offset="0.42" stop-color="${NAVY_950}" stop-opacity="0"/>
				</linearGradient>
			</defs>
			<rect width="${photoW}" height="${H}" fill="url(#g)"/>
		</svg>`,
		"utf8",
	);
	const photoFaded = await sharp(photo)
		.composite([{ input: fade, blend: "over" }])
		.toBuffer();

	// Fundo navy + glow gold radial + texto
	const bg = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
			<defs>
				<radialGradient id="glow" cx="28%" cy="38%" r="60%">
					<stop offset="0" stop-color="${GOLD}" stop-opacity="0.18"/>
					<stop offset="0.55" stop-color="${GOLD}" stop-opacity="0"/>
				</radialGradient>
			</defs>
			<rect width="${W}" height="${H}" fill="${NAVY_950}"/>
			<rect width="${W}" height="${H}" fill="url(#glow)"/>
			<text x="80" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700" fill="#fafaf9">A pós que forma</text>
			<text x="80" y="372" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700" fill="${GOLD_BRAND}">autoridades em</text>
			<text x="80" y="444" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700" fill="${GOLD_BRAND}">Saúde Estética</text>
			<text x="80" y="516" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="#b8c0d0">Pós-Graduação MEC + Mentoria · 634h</text>
		</svg>`,
		"utf8",
	);

	// Wordmark no topo esquerdo
	const wm = await sharp(SRC.wordmark).trim().resize({ width: 360 }).toBuffer();

	const og = await sharp(bg)
		.composite([
			{ input: wm, top: 70, left: 80 },
			{ input: photoFaded, top: 0, left: W - photoW },
		])
		.png()
		.toBuffer();

	await out(p("public/og/trintae3.png"), og);
	await out(p("public/og-image.png"), og);
}

async function photos() {
	console.log("Fotos de seção (public/images/photos)…");
	const jobs = [
		["IMG_5243.webp", SRC.photoHero, 900],
		["IMG_5875.webp", SRC.photoStory, 1000],
		["IMG_6380.webp", SRC.photoBio, 1400],
		["IMG_5492.webp", SRC.photoCta, 900],
	];
	for (const [name, src, width] of jobs) {
		const meta = await sharp(src).resize({ width }).webp({ quality: 82 }).toBuffer();
		await out(p("public/images/photos", name), meta);
		const m = await sharp(meta).metadata();
		console.log(`     (${name} = ${m.width}x${m.height})`);
	}
}

async function patterns() {
	console.log("Padrões de fundo…");
	const buf = await sharp(SRC.patternNavy)
		.resize({ width: 1920 })
		.webp({ quality: 80 })
		.toBuffer();
	await out(p("public/images/brand/pattern-navy.webp"), buf);
}

async function main() {
	await wordmark();
	await favicons();
	await ogImage();
	await photos();
	await patterns();
	console.log("\nDone.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
