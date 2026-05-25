// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://trintae3.gpus.com.br",
	fonts: [
		{
			name: "Playfair Display",
			cssVariable: "--font-playfair",
			provider: fontProviders.google(),
			weights: [400, 600, 700],
			styles: ["normal"],
		},
		{
			name: "Inter",
			cssVariable: "--font-inter",
			provider: fontProviders.google(),
			weights: [300, 400, 500, 600, 700],
			styles: ["normal"],
		},
	],
	integrations: [
		react(),
		sitemap({
			serialize(item) {
				const pathname = new URL(item.url).pathname.replace(/\/$/, "") || "/";

				/** @type {Record<string, { priority: number; changefreq: string }>} */
				const config = {
					"/": { priority: 1.0, changefreq: "weekly" },
					"/termos": { priority: 0.3, changefreq: "yearly" },
					"/politica-de-privacidade": { priority: 0.3, changefreq: "yearly" },
				};

				const entry = config[pathname];
				if (entry) {
					item.priority = entry.priority;
					item.changefreq = /** @type {any} */ (entry.changefreq);
				}

				return item;
			},
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
