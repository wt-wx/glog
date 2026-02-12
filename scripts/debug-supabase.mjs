import { supabaseAdmin } from './src/lib/supabase';

async function checkStatus() {
    const { data, error } = await supabaseAdmin
        .from('assistant_state')
        .select('*')
        .eq('id', 'google_auth')
        .single();

    if (error) {
        console.log('Error or No record found:', error.message);
    } else {
        console.log('Record found:', JSON.stringify(data, null, 2));
    }
}

checkStatus();
