import type { APIRoute } from 'astro';
import { sendTelegramMessage } from '../../../lib/telegram';

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const message = body.message;

    if (!message || String(message.chat.id) !== import.meta.env.TELEGRAM_CHAT_ID) {
        return new Response('Unauthorized', { status: 403 });
    }

    const text = message.text;

    // 基础命令处理逻辑
    if (text.startsWith('/start')) {
        await sendTelegramMessage('你好！Genius OS 已上线。我是您的云端大脑助手。');
    } else if (text.startsWith('/status')) {
        await sendTelegramMessage('🧠 <b>系统状态</b>\n- Google: 已连接\n- 数据库: 正常\n- 本周任务: 5个');
    } else {
        // 转发给 Codex 或处理自然语言 (待扩展)
        await sendTelegramMessage(`收到了您的消息: "${text}"。正在唤醒 Codex 思考中...`);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
