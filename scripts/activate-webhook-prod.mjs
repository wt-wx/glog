import 'dotenv/config';

// 动态获取：在生产激活时，如果是本地运行脚本，它会读取本地 .env
// 但请确保您运行此脚本的环境中有正确的 TELEGRAM_BOT_TOKEN
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = 'https://geniux.net/api/telegram/webhook';

async function setProductionWebhook() {
    console.log(`--- [PRODUCTION] Setting Webhook to: ${WEBHOOK_URL} ---`);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.ok) {
            console.log('🚀 SUCCESS: Production Webhook is now active!');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error('❌ FAILED:', data.description);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

setProductionWebhook();
