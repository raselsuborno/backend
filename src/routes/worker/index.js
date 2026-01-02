import express from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.middleware.js';
import bookingsRoutes from './bookings.routes.js';
import documentsRoutes from './documents.routes.js';

const router = express.Router();

// All worker routes require authentication and worker role
// Using requireRole: assumes requireAuth already ran, checks req.user.profile.role
router.use(requireAuth);
router.use(requireRole(['worker']));

// Mount sub-routers
router.use('/bookings', bookingsRoutes);
router.use('/documents', documentsRoutes);

export default router;

