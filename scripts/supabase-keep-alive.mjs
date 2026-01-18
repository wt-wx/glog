import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
    console.log('Sending keep-alive pulse to Supabase at:', new Date().toISOString());

    try {
        // We perform a simple query to ensure the database stays active.
        // Even if the table doesn't exist, the attempt counts as activity.
        // Better: Query the auth health or a generic table.
        const { data, error } = await supabase
            .from('_keep_alive')
            .select('*')
            .limit(1);

        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
            // PGRST116 is "no rows", 42P01 is "table does not exist"
            // Both are fine as they mean the DB is alive and responding.
            console.error('Supabase responded with an unexpected error:', error.message);
        } else {
            console.log('Pulse successful: Supabase is awake.');
        }
    } catch (e) {
        console.error('Failed to connect to Supabase:', e.message);
    }
}

keepAlive();
