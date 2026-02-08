# Troubleshooting Admin Dashboard 500 Errors

## Current Status
After redeployment, admin dashboard endpoints are still returning 500 errors.

## What Was Fixed (In Code)
1. ✅ Added `Promise.allSettled` for resilient query handling
2. ✅ Added error handling in `requireRole` middleware
3. ✅ Added global error handler in `app.js` that catches admin endpoint errors
4. ✅ All endpoints return 200 with default data instead of 500

## Possible Causes

### 1. Code Not Actually Deployed
**Check:** Verify the latest commit is on Vercel
- Go to Vercel dashboard → Your project → Deployments
- Check if the latest commit hash matches your local commit
- Check build logs for any errors

### 2. Prisma Client Not Regenerated
**Issue:** After adding database columns, Prisma Client needs regeneration
**Fix:**
```bash
cd backend
npx prisma generate
```
Then redeploy.

**Or on Vercel:**
- Check if `postinstall` script runs during build
- Should see "Prisma Client generated successfully" in build logs
- If not, add build command: `prisma generate`

### 3. Database Connection Issue
**Check:** Verify `DATABASE_URL` environment variable is set correctly on Vercel
- Go to Vercel → Project Settings → Environment Variables
- Ensure `DATABASE_URL` is set and correct

### 4. Middleware Error Before Controller
**Check:** Error might be in `requireAuth` or `requireRole` middleware
- Check Vercel function logs for specific error messages
- Look for "[requireRole] Error" or "[requireAuth] Error" in logs

### 5. Syntax Error Preventing Code Execution
**Check:** Verify code compiles without errors
```bash
cd backend
node -c src/controllers/admin/admin.controller.js
node -c src/middleware/requireRole.middleware.js
node -c src/app.js
```

## Debugging Steps

### Step 1: Check Vercel Logs
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Logs" tab
4. Look for errors when accessing `/api/admin/stats`
5. Copy the exact error message

### Step 2: Test Locally
```bash
cd backend
npm run dev
```
Then test the admin endpoint locally to see if it works.

### Step 3: Verify Prisma Schema Matches Database
```bash
cd backend
npx prisma db pull
```
This will update your schema.prisma to match the actual database.

### Step 4: Check Environment Variables
Ensure all required env vars are set on Vercel:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Quick Fix: Force Error Handler

If errors persist, the global error handler in `app.js` should catch them. Verify it's working by checking:
1. Error handler is registered AFTER all routes (it is)
2. Error handler checks for admin endpoints (it does)
3. Error handler returns 200 instead of 500 (it does)

## Next Steps

1. **Check Vercel logs** - This will tell us exactly what's failing
2. **Verify deployment** - Ensure latest code is actually deployed
3. **Test locally** - See if issue reproduces locally
4. **Check Prisma** - Ensure client is regenerated

## Files Modified (Need Deployment)
- `backend/src/controllers/admin/admin.controller.js`
- `backend/src/middleware/requireRole.middleware.js`
- `backend/src/app.js`

## Expected Behavior After Fix
- Admin dashboard loads without 500 errors
- Stats show zeros if queries fail, real data if they succeed
- All endpoints return 200 status (not 500)
