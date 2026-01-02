import express from 'express';
import contactController from '../controllers/contact.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.middleware.js';

const router = express.Router();

// Public route - anyone can submit a contact message
router.post('/', contactController.createMessage);

// Admin routes - require authentication and admin role
// Using requireRole: assumes requireAuth already ran, checks req.user.profile.role
router.get('/', requireAuth, requireRole(['admin']), contactController.getAllMessages);
router.get('/:id', requireAuth, requireRole(['admin']), contactController.getMessage);
router.put('/:id/status', requireAuth, requireRole(['admin']), contactController.updateStatus);
router.delete('/:id', requireAuth, requireRole(['admin']), contactController.deleteMessage);

export default router;

