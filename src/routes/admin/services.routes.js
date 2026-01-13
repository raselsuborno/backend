import express from 'express';
import servicesController from '../../controllers/admin/services.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/services - Get all services
router.get('/', servicesController.getAllServices);

// GET /api/admin/services/:id - Get single service
router.get('/:id', servicesController.getService);

// POST /api/admin/services - Create new service
router.post('/', servicesController.createService);

// PATCH /api/admin/services/:id - Update service
router.patch('/:id', servicesController.updateService);

// DELETE /api/admin/services/:id - Delete/deactivate service
router.delete('/:id', servicesController.deleteService);

export default router;



