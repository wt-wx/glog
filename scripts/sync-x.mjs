import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const client = new TwitterApi(process.env.X_BEARER_TOKEN);
const roClient = client.readOnly;

async function syncTweets() {
    try {
        const user = await roClient.v2.userByUsername(process.env.X_USERNAME);
        const userId = user.data.id;

        console.log(`Fetching tweets for user ${process.env.X_USERNAME} (ID: ${userId})...`);

        const tweets = await roClient.v2.userTimeline(userId, {
            exclude: ['replies', 'retweets'],
            "tweet.fields": ['created_at', 'text', 'id'],
            max_results: 10
        });

        const xlogDir = path.join(process.cwd(), 'src/content/xlog');
        if (!fs.existsSync(xlogDir)) {
            fs.mkdirSync(xlogDir, { recursive: true });
        }

        for (const tweet of tweets.data.data) {
            const fileName = `tweet-${tweet.id}.md`;
            const filePath = path.join(xlogDir, fileName);

            if (fs.existsSync(filePath)) continue; // Skip existing

            const content = `---
pubDate: ${tweet.created_at}
id: "${tweet.id}"
link: "https://x.com/${process.env.X_USERNAME}/status/${tweet.id}"
---
${tweet.text}
`;

            fs.writeFileSync(filePath, content);
            console.log(`Synced tweet ${tweet.id}`);
        }

        console.log('Sync complete!');
    } catch (error) {
        console.error('Error syncing tweets:', error);
    }
}

syncTweets();
