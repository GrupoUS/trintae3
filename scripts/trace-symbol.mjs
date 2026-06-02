// One-off: vetoriza o símbolo "33" (alpha mask) → public/favicon.svg + imprime o path d.
// Marching-squares (midpoint) + chaining + Douglas-Peucker. Sem deps externas além de sharp.
// Execução: node scripts/trace-symbol.mjs
import fs from "node:fs";
import sharp from "sharp";

const SRC = "public/images/brand/symbol-gold.webp";
const GOLD = "#c2a36a"; // --color-gold-brand (asset standalone de marca)
const TH = 128; // limiar de alpha
const EPS = 1.1; // simplificação (em px do grid de trace)

const key = (p) => `${Math.round(p[0] * 2)}_${Math.round(p[1] * 2)}`;

// distância ponto→segmento (p/ Douglas-Peucker)
function perp(p, a, b) {
	const dx = b[0] - a[0],
		dy = b[1] - a[1];
	const L2 = dx * dx + dy * dy;
	if (L2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
	let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
	t = Math.max(0, Math.min(1, t));
	return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function dp(pts, eps) {
	if (pts.length < 3) return pts;
	let max = 0,
		idx = 0;
	for (let i = 1; i < pts.length - 1; i++) {
		const d = perp(pts[i], pts[0], pts[pts.length - 1]);
		if (d > max) {
			max = d;
			idx = i;
		}
	}
	if (max > eps) {
		const l = dp(pts.slice(0, idx + 1), eps);
		const r = dp(pts.slice(idx), eps);
		return l.slice(0, -1).concat(r);
	}
	return [pts[0], pts[pts.length - 1]];
}

const run = async () => {
	const H = 440;
	const meta = await sharp(SRC).metadata();
	const W = Math.round((meta.width / meta.height) * H);
	const { data, info } = await sharp(SRC)
		.resize(W, H, { fit: "fill" })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const ch = info.channels;
	const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : data[(y * W + x) * ch + 3] >= TH ? 1 : 0);

	// midpoints das arestas da célula (x,y)
	const T = (x, y) => [x + 0.5, y];
	const R = (x, y) => [x + 1, y + 0.5];
	const B = (x, y) => [x + 0.5, y + 1];
	const Lf = (x, y) => [x, y + 0.5];
	const segs = [];
	for (let y = -1; y < H; y++) {
		for (let x = -1; x < W; x++) {
			const tl = at(x, y),
				tr = at(x + 1, y),
				br = at(x + 1, y + 1),
				bl = at(x, y + 1);
			const c = tl * 1 + tr * 2 + br * 4 + bl * 8;
			const add = (a, b) => segs.push([a, b]);
			switch (c) {
				case 1: add(Lf(x, y), T(x, y)); break;
				case 2: add(T(x, y), R(x, y)); break;
				case 3: add(Lf(x, y), R(x, y)); break;
				case 4: add(R(x, y), B(x, y)); break;
				case 5: add(Lf(x, y), T(x, y)); add(R(x, y), B(x, y)); break;
				case 6: add(T(x, y), B(x, y)); break;
				case 7: add(Lf(x, y), B(x, y)); break;
				case 8: add(B(x, y), Lf(x, y)); break;
				case 9: add(T(x, y), B(x, y)); break;
				case 10: add(T(x, y), R(x, y)); add(B(x, y), Lf(x, y)); break;
				case 11: add(R(x, y), B(x, y)); break;
				case 12: add(R(x, y), Lf(x, y)); break;
				case 13: add(T(x, y), R(x, y)); break;
				case 14: add(Lf(x, y), T(x, y)); break;
			}
		}
	}

	// adjacência p/ encadear em loops
	const adj = new Map();
	const pt = new Map();
	for (const [a, b] of segs) {
		const ka = key(a),
			kb = key(b);
		pt.set(ka, a);
		pt.set(kb, b);
		if (!adj.has(ka)) adj.set(ka, []);
		if (!adj.has(kb)) adj.set(kb, []);
		adj.get(ka).push(kb);
		adj.get(kb).push(ka);
	}
	const loops = [];
	const used = new Set();
	for (const start of adj.keys()) {
		if ((adj.get(start) || []).every((n) => used.has(`${start}|${n}`))) continue;
		const loop = [];
		let cur = start,
			prev = null;
		while (cur) {
			loop.push(pt.get(cur));
			const nexts = adj.get(cur) || [];
			let nxt = null;
			for (const n of nexts) {
				if (used.has(`${cur}|${n}`)) continue;
				if (n === prev && nexts.length > 1) continue;
				nxt = n;
				break;
			}
			if (!nxt) break;
			used.add(`${cur}|${nxt}`);
			used.add(`${nxt}|${cur}`);
			prev = cur;
			cur = nxt;
			if (cur === start) break;
		}
		if (loop.length > 8) loops.push(loop);
	}

	// simplifica + monta path, escalando p/ viewBox 0 0 100 100
	const sx = 100 / W,
		sy = 100 / H;
	const fmt = (v) => Math.round(v * 100) / 100;
	const dParts = [];
	for (const loop of loops) {
		const s = dp(loop, EPS);
		if (s.length < 3) continue;
		let d = `M${fmt(s[0][0] * sx)} ${fmt(s[0][1] * sy)}`;
		for (let i = 1; i < s.length; i++) d += `L${fmt(s[i][0] * sx)} ${fmt(s[i][1] * sy)}`;
		dParts.push(d + "Z");
	}
	const pathD = dParts.join("");

	const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="TRINTAE3"><path fill="${GOLD}" fill-rule="evenodd" d="${pathD}"/></svg>\n`;
	fs.writeFileSync("public/favicon.svg", favicon);
	// módulo TS consumido por BrandSymbol.astro (fidelidade garantida, sem transcrição manual)
	const ts = `// GERADO por scripts/trace-symbol.mjs — não editar à mão.\n// Símbolo "33" da marca TRINTAE3, viewBox 0 0 100 100.\nexport const BRAND_SYMBOL_PATH =\n\t"${pathD}";\n`;
	fs.writeFileSync("src/components/shared/brandSymbolPath.ts", ts);
	console.log(`loops:${loops.length} pathChars:${pathD.length}`);
	console.log("escrito: public/favicon.svg + src/components/shared/brandSymbolPath.ts");
};

run().catch((e) => {
	console.error("falhou:", e.message);
	process.exit(1);
});
