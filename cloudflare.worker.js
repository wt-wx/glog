/**
 * Cloudflare Workers for geniux.net & glog.geniux.net
 */

// --- Worker 1: geniux-intro (geniux.net/*) ---
// Proxies main domain traffic to the Intro Page
export const introWorker = {
    async fetch(request) {
        const url = new URL(request.url);
        // Proxy to your primary hosting provider where the /intro page exists
        const TARGET = "https://glog-geniux.vercel.app/intro";

        let response = await fetch(TARGET);
        return new Response(response.body, response);
    }
};

// --- Worker 2: glog-balancer (glog.geniux.net/*) ---
// Multi-platform Load Balancer for high availability
const SERVERS = [
    "glog-vercel.geniux.net",
    "glog-netlify.geniux.net",
    "glog-render.geniux.net"
];

export const balancerWorker = {
    async fetch(request) {
        const url = new URL(request.url);
        // Randomize selection
        const server = SERVERS[Math.floor(Math.random() * SERVERS.length)];
        url.hostname = server;

        const modifiedRequest = new Request(url, request);

        try {
            return await fetch(modifiedRequest);
        } catch (e) {
            // Failover: default to the first server
            url.hostname = SERVERS[0];
            return await fetch(new Request(url, request));
        }
    }
};

// Default export if using a single worker for multiple routes
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.hostname === "geniux.net") {
            return introWorker.fetch(request);
        }
        if (url.hostname === "glog.geniux.net") {
            return balancerWorker.fetch(request);
        }
        return new Response("Not Found", { status: 404 });
    }
};
