import type { APIRoute } from 'astro';
import { getTodayCalendarEvents, getPendingTasks } from '../../../lib/google';
import { sendTelegramMessage, formatDailyBriefing } from '../../../lib/telegram';

export const prerender = false;

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({
        status: 'online',
        message: 'Genius OS Webhook is listening...',
        time: new Date().toISOString()
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        console.log('--- Telegram Webhook Raw Body ---');
        console.log(JSON.stringify(body, null, 2));

        if (!body.message || !body.message.text) {
            return new Response('OK', { status: 200 });
        }

        const chatId = body.message.chat.id.toString();
        const text = body.message.text.trim();
        const expectedId = import.meta.env.TELEGRAM_CHAT_ID?.toString();

        console.log(`[WEBHOOK DEBUG] ChatID: ${chatId}, Expected: ${expectedId}, Text: ${text}`);

        // 安全校验
        if (chatId !== expectedId) {
            console.warn(`Unauthorized ChatID! If this is you, update your .env with: TELEGRAM_CHAT_ID=${chatId}`);
            // 发送一条提示，告诉用户当前 ID 是多少，方便配置
            await sendTelegramMessage(`⚠️ 授权失败。您的 ChatID 是 \`${chatId}\`，请将其更新至 \`.env\` 文件中。`);
            return new Response('OK', { status: 200 });
        }

        if (text === '/start') {
            await sendTelegramMessage(`👋 您好！Genius OS 已识别您的身份。\n\n• /today - 今日简报\n• /tasks - 待办事项`);
        }
        else if (text === '/today') {
            const [events, tasks] = await Promise.all([
                getTodayCalendarEvents(),
                getPendingTasks()
            ]);
            await sendTelegramMessage(formatDailyBriefing(events, tasks));
        }
        else if (text === '/tasks') {
            const tasks = await getPendingTasks();
            let msg = `*✅ 待办事项*\n\n` + (tasks.length ? tasks.map((t: any, i: number) => `${i + 1}. ${t.title}`).join('\n') : '_暂无待办_');
            await sendTelegramMessage(msg);
        }
        else {
            await sendTelegramMessage(`💡 已记录想法：\n"${text}"`);
        }

        return new Response('OK', { status: 200 });
    } catch (err: any) {
        console.error('Webhook Runtime Error:', err);
        return new Response('Error', { status: 200 });
    }
};
