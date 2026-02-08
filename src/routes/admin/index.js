import express from 'express';
const router = express.Router();
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.middleware.js';
import adminController from '../../controllers/admin/admin.controller.js';
import bookingsRoutes from './bookings.routes.js';
import servicesRoutes from './services.routes.js';
import serviceOptionsRoutes from './service-options.routes.js';
import workersRoutes from './workers.routes.js';
import usersRoutes from './users.routes.js';
import analyticsRoutes from './analytics.routes.js';
import workerApplicationsRoutes from './worker-applications.routes.js';
import quotesRoutes from './quotes.routes.js';
import choresRoutes from './chores.routes.js';
import ordersRoutes from './orders.routes.js';
import shopRoutes from './shop.routes.js';

// Async error wrapper for middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All admin routes require authentication and admin role
// Using requireRole: assumes requireAuth already ran, checks req.user.profile.role
// Wrap in asyncHandler to ensure errors are caught and passed to error handler
router.use(asyncHandler(requireAuth));
router.use(asyncHandler(requireRole(['admin'])));

// Admin dashboard stats
router.get('/stats', asyncHandler(adminController.getStats));

// Contact messages (legacy - keep for compatibility)
router.get('/contact', asyncHandler(adminController.getContactMessages));

// Mount sub-routers
router.use('/bookings', bookingsRoutes);
router.use('/services', servicesRoutes);
router.use('/service-options', serviceOptionsRoutes);
router.use('/workers', workersRoutes);
router.use('/users', usersRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/worker-applications', workerApplicationsRoutes);
router.use('/quotes', quotesRoutes);
router.use('/chores', choresRoutes);
router.use('/orders', ordersRoutes);
router.use('/shop', shopRoutes);

// Legacy routes (for backward compatibility)
router.get('/workers', asyncHandler(adminController.getWorkers));
router.get('/users', asyncHandler(adminController.getUsers));

export default router;

