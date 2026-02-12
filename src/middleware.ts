import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    // 专门记录 Webhook 请求
    if (context.url.pathname.includes('/api/telegram/webhook')) {
        console.log(`--- [DEBUG MIDDLEWARE] Incoming Webhook ---`);
        console.log(`Method: ${context.request.method}`);
        console.log(`Origin Header: ${context.request.headers.get('origin')}`);
        console.log(`Host Header: ${context.request.headers.get('host')}`);
    }

    return next();
});
