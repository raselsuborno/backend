import express from 'express';
import workersController from '../../controllers/admin/workers.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/workers - Get all workers
router.get('/', workersController.getAllWorkers);

// GET /api/admin/workers/:id - Get single worker
router.get('/:id', workersController.getWorker);

// POST /api/admin/workers - Create new worker account
router.post('/', workersController.createWorker);

// PATCH /api/admin/workers/:id/status - Activate/deactivate worker
router.patch('/:id/status', workersController.updateWorkerStatus);

export default router;



