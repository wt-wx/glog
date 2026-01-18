import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

dotenv.config();

const client = new TwitterApi(process.env.X_BEARER_TOKEN);
const roClient = client.readOnly;

const SYNC_WINDOW_DAYS = 30; // Only sync posts from the last 30 days
const API_DELAY_MS = 2000;    // 2 second delay between requests

async function syncReplies() {
    try {
        const blogDir = path.join(process.cwd(), 'src/content/blog');
        const commentsDir = path.join(process.cwd(), 'src/data/comments');

        if (!fs.existsSync(commentsDir)) {
            fs.mkdirSync(commentsDir, { recursive: true });
        }

        const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
        const now = new Date();

        for (const file of files) {
            const filePath = path.join(blogDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(content);
            const slug = file.replace(/\.(md|mdx)$/, '');

            if (data.tweetId) {
                // Recency check: Skip very old posts to save API quota
                const pubDate = new Date(data.pubDate);
                const daysOld = (now - pubDate) / (1000 * 60 * 60 * 24);

                if (daysOld > SYNC_WINDOW_DAYS) {
                    // console.log(`Skipping old post: ${slug}`);
                    continue;
                }

                console.log(`Fetching replies for ${slug} (Tweet ID: ${data.tweetId})...`);

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));

                try {
                    const searchResult = await roClient.v2.search({
                        query: `conversation_id:${data.tweetId}`,
                        "tweet.fields": ['created_at', 'author_id', 'text', 'in_reply_to_user_id'],
                        expansions: ['author_id'],
                        "user.fields": ['username', 'name', 'profile_image_url']
                    });

                    if (searchResult.data.data) {
                        const users = searchResult.includes.users.reduce((acc, user) => {
                            acc[user.id] = user;
                            return acc;
                        }, {});

                        const replies = searchResult.data.data.map(tweet => ({
                            id: tweet.id,
                            text: tweet.text,
                            created_at: tweet.created_at,
                            author: users[tweet.author_id] || { name: 'Unknown', username: 'unknown' }
                        }));

                        const commentPath = path.join(commentsDir, `${slug}.json`);
                        fs.writeFileSync(commentPath, JSON.stringify(replies, null, 2));
                        console.log(`Synced ${replies.length} replies for ${slug}`);
                    }
                } catch (apiError) {
                    if (apiError.code === 429) {
                        console.error('Rate limit exceeded! Stopping sync.');
                        break;
                    }
                    console.error(`Error fetching replies for ${slug}:`, apiError.message);
                }
            }
        }

        console.log('Reply sync complete!');
    } catch (error) {
        console.error('Error syncing replies:', error);
    }
}

syncReplies();
