import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

dotenv.config();

const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
});

async function postNewArticle(slug) {
    try {
        const postPath = path.join(process.cwd(), 'src/content/blog', `${slug}.md`);
        if (!fs.existsSync(postPath)) {
            console.error(`Post not found: ${postPath}`);
            return;
        }

        const file = fs.readFileSync(postPath, 'utf-8');
        const { data } = matter(file);

        const tweetText = `New Post: ${data.title}\n\n${data.description}\n\nRead more: ${process.env.SITE_URL}/blog/${slug}/`;

        console.log('Posting to X...');
        const tweet = await client.v2.tweet(tweetText);
        console.log(`Successfully posted! Tweet ID: ${tweet.data.id}`);
    } catch (error) {
        console.error('Error posting to X:', error);
    }
}

const slugArg = process.argv[2];
if (slugArg) {
    postNewArticle(slugArg);
} else {
    console.log('Please provide a post slug. Example: node scripts/post-to-x.mjs my-post-slug');
}
