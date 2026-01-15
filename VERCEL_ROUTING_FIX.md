# Vercel Routing Fix

## What Was Fixed

1. ✅ Added root route handler (`/`) in `src/app.js` - Vercel was hitting `/` and getting 404
2. ✅ Verified `api/index.js` correctly exports Express app (no `app.listen()`)
3. ✅ Simplified `vercel.json` (removed unnecessary config)
4. ✅ Updated Supabase client to support both `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`

## Vercel Environment Variables Required

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

```
SUPABASE_URL=https://xxsyfxxeqjkicqlmvwbx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_... (or SUPABASE_SERVICE_ROLE_KEY)
DATABASE_URL=your_postgres_connection_string
```

**Note:** `SUPABASE_SECRET_KEY` (new format) or `SUPABASE_SERVICE_ROLE_KEY` (legacy) both work. The code supports both.

## Testing

After deploying, test these endpoints:

1. **Root route:** `https://your-backend.vercel.app/`
   - Should return: `{"status":"Backend is live",...}`

2. **Health check:** `https://your-backend.vercel.app/api/health`
   - Should return: `{"ok":true}`

3. **Services:** `https://your-backend.vercel.app/api/services`
   - Should return services array (if Supabase is configured)

## If Still Getting 404

1. Clear Vercel build cache: **Settings → General → Clear Build Cache**
2. Redeploy
3. Check Vercel build logs to ensure `prisma generate` runs (via `postinstall` script)
