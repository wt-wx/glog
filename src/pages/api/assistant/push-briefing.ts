import type { APIRoute } from 'astro';
import { getTodayCalendarEvents, getPendingTasks } from '../../../lib/google';
import { sendTelegramMessage, formatDailyBriefing } from '../../../lib/telegram';

export const POST: APIRoute = async () => {
    try {
        const [events, tasks] = await Promise.all([
            getTodayCalendarEvents(),
            getPendingTasks()
        ]);

        const briefing = formatDailyBriefing(events, tasks);
        await sendTelegramMessage(briefing);

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) {
        console.error('Push Error:', err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
};
