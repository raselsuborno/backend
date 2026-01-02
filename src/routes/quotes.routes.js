import express from 'express';
import quotesController from '../controllers/quotes.controller.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/quotes - Create quote request (public, but can be authenticated)
router.post('/', optionalAuth, quotesController.createQuote);

// GET /api/quotes/mine - Get user's quotes (requires auth)
router.get('/mine', requireAuth, quotesController.getMyQuotes);

export default router;

