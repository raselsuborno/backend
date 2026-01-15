import express from 'express';
import quotesController from '../controllers/quotes.controller.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

// GET /api/quotes - Get all quotes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('quotes').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quotes - Create quote request (public, but can be authenticated)
router.post('/', optionalAuth, quotesController.createQuote);

// GET /api/quotes/mine - Get user's quotes (requires auth)
router.get('/mine', requireAuth, quotesController.getMyQuotes);

export default router;

