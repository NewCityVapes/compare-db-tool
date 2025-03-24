import { createClient } from "@supabase/supabase-js";

// Load environment variables manually (for Node.js scripts)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error("❌ ERROR: Supabase API Key is missing. Check .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
