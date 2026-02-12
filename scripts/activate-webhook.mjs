import 'dotenv/config';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = 'https://rhea-undeferred-esperanza.ngrok-free.dev/api/telegram/webhook';

async function setWebhook() {
    console.log(`--- Setting Webhook to: ${WEBHOOK_URL} ---`);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.ok) {
            console.log('✅ Webhook set successfully!');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error('❌ Failed to set webhook:', data.description);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

setWebhook();
