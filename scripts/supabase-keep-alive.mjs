import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env for local development
dotenv.config();

/**
 * CONFIGURATION:
 * To manage multiple projects, you can:
 * 1. Set individual keys: SUPABASE_URL_1, SUPABASE_ANON_KEY_1, etc.
 * 2. Or pass a JSON string in SUPABASE_PROJECTS_JSON:
 *    '[{"url": "...", "key": "..."}, {"url": "...", "key": "..."}]'
 */

async function keepAlive(url, key, projectName = 'Unknown') {
    const trimmedUrl = url?.trim();
    const trimmedKey = key?.trim();

    if (!trimmedUrl || !trimmedKey) {
        console.error(`❌ [${projectName}] Error: Missing Supabase configuration.`);
        return false;
    }

    console.log(`\n--- Pulse: ${projectName} ---`);
    console.log(`Target: ${trimmedUrl}`);

    try {
        const supabase = createClient(trimmedUrl, trimmedKey);
        const { error } = await supabase
            .from('_keep_alive')
            .select('*')
            .limit(1);

        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
            console.error(`❌ [${projectName}] Unexpected error:`, error.message);
            return false;
        } else {
            console.log(`✅ [${projectName}] Pulse successful: Supabase is awake.`);
            return true;
        }
    } catch (e) {
        console.error(`❌ [${projectName}] Connection failed:`, e.message);
        return false;
    }
}

async function runAll() {
    const projects = [];

    // 1. Try to load from JSON environment variable (Most scalable for many projects)
    const rawJson = process.env.SUPABASE_PROJECTS_JSON?.trim();
    if (rawJson && rawJson !== '' && rawJson !== 'undefined' && rawJson !== 'null') {
        try {
            let jsonProjects = JSON.parse(rawJson);
            // Allow both single object and array
            if (!Array.isArray(jsonProjects)) {
                jsonProjects = [jsonProjects];
            }

            projects.push(...jsonProjects.map((p, i) => ({
                url: p.url,
                key: p.key,
                name: p.name || `Project (JSON #${i + 1})`
            })));
        } catch (e) {
            console.error(`❌ Failed to parse SUPABASE_PROJECTS_JSON: ${e.message}`);
            console.error(`   Value starts with: ${rawJson.substring(0, 10)}... (Length: ${rawJson.length})`);
            console.error('   Hint: Ensure the JSON is a valid array like [{"url": "...", "key": "..."}]');
        }
    }

    // 2. Load from individual environment variables (Traditional way)
    // Project 1 (Glog)
    if (process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) {
        projects.push({
            url: process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
            key: process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
            name: 'Glog / Official'
        });
    }

    // Project 2 (Wuxian/Other)
    if (process.env.OTHER_SUPABASE_URL) {
        projects.push({
            url: process.env.OTHER_SUPABASE_URL,
            key: process.env.OTHER_SUPABASE_ANON_KEY,
            name: 'Secondary Project'
        });
    }

    // Deduplicate and filter empty
    const uniqueProjects = projects.filter((p, index, self) =>
        p.url && p.key && index === self.findIndex((t) => t.url === p.url)
    );

    if (uniqueProjects.length === 0) {
        console.error('❌ No projects found to keep alive.');
        console.log('Environment keys found:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
        process.exit(1);
    }

    console.log(`🚀 Starting keep-alive for ${uniqueProjects.length} projects...`);

    let successCount = 0;
    for (const project of uniqueProjects) {
        const success = await keepAlive(project.url, project.key, project.name);
        if (success) successCount++;
    }

    console.log(`\nSummary: ${successCount}/${uniqueProjects.length} pulses successful.`);
}

runAll();
