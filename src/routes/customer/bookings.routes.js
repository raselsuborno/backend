import express from 'express';
const router = express.Router();
import bookingsController from '../../controllers/bookings.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { supabaseAdmin } from '../../lib/supabase.js';

// All booking routes require authentication
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('bookings').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get('/:id', bookingsController.getBookingById);
router.post('/', bookingsController.createBooking);
router.put('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);

export default router;

