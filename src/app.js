import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

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
import customerBookingsRoutes from './routes/customer/bookings.routes.js';
import adminRoutes from './routes/admin/index.js';
import workerRoutes from './routes/worker/index.js';
import workerApplicationRoutes from './routes/worker-application.routes.js';
import workerApplyRoutes from './routes/worker/apply.routes.js';


const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/chores', choresRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/contact', contactRoutes);
app.use('/public/services', publicServicesRoutes);
app.use('/customer/bookings', customerBookingsRoutes);
app.use('/api/admin', adminRoutes); // Admin routes under /api/admin/*
app.use('/admin', adminRoutes); // Legacy compatibility
app.use('/api/worker/apply', workerApplyRoutes); // Worker apply route (public with optional auth) - BEFORE protected routes
app.use('/api/worker', workerRoutes); // Worker routes under /api/worker/* (protected)
app.use('/api/worker-applications', workerApplicationRoutes); // Legacy worker application routes (public)

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://chorescape.pages.dev"
  ],
  credentials: true
}));
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.message);
  console.error('[Error Handler] Stack:', err.stack);
  
  // Don't send stack trace in production
  const response = {
    message: err.message || 'Internal Server Error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode || err.status || 500).json(response);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;

