import express from 'express';
const router = express.Router();
import bookingsController from '../../controllers/bookings.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

// All booking routes require authentication
router.use(requireAuth);

router.get('/', bookingsController.getAllBookings);
router.get('/:id', bookingsController.getBookingById);
router.post('/', bookingsController.createBooking);
router.put('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);

export default router;

