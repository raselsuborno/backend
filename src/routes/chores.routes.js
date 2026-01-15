import express from 'express';
import choresController from '../controllers/chores.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

// POST route allows guests (optional auth), others require auth
router.post('/', optionalAuth, choresController.createChore);

// All other routes require authentication
router.use(requireAuth);
// GET /api/chores - Get all chores
// Returns: { data: [...] } - Array of chores
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chores')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[Chores] Supabase error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to fetch chores',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
        data: []
      });
    }

    // Return consistent format: { data: [...] }
    res.json({ data: data || [] });
  } catch (err) {
    console.error('[Chores] Unexpected error:', err);
    res.status(500).json({
      message: err.message || 'Failed to fetch chores',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      data: []
    });
  }
});
router.get('/:id', choresController.getChoreById);
router.put('/:id', choresController.updateChore);
router.delete('/:id', choresController.deleteChore);

export default router;

