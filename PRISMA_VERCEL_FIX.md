# Fixing Prisma Client Generation on Vercel

## The Problem

When using the legacy `builds` configuration in `vercel.json`, Vercel caches dependencies which prevents the `postinstall` script from running. This means `prisma generate` doesn't execute, leading to outdated Prisma Client errors.

## Current Configuration

- ✅ `postinstall` script in `package.json` runs `prisma generate`
- ✅ `prisma` is in `dependencies` (not `devDependencies`)
- ✅ `binaryTargets` are configured in `schema.prisma` for Vercel
- ⚠️ `buildCommand` in `vercel.json` is IGNORED when using legacy `builds`

## Solution

The `postinstall` script should work, but Vercel's dependency caching can prevent it from running. You have two options:

### Option 1: Clear Vercel's Build Cache (Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll down to "Build Cache"
3. Click "Clear Build Cache" or "Rebuild without cache"
4. Redeploy your project

This forces Vercel to run `npm install` again, which triggers the `postinstall` script.

### Option 2: Configure Build Command in Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Under "Build & Development Settings"
3. Set "Build Command" to: `prisma generate`
4. Set "Output Directory" to: (leave empty or set to current directory)
5. Redeploy

Note: This works differently from `buildCommand` in `vercel.json` when using legacy builds.

### Option 3: Force Postinstall via Package Script

If the above doesn't work, you can try adding a `prepare` script (runs after install):

```json
{
  "scripts": {
    "prepare": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

## Verification

After implementing the fix, check Vercel build logs to confirm:
- `prisma generate` runs during the build
- Prisma Client is generated successfully
- No Prisma Client errors in runtime logs
