/**
 * Cloudflare Workers for geniux.net & glog.geniux.net
 * Optimized for Stability, Geo-Routing, and Fallback.
 */

// === 配置区 ===
const BACKENDS = [
    {
        name: "vercel",
        url: "https://glog.vercel.geniux.net",
        hostname: "glog.vercel.geniux.net",
        weight: 10, // 增加 Vercel 权重
        region: "Global"
    },
    {
        name: "netlify",
        url: "https://glog.netlify.geniux.net",
        hostname: "glog.netlify.geniux.net",
        weight: 3,
        region: "Europe & Africa & Oceania & Latin America"
    },
    {
        name: "qcloud",
        url: "https://glog.qcloud.geniux.net",
        hostname: "glog.qcloud.geniux.net",
        weight: 5,
        region: "APAC"
    }
];

const TIMEOUT_MS_PRIMARY = 4000; // 首选后端超时稍长
const TIMEOUT_MS_BACKUP = 2000;  // 备份后端快速切换
const CACHE_HTML = true;
const HTML_CACHE_TTL = 300; // 5分钟 HTML 缓存，平衡实时性与稳定性

// 地理位置路由映射
const GEO_ROUTING = {
    'CN': 'vercel',
    'JP': 'qcloud',
    'SG': 'qcloud',
    'HK': 'qcloud',
    // 亚洲 (其他) - Netlify
    'IN': 'netlify',     // 印度
    'ID': 'netlify',     // 印尼
    'PH': 'netlify',     // 菲律宾
    'TH': 'netlify',     // 泰国
    'VN': 'netlify',     // 越南
    'MY': 'netlify',     // 马来西亚
    'TW': 'netlify',
    'KR': 'netlify',
    // 非洲 - Netlify
    'ZA': 'netlify',     // 南非
    'EG': 'netlify',     // 埃及
    'NG': 'netlify',     // 尼日利亚
    // 拉丁美洲 - Netlify
    'BR': 'netlify',     // 巴西
    'MX': 'netlify',     // 墨西哥
    'AR': 'netlify',     // 阿根廷
    'CL': 'netlify',     // 智利
    'CO': 'netlify',     // 哥伦比亚
    'PE': 'netlify',     // 秘鲁
    'default': 'vercel'
};

// === 工具函数 ===

function cleanHeaders(headers) {
    const newHeaders = new Headers(headers);
    const removeHeaders = [
        'content-encoding', 'content-length', 'transfer-encoding',
        'connection', 'keep-alive', 'x-powered-by', 'server'
    ];
    removeHeaders.forEach(h => newHeaders.delete(h));
    return newHeaders;
}

/**
 * 带有超时的请求包装
 */
async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return response;
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

/**
 * 统一代理入口
 * @param {Request} request 原始请求
 * @param {string} overrideHost 可选的 Host 覆盖（用于 geniux.net 代理到 glog）
 * @param {boolean} useFallbacks 是否启用多后端重试
 */
async function unifiedProxy(request, overrideHost = null, useFallbacks = true) {
    const url = new URL(request.url);
    const country = request.cf?.country || 'default';
    const preferredName = GEO_ROUTING[country] || GEO_ROUTING.default;

    // 根据权重和地理位置排序后端
    const sortedBackends = [...BACKENDS].sort((a, b) => {
        if (a.name === preferredName) return -1;
        if (b.name === preferredName) return 1;
        return b.weight - a.weight;
    });

    const path = url.pathname + url.search;
    const reqHeaders = new Headers(request.headers);
    reqHeaders.delete('if-modified-since');
    reqHeaders.delete('if-none-match');

    let lastError = "";

    for (const [index, backend] of sortedBackends.entries()) {
        try {
            const targetUrl = backend.url + path;
            const currentHeaders = new Headers(reqHeaders);

            // 关键：设置正确的 Host 响应后端校验
            currentHeaders.set("Host", backend.hostname);

            const timeout = (index === 0) ? TIMEOUT_MS_PRIMARY : TIMEOUT_MS_BACKUP;

            const response = await fetchWithTimeout(targetUrl, {
                method: request.method,
                headers: currentHeaders,
                body: (request.method !== "GET" && request.method !== "HEAD") ? request.body : undefined,
                redirect: "follow"
            }, timeout);

            // 如果后端返回 5xx 或 408，或者连接失败，则尝试下一个
            if (!response.ok && (response.status >= 500 || response.status === 408)) {
                lastError = `Backend ${backend.name} status ${response.status}`;
                continue;
            }

            // 如果是 404，在多后端镜像架构中，可能是同步延迟
            // 如果还有其他后端，可以尝试一下，但 404 通常由首选后端给出即可信任
            if (response.status === 404 && index < sortedBackends.length - 1) {
                lastError = `Backend ${backend.name} returned 404`;
                // 继续寻找可能已经同步的后端
                continue;
            }

            // 返回成功或正常的业务错误（如用户真的访问了不存在的页面）
            const headers = cleanHeaders(response.headers);
            headers.set('X-Backend-Used', backend.name);
            headers.set('X-Proxy-Status', 'Managed');

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });

        } catch (e) {
            lastError = `Backend ${backend.name} failed: ${e.message}`;
            if (!useFallbacks) break;
            continue;
        }
    }

    // 最终失败
    return new Response(`Global Load Balancer Error: ${lastError || "All units exhausted"}`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
}

// === Worker 逻辑实现 ===

async function handleRequest(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 健康检查
    if (url.pathname === '/_health') {
        return new Response("OK", { status: 200 });
    }

    // 缓存策略
    const isStatic = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$/.test(url.pathname);
    const canCache = request.method === 'GET' && (isStatic || CACHE_HTML);

    if (canCache) {
        const cache = caches.default;
        let response = await cache.match(request);
        if (response) {
            const newHeaders = new Headers(response.headers);
            newHeaders.set('X-Cache-Status', 'HIT');
            return new Response(response.body, { status: response.status, headers: newHeaders });
        }
    }

    // 执行代理
    let response = await unifiedProxy(request);

    // 写入缓存
    if (canCache && response.ok) {
        const clonedResponse = response.clone();
        const headers = new Headers(clonedResponse.headers);
        if (isStatic) {
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
            headers.set('Cache-Control', `public, max-age=${HTML_CACHE_TTL}`);
        }

        ctx.waitUntil(caches.default.put(request, new Response(clonedResponse.body, {
            status: clonedResponse.status,
            headers
        })));
    }

    return response;
}

// === 主出口 (ES Module) ===
export default {
    async fetch(request, env, ctx) {
        // 全局上下文变量注入（用于 waitUntil）
        globalThis.ctx = ctx;

        const url = new URL(request.url);

        // 分流逻辑
        // geniux.net 代理到博客首页 (Intro)
        // glog.geniux.net 正常的博客访问
        if (url.hostname === "geniux.net" || url.hostname === "glog.geniux.net") {
            try {
                return await handleRequest(request);
            } catch (e) {
                return new Response(`Critical Proxy Failure: ${e.message}`, { status: 500 });
            }
        }

        return new Response("Unauthorized Hostname", { status: 403 });
    }
};
