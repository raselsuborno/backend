import "dotenv/config";
import app from './app.js';

const PORT = process.env.PORT || 4000;

// Validate critical environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

console.log('[Server] Environment check:');
console.log('[Server] SUPABASE_URL:', requiredEnvVars.SUPABASE_URL ? '✓ Loaded' : '✗ Missing');
console.log('[Server] SUPABASE_SERVICE_ROLE_KEY:', requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY ? '✓ Loaded' : '✗ Missing');

// Fail fast if critical env vars are missing
if (!requiredEnvVars.SUPABASE_URL || !requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Server] ERROR: Missing required environment variables!');
  console.error('[Server] Please ensure your .env file contains:');
  console.error('[Server]   SUPABASE_URL=your_supabase_url');
  console.error('[Server]   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

