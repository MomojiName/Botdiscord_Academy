const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function tryInsert(type) {
    const { error } = await supabase.from('licenses').insert([
        { license_key: 'TEST-' + type, key_type: type, is_active: true }
    ]);
    if (!error) console.log("Success with type:", type);
}

async function run() {
    await tryInsert('day');
    await tryInsert('afternoon');
    await tryInsert('evening');
    await tryInsert('all');
    await tryInsert('24h');
    await tryInsert('unlimited');
    await tryInsert('default');
}
run();
