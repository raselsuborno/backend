import express from 'express';
import analyticsController from '../../controllers/admin/analytics.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/analytics/overview - Get high-level overview metrics
router.get('/overview', asyncHandler(analyticsController.getOverview));

// GET /api/admin/analytics/bookings - Get detailed booking analytics
router.get('/bookings', asyncHandler(analyticsController.getBookingsAnalytics));

// GET /api/admin/analytics/revenue - Get revenue analytics
router.get('/revenue', asyncHandler(analyticsController.getRevenueAnalytics));

// GET /api/admin/analytics/workers - Get worker performance analytics
router.get('/workers', asyncHandler(analyticsController.getWorkersAnalytics));

// GET /api/admin/analytics/services - Get service performance analytics
router.get('/services', asyncHandler(analyticsController.getServicesAnalytics));

export default router;



