import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: 'src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			series: z.string().optional(),
			tags: z.array(z.string()).default([]),
			author: z.string().optional(),
			password: z.string().optional(),
			draft: z.boolean().optional(),
		}),
});

const xlog = defineCollection({
	loader: glob({ base: 'src/content/xlog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		pubDate: z.coerce.date(),
		id: z.string().optional(), // Twitter Tweet ID
		link: z.string().optional(), // Original Tweet Link
	}),
});

export const collections = { blog, xlog };
