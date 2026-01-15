import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { supabaseAdmin } from './lib/supabase.js';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import addressesRoutes from './routes/addresses.routes.js';
import choresRoutes from './routes/chores.routes.js';
import quotesRoutes from './routes/quotes.routes.js';
import shopRoutes from './routes/shop.routes.js';
import careersRoutes from './routes/careers.routes.js';
import contactRoutes from './routes/contact.routes.js';
import publicServicesRoutes from './routes/public/services.routes.js';
import publicReviewsRoutes from './routes/public/reviews.routes.js';
import customerBookingsRoutes from './routes/customer/bookings.routes.js';
import adminRoutes from './routes/admin/index.js';
import workerRoutes from './routes/worker/index.js';
import workerApplicationRoutes from './routes/worker-application.routes.js';
import workerApplyRoutes from './routes/worker/apply.routes.js';


const app = express();

// CORS configuration - allow Cloudflare Pages frontend
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) {
      return callback(null, true);
    }

    // List of allowed origins
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://chorescape.pages.dev",
      "https://6ac1eeb0.frontend-1np.pages.dev", // Current Cloudflare Pages URL
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any Cloudflare Pages subdomain (*.pages.dev)
    if (origin.endsWith('.pages.dev')) {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Middleware
app.use(helmet());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Increase body size limit to 10MB for image uploads (base64 images can be large)
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB in bytes (10000 KB)
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));

// Routes
// IMPORTANT: Route order matters! More specific routes must come before less specific ones.

// Root route for Vercel health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Backend is live',
    message: 'ChorEscape API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================
// Mount public routes FIRST, before other /api routes
// This ensures /api/public/services works correctly

app.use('/api/public/services', publicServicesRoutes); // Must come before /api/services
app.use('/api/public/reviews', publicReviewsRoutes);

// Worker application routes (public with optional auth)
app.use('/api/worker/apply', workerApplyRoutes);
app.use('/api/worker-applications', workerApplicationRoutes);

// ============================================
// AUTHENTICATED ROUTES (require auth)
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Customer routes
app.use('/api/bookings', bookingsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/chores', choresRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/contact', contactRoutes);

// Legacy customer bookings route
app.use('/customer/bookings', customerBookingsRoutes);

// ============================================
// ADMIN ROUTES (require auth + admin role)
// ============================================
// Admin routes must come after other /api routes to avoid conflicts

app.use('/api/admin', adminRoutes); // Admin routes under /api/admin/*
app.use('/admin', adminRoutes); // Legacy compatibility

// ============================================
// WORKER ROUTES (require auth + worker role)
// ============================================

app.use('/api/worker', workerRoutes); // Worker routes under /api/worker/* (protected)

// ============================================
// LEGACY /api/services route (for backward compatibility)
// ============================================
// This route is kept for backward compatibility but should use /api/public/services
app.get('/api/services', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('isActive', true);
    
    if (error) {
      console.error('[Services Route Error]', error);
      return res.status(500).json({ 
        message: error.message || 'Failed to fetch services',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: []
      });
    }
    
    // Return consistent format: { data: [...] }
    res.json({ data: data || [] });
  } catch (err) {
    console.error('[Services Route Error]', err);
    res.status(500).json({ 
      message: err.message || 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: []
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.message);
  console.error('[Error Handler] Stack:', err.stack);
  
  // Handle "entity too large" errors specifically
  if (err.type === 'entity.too.large' || err.statusCode === 413 || err.message.includes('too large')) {
    return res.status(413).json({
      message: 'File size is too large. Maximum allowed size is 10MB (10,000 KB). Please compress your image and try again.',
      data: null
    });
  }
  
  // Don't send stack trace in production
  const response = {
    message: err.message || 'Internal Server Error',
    data: null
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(err.statusCode || err.status || 500).json(response);
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    data: null
  });
});

export default app;
