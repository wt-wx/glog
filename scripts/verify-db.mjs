// 这是一个独立的测试脚本，用于验证 Supabase 连接和数据
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    console.log('Checking Supabase Table: assistant_state...');
    const { data, error } = await supabase
        .from('assistant_state')
        .select('*')
        .eq('id', 'google_auth');

    if (error) {
        console.error('❌ Database Error:', error.message);
    } else if (data.length === 0) {
        console.log('⚠️ Record NOT found. The OAuth callback might have failed to save.');
    } else {
        console.log('✅ Record FOUND! Data:', JSON.stringify(data, null, 2));
    }
}

verify();
