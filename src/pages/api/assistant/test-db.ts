import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async () => {
    try {
        const { error } = await supabaseAdmin
            .from('assistant_state')
            .upsert({
                id: 'google_auth',
                data: {
                    test: true,
                    updated_at: new Date().toISOString()
                }
            });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
};
