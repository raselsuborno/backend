// Load environment variables FIRST
import "dotenv/config";
import app from '../src/app.js';

// Vercel serverless function handler
// Export the Express app as the default export
export default app;
