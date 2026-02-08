import express from 'express';
import bookingsController from '../../controllers/admin/bookings.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/bookings - Get all bookings
router.get('/', asyncHandler(bookingsController.getAllBookings));

// GET /api/admin/bookings/:id - Get single booking
router.get('/:id', asyncHandler(bookingsController.getBooking));

// PATCH /api/admin/bookings/:id/status - Update booking status
router.patch('/:id/status', asyncHandler(bookingsController.updateStatus));

// PATCH /api/admin/bookings/:id/assign - Assign worker to booking
router.patch('/:id/assign', asyncHandler(bookingsController.assignWorker));

// PATCH /api/admin/bookings/:id/unassign - Unassign worker from booking
router.patch('/:id/unassign', asyncHandler(bookingsController.unassignWorker));

// PUT /api/admin/bookings/:id - Update booking (full edit)
router.put('/:id', asyncHandler(bookingsController.updateBooking));

export default router;

