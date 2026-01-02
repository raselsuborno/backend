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

// All admin routes require authentication and admin role
// Using requireRole: assumes requireAuth already ran, checks req.user.profile.role
router.use(requireAuth);
router.use(requireRole(['admin']));

// Admin dashboard stats
router.get('/stats', adminController.getStats);

// Contact messages (legacy - keep for compatibility)
router.get('/contact', adminController.getContactMessages);

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

// Legacy routes (for backward compatibility)
router.get('/workers', adminController.getWorkers);
router.get('/users', adminController.getUsers);

export default router;

