// One-off: otimiza assets de marca do kit (docs/identidade-visual) para WebP em public/images/brand.
// Fontes têm diacrítico combinante no nome → localizamos por readdir + predicado.
// Execução: node scripts/prepare-brand-assets.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const KIT = path.join(ROOT, "docs/identidade-visual");
const OUT = path.join(ROOT, "public/images/brand");

fs.mkdirSync(OUT, { recursive: true });

/** acha 1 arquivo em `dir` que satisfaz `pred` (tolera nomes com acento combinante) */
function findFile(dir, pred) {
	const abs = path.join(KIT, dir);
	const f = fs.readdirSync(abs).find(pred);
	if (!f) throw new Error(`não achei arquivo em ${dir}`);
	return path.join(abs, f);
}

const JOBS = [
	{
		src: findFile("marcas/Símbolo", (f) => f.includes("Color-05")),
		out: "symbol-gold.webp",
		width: 512,
		trim: true,
		quality: 92,
	},
	{
		src: findFile("marcas/Selo 1", (f) => f.includes("Color-05")),
		out: "selo-saude-estetica.webp",
		width: 512,
		trim: true,
		quality: 92,
	},
	{
		src: findFile("marcas/Selo 2", (f) => f.includes("Color-05")),
		out: "selo-hof.webp",
		width: 512,
		trim: true,
		quality: 92,
	},
	{
		src: findFile("fundos", (f) => f === "padronagem_Color-05.png"),
		out: "pattern-gold.webp",
		width: 1280,
		trim: false,
		quality: 68,
	},
	{
		src: findFile("marcas/Marca vertical", (f) => f.includes("duas-cores")),
		out: "wordmark-vertical.webp",
		width: 640,
		trim: true,
		quality: 92,
	},
	{
		src: findFile("marcas/Marca sem tagline", (f) => f.includes("duas-cores")),
		out: "wordmark-compact.webp",
		width: 640,
		trim: true,
		quality: 92,
	},
];

const run = async () => {
	for (const job of JOBS) {
		let img = sharp(job.src);
		if (job.trim) img = img.trim({ threshold: 10 }); // remove borda transparente
		img = img.resize({ width: job.width, withoutEnlargement: true });
		const buf = await img.webp({ quality: job.quality, alphaQuality: 100 }).toBuffer();
		const meta = await sharp(buf).metadata();
		fs.writeFileSync(path.join(OUT, job.out), buf);
		console.log(
			`✓ ${job.out.padEnd(26)} ${meta.width}x${meta.height} alpha:${meta.hasAlpha} ${(buf.length / 1024) | 0}KB`,
		);
	}
};

run().catch((e) => {
	console.error("falhou:", e.message);
	process.exit(1);
});
