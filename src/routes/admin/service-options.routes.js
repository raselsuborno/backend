import express from 'express';
import serviceOptionsController from '../../controllers/admin/service-options.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/service-options - Get all options
router.get('/', serviceOptionsController.getAllOptions);

// GET /api/admin/service-options/:id - Get single option
router.get('/:id', serviceOptionsController.getOption);

// POST /api/admin/service-options - Create new option
router.post('/', serviceOptionsController.createOption);

// PATCH /api/admin/service-options/:id - Update option
router.patch('/:id', serviceOptionsController.updateOption);

// DELETE /api/admin/service-options/:id - Delete option
router.delete('/:id', serviceOptionsController.deleteOption);

export default router;


