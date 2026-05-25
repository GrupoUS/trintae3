import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const products = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "src/content/products" }),
	schema: z.object({
		name: z.string(),
		slug: z.string(),
		tagline: z.string(),
		description: z.string(),
		type: z.string(),
		audience: z.string(),
		icon: z.string(),
		image: z.string().optional(),
		/** When set, home grid and header/footer product links go here; /slug still 301-redirects via astro.config. */
		externalSiteUrl: z.string().url().optional(),
		order: z.number(),
		hero: z.object({
			headline: z.string(),
			subheadline: z.string(),
		}),
		painPoints: z
			.array(
				z.object({
					icon: z.string(),
					title: z.string(),
					description: z.string(),
				}),
			)
			.min(3),
		pillars: z
			.array(
				z.object({
					icon: z.string(),
					title: z.string(),
					description: z.string(),
				}),
			)
			.length(3),
		/** Optional secondary pillars set (use when product needs 4+ "why different" items separate from the core 3 pillars). */
		differentialPillars: z
			.array(
				z.object({
					number: z.string().optional(),
					title: z.string(),
					description: z.string(),
				}),
			)
			.min(1)
			.max(6)
			.optional(),
		benefits: z.array(z.string()).min(4),
		deliverables: z
			.array(
				z.object({
					title: z.string(),
					description: z.string(),
				}),
			)
			.optional(),
		bonus: z
			.array(
				z.object({
					title: z.string(),
					description: z.string(),
				}),
			)
			.optional(),
		story: z
			.object({
				headline: z.string(),
				paragraphs: z.array(z.string()),
				highlight: z.string(),
			})
			.optional(),
		bio: z
			.object({
				name: z.string(),
				title: z.string(),
				photo: z.string(),
				paragraphs: z.array(z.string()),
			})
			.optional(),
		differentials: z
			.array(
				z.object({
					title: z.string(),
					description: z.string(),
				}),
			)
			.min(2),
		/** Optional: 3-5 in-person practice phases (location + duration + description). */
		practicePhases: z
			.array(
				z.object({
					title: z.string(),
					location: z.string(),
					days: z.string().optional(),
					description: z.string(),
					image: z.string().optional(),
				}),
			)
			.min(1)
			.max(5)
			.optional(),
		/** Optional: curriculum module list with optional hours per module. */
		curriculumModules: z
			.array(
				z.object({
					number: z.string(),
					title: z.string(),
					description: z.string(),
					hours: z.string().optional(),
				}),
			)
			.min(5)
			.max(15)
			.optional(),
		/** Optional: money-back / risk-reversal guarantee block. */
		guarantee: z
			.object({
				title: z.string(),
				body: z.string(),
				daysCount: z.number().int().positive(),
			})
			.optional(),
		/** Optional: extended faculty list (instructors/mentors). */
		faculty: z
			.array(
				z.object({
					name: z.string(),
					role: z.string(),
					photo: z.string().optional(),
					bio: z.string().optional(),
				}),
			)
			.min(1)
			.max(12)
			.optional(),
		/** Optional: target audience list (professions/profiles) with optional highlight flag. */
		audienceList: z
			.array(
				z.object({
					label: z.string(),
					highlight: z.boolean().optional(),
					note: z.string().optional(),
				}),
			)
			.min(1)
			.optional(),
		/** Optional: secondary CTA (e.g. external form / Typebot) shown alongside primary WhatsApp CTA. */
		secondaryCTA: z
			.object({
				label: z.string(),
				url: z.string().url(),
				helperText: z.string().optional(),
			})
			.optional(),
		/** Optional: hero badges (certification, format, duration, etc.). */
		badges: z
			.array(
				z.object({
					label: z.string(),
					icon: z.string().optional(),
				}),
			)
			.min(1)
			.max(5)
			.optional(),
		faqs: z
			.array(
				z.object({
					question: z.string(),
					answer: z.string(),
				}),
			)
			.min(3),
		cta: z.object({
			label: z.string(),
			url: z.string().url(),
			whatsappMessage: z.string(),
			helperText: z.string().optional(),
			type: z.literal("primary"),
		}),
		testimonials: z
			.array(
				z.object({
					name: z.string(),
					role: z.string(),
					quote: z.string(),
				}),
			)
			.min(2),
		event: z
			.object({
				startDate: z.string(),
				endDate: z.string(),
				location: z.object({
					name: z.string(),
					address: z.string(),
					city: z.string().optional(),
					country: z.string().optional(),
				}),
				attendanceMode: z.enum(["offline", "online", "mixed"]).optional(),
				organizer: z.string().optional(),
			})
			.optional(),
	}),
});

export const collections = { products };
