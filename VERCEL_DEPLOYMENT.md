# Vercel Deployment Guide

## Overview
This Express backend is configured for serverless deployment on Vercel using `@vercel/node`.

## File Structure
- `api/index.js` - Vercel serverless entry point
- `src/app.js` - Express application with all routes
- `src/server.js` - Local development server entry point
- `src/lib/supabase.js` - Supabase client configuration

## Environment Variables (Vercel)

Set these in your Vercel project settings:

### Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)
- `NODE_ENV` - Set to `production` (automatically set by vercel.json)

### Optional
- `FRONTEND_URL` - Frontend URL for CORS (e.g., `https://chorescape.pages.dev`)
- `PORT` - Local development port (default: 4000)

## Deployment

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required variables listed above

4. **Redeploy** after setting environment variables:
   ```bash
   vercel --prod
   ```

## Local Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:4000` (or PORT from env).

## API Routes

### Health Check
- `GET /api/health` - Returns `{ ok: true }`

### Services
- `GET /api/services` - Fetch all services from Supabase

### Other Routes
All other routes are configured in `src/app.js`:
- `/api/auth/*`
- `/api/bookings/*`
- `/api/profile/*`
- etc.

## Frontend Connection (Cloudflare Pages)

In your frontend `.env` or `vite.config.mts`:

```env
VITE_API_BASE_URL=https://your-vercel-app.vercel.app/api
```

Or use Vercel's automatically generated URL:
```env
VITE_API_BASE_URL=https://your-project.vercel.app/api
```

## CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:5173` (local development)
- `https://chorescape.pages.dev` (Cloudflare Pages)
- Any URL set in `FRONTEND_URL` environment variable

## Supabase Configuration

The backend uses `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS) for server-side queries. This is the correct approach for backend operations.

**Important**: Never expose the service role key to the frontend. Only use it on the backend.

## Troubleshooting

### Route Not Found
- Ensure routes are prefixed with `/api/`
- Check `vercel.json` routes configuration
- Verify the route is defined in `src/app.js`

### Supabase Connection Errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel
- Check Supabase dashboard for project status
- Review serverless function logs in Vercel dashboard

### CORS Errors
- Add your frontend URL to `FRONTEND_URL` environment variable
- Or update CORS configuration in `src/app.js`
