import express from 'express';
const router = express.Router();
import servicesController from '../../controllers/services.controller.js';

// Public routes
router.get('/', servicesController.getAllServices);
router.get('/:id', servicesController.getServiceById);

// Protected routes (if needed)
// router.use(authMiddleware);
// router.post('/', servicesController.createService);
// router.put('/:id', servicesController.updateService);
// router.delete('/:id', servicesController.deleteService);

export default router;

