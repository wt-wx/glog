import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	const posts = await getCollection('blog');
	const items = await Promise.all(posts.map(async (post) => {
		const { Content } = await render(post);
		return {
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: `/blog/${post.id}/`,
			// This allows platforms like WordPress/Blogger to import the full text
			content: post.data.description
		};
	}));

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: items,
	});
}
