import express from 'express';
import bookingsController from '../../controllers/admin/bookings.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/bookings - Get all bookings
router.get('/', bookingsController.getAllBookings);

// GET /api/admin/bookings/:id - Get single booking
router.get('/:id', bookingsController.getBooking);

// PATCH /api/admin/bookings/:id/status - Update booking status
router.patch('/:id/status', bookingsController.updateStatus);

// PATCH /api/admin/bookings/:id/assign - Assign worker to booking
router.patch('/:id/assign', bookingsController.assignWorker);

// PATCH /api/admin/bookings/:id/unassign - Unassign worker from booking
router.patch('/:id/unassign', bookingsController.unassignWorker);

// PUT /api/admin/bookings/:id - Update booking (full edit)
router.put('/:id', bookingsController.updateBooking);

export default router;

