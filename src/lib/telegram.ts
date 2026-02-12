const TELEGRAM_BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('Telegram credentials not found');
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text,
                parse_mode: parseMode,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(`Telegram Error: ${JSON.stringify(error)}`);
        }

        return await res.json();
    } catch (err) {
        console.error('Failed to send Telegram message:', err);
    }
}

// 格式化今日简报
export function formatDailyBriefing(events: any[], tasks: any[]) {
    let message = `*🌟 Genius OS 今日大脑简报*\n\n`;

    message += `*📅 日程安排 (${events.length})*\n`;
    if (events.length === 0) {
        message += `_今日暂无预定日程_\n`;
    } else {
        events.forEach(e => {
            const time = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '全天';
            message += `• [${time}] ${e.summary}\n`;
        });
    }

    message += `\n*✅ 待办事项 (${tasks.length})*\n`;
    if (tasks.length === 0) {
        message += `_所有任务已消灭！_\n`;
    } else {
        tasks.slice(0, 5).forEach(t => {
            message += `• ${t.title}\n`;
        });
        if (tasks.length > 5) message += `_...等共 ${tasks.length} 项_\n`;
    }

    message += `\n---\n_如果您需要更多细节，请直接询问。_`;
    return message;
}
