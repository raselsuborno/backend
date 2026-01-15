import express from 'express';
import quotesController from '../controllers/quotes.controller.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

/**
 * GET /api/quotes
 * Get all quotes
 * 
 * Returns: { data: [...] } - Array of quotes
 * 
 * Changes:
 * - Uses supabaseAdmin instead of Prisma
 * - Returns consistent { data: [...] } format
 * - Handles errors gracefully with 500 status
 * - Returns empty array if no quotes found
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('quotes')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[Quotes] Supabase error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to fetch quotes',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: []
      });
    }

    // Return consistent format: { data: [...] }
    res.json({ data: data || [] });
  } catch (err) {
    console.error('[Quotes] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fetch quotes',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: []
    });
  }
});

// POST /api/quotes - Create quote request (public, but can be authenticated)
router.post('/', optionalAuth, quotesController.createQuote);

// GET /api/quotes/mine - Get user's quotes (requires auth)
router.get('/mine', requireAuth, quotesController.getMyQuotes);

export default router;
