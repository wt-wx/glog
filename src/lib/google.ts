import { supabaseAdmin } from './supabase';

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URL = import.meta.env.GOOGLE_REDIRECT_URL;

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/gmail.modify'
];

export async function getGoogleAuthUrl() {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPES.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    return url.toString();
}

export async function exchangeCodeForTokens(code: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URL,
            grant_type: 'authorization_code',
        }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(`Google Token Exchange failed: ${JSON.stringify(error)}`);
    }

    return await res.json();
}

export async function refreshGoogleTokens(refreshToken: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!res.ok) {
        throw new Error('Failed to refresh Google token');
    }

    return await res.json();
}

// 获取授权后的 AccessToken (自动处理刷新逻辑)
export async function getAccessToken() {
    const { data: authState, error } = await supabaseAdmin
        .from('assistant_state')
        .select('*')
        .eq('id', 'google_auth')
        .maybeSingle();

    if (error || !authState) throw new Error('Google account not connected');

    const tokens = authState.data;
    const now = new Date().getTime();

    // 如果 token 将在 5 分钟内过期，则刷新
    const expiryTime = tokens.expiry_date || (new Date(authState.updated_at).getTime() + tokens.expires_in * 1000);

    if (now > (expiryTime - 5 * 60 * 1000)) {
        console.log('--- Refreshing Google Access Token ---');
        const newTokens = await refreshGoogleTokens(tokens.refresh_token);
        const updatedTokens = {
            ...tokens,
            ...newTokens,
            updated_at: new Date().toISOString()
        };
        await saveGoogleTokens(updatedTokens);
        return newTokens.access_token;
    }

    return tokens.access_token;
}

// 基础获取函数：Calendar
export async function getTodayCalendarEvents() {
    const token = await getAccessToken();
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        console.error('Calendar API Error:', errorBody);
        throw new Error(`Failed to fetch calendar: ${errorBody.error?.message || res.statusText}`);
    }
    const data = await res.json();
    return data.items || [];
}

// 基础获取函数：Tasks
export async function getPendingTasks() {
    const token = await getAccessToken();
    const url = `https://www.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        console.error('Tasks API Error:', errorBody);
        throw new Error(`Failed to fetch tasks: ${errorBody.error?.message || res.statusText}`);
    }
    const data = await res.json();
    return data.items || [];
}

export async function saveGoogleTokens(tokens: any) {
    const { error } = await supabaseAdmin
        .from('assistant_state')
        .upsert({
            id: 'google_auth',
            data: {
                ...tokens,
                updated_at: new Date().toISOString()
            }
        });

    if (error) throw error;
}
