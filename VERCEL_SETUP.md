# Vercel Serverless Function Setup

## Files Created/Modified

1. **`api/index.js`** - Vercel serverless function handler
2. **`vercel.json`** - Vercel configuration
3. **`package.json`** - Added `postinstall` and `vercel-build` scripts for Prisma

## Critical Setup Steps for Vercel

### 1. Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```
SUPABASE_URL=https://xxsyfxxeqjkicqlmvwbx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=4000 (optional)
```

### 2. Build Configuration
The `postinstall` and `vercel-build` scripts ensure Prisma client is generated during deployment.

### 3. Function Configuration
- Function timeout: 30 seconds (configured in vercel.json)
- All routes are handled by `api/index.js`

## Common Issues and Fixes

### Issue: "FUNCTION_INVOCATION_FAILED"
**Causes:**
1. Missing environment variables in Vercel
2. Prisma client not generated
3. Module initialization error

**Solution:**
1. Check Vercel logs for specific error
2. Verify all env vars are set in Vercel dashboard
3. Ensure `prisma generate` runs during build (handled by postinstall)

### Issue: Prisma Client Not Found
**Solution:**
- The `postinstall` script runs `prisma generate` automatically
- Verify Prisma schema is valid: `npx prisma validate`

## Testing Locally
```bash
# Install dependencies (triggers postinstall)
npm install

# Generate Prisma client
npm run prisma:generate

# Test serverless function locally
vercel dev
```

## Deployment
```bash
# Deploy to Vercel
vercel --prod
```

Make sure all environment variables are set before deploying!
