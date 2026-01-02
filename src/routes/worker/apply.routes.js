import express from 'express';
import { applyForWorker } from '../../controllers/worker/apply.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/worker/apply - Public route with optional auth
router.post('/', optionalAuth, applyForWorker);

export default router;


