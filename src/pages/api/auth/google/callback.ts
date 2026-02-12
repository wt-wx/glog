import type { APIRoute } from 'astro';
import { exchangeCodeForTokens, saveGoogleTokens } from '../../../../lib/google';

export const GET: APIRoute = async ({ request, redirect }) => {
    console.log('--- Google OAuth Callback Hit ---');
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        console.error('Google Auth Error from URL:', error);
        return new Response(`Google OAuth Error: ${error}`, { status: 400 });
    }

    if (!code) {
        console.warn('No code in redirect URL');
        return new Response('No code provided', { status: 400 });
    }

    try {
        console.log('Exchanging code for tokens...');
        const tokens = await exchangeCodeForTokens(code);
        console.log('Tokens received from Google.');
        await saveGoogleTokens(tokens);

        console.log('Auth successful, redirecting to dashboard...');
        return redirect('/admin/dashboard?auth=success');
    } catch (err: any) {
        console.error('OAuth Process Error:', err);
        return new Response(`Authentication failed: ${err.message}`, { status: 500 });
    }
};
