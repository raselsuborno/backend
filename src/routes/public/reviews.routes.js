import express from 'express';
const router = express.Router();
import reviewsController from '../../controllers/public/reviews.controller.js';
import { supabaseAdmin } from '../../lib/supabase.js';

// Public route - no auth required
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('reviews').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
