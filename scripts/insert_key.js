const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function insertKey() {
    const { data, error } = await supabase.from('licenses').insert([
        { license_key: 'DISBOT-PREMIUM-2026', key_type: 'premium', is_active: true }
    ]);
    if (error) {
        console.error("Error inserting key:", error.message);
    } else {
        console.log("Inserted DISBOT-PREMIUM-2026");
    }
}
insertKey();
