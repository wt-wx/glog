/**
 * Cloudflare Workers for geniux.net & glog.geniux.net
 * Includes: 
 * 1. Intro Page Proxy (geniux.net)
 * 2. Multi-platform Load Balancer with Geo-Routing & Cache (glog.geniux.net)
 */

// === 配置区 ===
const BACKENDS = [
    {
        name: "vercel",
        url: "https://glog.vercel.geniux.net",
        weight: 5,
        region: "CN"
    },
    {
        name: "netlify",
        url: "https://glog.netlify.geniux.net",
        weight: 2,
        region: "Global/Fallback"
    },
    {
        name: "qcloud",
        url: "https://glog.qcloud.geniux.net",
        weight: 3,
        region: "APAC"
    }
];

const TIMEOUT_MS = 3000;
const USE_GEO_ROUTING = true;
const CACHE_HTML = true;
const HTML_CACHE_TTL = 600;

// 地理位置路由映射
const GEO_ROUTING = {
    'CN': 'vercel',
    'JP': 'qcloud',
    'KR': 'qcloud',
    'SG': 'qcloud',
    'HK': 'qcloud',
    'TW': 'qcloud',
    'US': 'vercel',
    'CA': 'vercel',
    'GB': 'vercel',
    'default': 'vercel'
};

// === 工具函数 ===

function removeConditionalHeaders(headers) {
    const newHeaders = new Headers(headers);
    newHeaders.delete('if-modified-since');
    newHeaders.delete('if-none-match');
    newHeaders.delete('if-unmodified-since');
    newHeaders.delete('if-match');
    return newHeaders;
}

function cleanHeaders(headers) {
    const newHeaders = new Headers(headers);
    newHeaders.delete('content-encoding');
    newHeaders.delete('content-length');
    newHeaders.delete('transfer-encoding');
    newHeaders.delete('connection');
    newHeaders.delete('keep-alive');
    return newHeaders;
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startTime = Date.now();

    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        return { res, latency };
    } catch (e) {
        clearTimeout(timeout);
        return { res: null, latency: Date.now() - startTime, error: e.message };
    }
}

function getPreferredBackend(request) {
    if (!USE_GEO_ROUTING) return null;
    const country = request.cf?.country || 'default';
    const preferred = GEO_ROUTING[country] || GEO_ROUTING.default;
    return BACKENDS.find(b => b.name === preferred);
}

async function sequentialFallback(request, preferredBackend = null) {
    const orderedBackends = preferredBackend
        ? [preferredBackend, ...BACKENDS.filter(b => b !== preferredBackend).sort((a, b) => b.weight - a.weight)]
        : BACKENDS.sort((a, b) => b.weight - a.weight);

    const reqHeaders = removeConditionalHeaders(request.headers);

    for (const backend of orderedBackends) {
        const target = backend.url + new URL(request.url).pathname + new URL(request.url).search;

        const { res, latency } = await fetchWithTimeout(target, {
            method: request.method,
            headers: reqHeaders,
            body: request.method === "GET" ? undefined : request.body,
            redirect: "follow"
        });

        if (res && res.ok) {
            const headers = cleanHeaders(res.headers);
            headers.set('X-Backend-Used', backend.name);
            headers.set('X-Backend-Latency', latency + 'ms');
            return new Response(res.body, { status: res.status, statusText: res.statusText, headers: headers });
        }
    }
    return new Response("All backends failed", { status: 502 });
}

async function handleWithCache(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET') {
        return await sequentialFallback(request, getPreferredBackend(request));
    }

    const pathname = url.pathname;
    const isStatic = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$/.test(pathname);
    const isHTML = CACHE_HTML && (pathname === '/' || pathname.endsWith('.html') || !pathname.includes('.'));

    if (!isStatic && !isHTML) {
        return await sequentialFallback(request, getPreferredBackend(request));
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: 'GET' });

    let response = await cache.match(cacheKey);
    if (response) {
        const headers = cleanHeaders(response.headers);
        headers.set('X-Cache-Status', 'HIT');
        return new Response(response.body, { status: response.status, headers: headers });
    }

    response = await sequentialFallback(request, getPreferredBackend(request));
    if (response.ok) {
        const headers = new Headers(response.headers);
        if (isStatic) {
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (isHTML) {
            headers.set('Cache-Control', `public, max-age=${HTML_CACHE_TTL}`);
        }
        headers.set('X-Cache-Status', 'MISS');

        const clonedResponse = new Response(response.body, { status: response.status, headers: headers });
        await cache.put(cacheKey, clonedResponse.clone());
        return clonedResponse;
    }
    return response;
}

// --- Worker 1: geniux-intro (geniux.net/*) ---
export const introWorker = {
    async fetch(request) {
        const url = new URL(request.url);
        // 映射：根路径代理到 /intro/，其余保持不变（资源文件）
        const path = url.pathname === "/" ? "/intro" : url.pathname;
        const search = url.search;

        const backends = [
            "glog.vercel.geniux.net",
            "glog.netlify.geniux.net",
            "glog.qcloud.geniux.net"
        ];

        let lastError = "No backends configured";
        for (const domain of backends) {
            try {
                const targetUrl = `https://${domain}${path}${search}`;
                const reqHeaders = new Headers(request.headers);

                reqHeaders.set("Host", domain);
                reqHeaders.delete("Referer");

                const response = await fetch(targetUrl, {
                    method: request.method,
                    headers: reqHeaders,
                    redirect: "follow"
                });

                if (response.ok) {
                    const headers = cleanHeaders(response.headers);
                    headers.delete("Location");
                    headers.delete("Refresh");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers
                    });
                } else {
                    lastError = `Backend ${domain} returned ${response.status} ${response.statusText}`;
                }
            } catch (e) {
                lastError = `Fetch failed for ${domain}: ${e.message}`;
                console.error(`Intro Sync Failed for ${domain}: ${e.message}`);
                continue;
            }
        }

        return new Response(`Intro Page Proxy Error: ${lastError}`, {
            status: 502,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
    }
};

// --- Worker 2: glog-balancer (glog.geniux.net/*) ---
export const balancerWorker = {
    async fetch(request) {
        return await handleWithCache(request);
    }
};

// === 主入口 ===
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 健康检查
        if (url.pathname === '/_health') {
            return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (url.hostname === "geniux.net") {
            return introWorker.fetch(request);
        }
        if (url.hostname === "glog.geniux.net") {
            return balancerWorker.fetch(request);
        }

        return new Response("Not Found", { status: 404 });
    }
};
