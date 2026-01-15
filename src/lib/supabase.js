import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
// Support both SUPABASE_SECRET_KEY (new Supabase format) and SUPABASE_SERVICE_ROLE_KEY (legacy)
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const errorMsg = 'Missing Supabase environment variables. ' +
    'SUPABASE_URL: ' + (SUPABASE_URL ? 'present' : 'missing') + ', ' +
    'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY: ' + (SUPABASE_KEY ? 'present' : 'missing') + '. ' +
    'Please set SUPABASE_URL and either SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.';
  console.error('[Supabase]', errorMsg);
  throw new Error(errorMsg);
}

// Create admin client with service role key for JWT verification
// This key bypasses RLS and is safe to use in backend only
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
export { supabase as supabaseAdmin };