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
        // First sort by sticky status
        const stickyA = a.data.sticky ? 1 : 0;
        const stickyB = b.data.sticky ? 1 : 0;
        if (stickyB !== stickyA) return stickyB - stickyA;

        // Then sort by date
        const dateDiff = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id);
    });
}
