import express from 'express';
import workerBookingsController from '../../controllers/worker/bookings.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/worker/bookings - Get all bookings assigned to this worker
router.get('/', workerBookingsController.getMyBookings);

// PATCH /api/worker/bookings/:id/accept - Accept an assigned job
router.patch('/:id/accept', workerBookingsController.acceptBooking);

// PATCH /api/worker/bookings/:id/reject - Reject an assigned job
router.patch('/:id/reject', workerBookingsController.rejectBooking);

// PATCH /api/worker/bookings/:id/start - Start a job
router.patch('/:id/start', workerBookingsController.startBooking);

// PATCH /api/worker/bookings/:id/complete - Complete a job
router.patch('/:id/complete', workerBookingsController.completeBooking);

export default router;



