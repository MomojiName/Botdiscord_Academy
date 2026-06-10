const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getKeys() {
    console.log("Fetching licenses...");
    const { data, error } = await supabase.from('licenses').select('*');
    if (error) {
        console.error("Error fetching licenses:", error.message);
    } else {
        console.table(data);
    }
}
getKeys();

