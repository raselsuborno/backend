import express from 'express';
import analyticsController from '../../controllers/admin/analytics.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/analytics/overview - Get high-level overview metrics
router.get('/overview', analyticsController.getOverview);

// GET /api/admin/analytics/bookings - Get detailed booking analytics
router.get('/bookings', analyticsController.getBookingsAnalytics);

// GET /api/admin/analytics/revenue - Get revenue analytics
router.get('/revenue', analyticsController.getRevenueAnalytics);

// GET /api/admin/analytics/workers - Get worker performance analytics
router.get('/workers', analyticsController.getWorkersAnalytics);

// GET /api/admin/analytics/services - Get service performance analytics
router.get('/services', analyticsController.getServicesAnalytics);

export default router;


