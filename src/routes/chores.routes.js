import express from 'express';
import choresController from '../controllers/chores.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';

const router = express.Router();

// POST route allows guests (optional auth), others require auth
router.post('/', optionalAuth, choresController.createChore);

// All other routes require authentication
router.use(requireAuth);
router.get('/', choresController.getAllChores);
router.get('/:id', choresController.getChoreById);
router.put('/:id', choresController.updateChore);
router.delete('/:id', choresController.deleteChore);

export default router;

