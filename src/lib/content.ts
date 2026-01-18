import { getCollection, type CollectionEntry } from 'astro:content';

export async function getBlogPosts() {
    const posts = await getCollection('blog');

    // Filter out drafts in production
    if (import.meta.env.PROD) {
        return posts.filter(post => !post.data.draft);
    }

    return posts;
}

export async function getSortedBlogPosts() {
    const posts = await getBlogPosts();
    return posts.sort((a, b) => {
        const dateDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
    });
}
