import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  const errorMsg = 'Missing Supabase environment variables. ' +
    'SUPABASE_URL: ' + (SUPABASE_URL ? 'present' : 'missing') + ', ' +
    'SUPABASE_SERVICE_ROLE_KEY: ' + (SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing') + '. ' +
    'Please set these in Vercel environment variables.';
  console.error('[Supabase]', errorMsg);
  throw new Error(errorMsg);
}

// Create admin client with service role key for JWT verification
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
export { supabase as supabaseAdmin };