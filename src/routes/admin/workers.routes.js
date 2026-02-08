import express from 'express';
import workersController from '../../controllers/admin/workers.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/workers - Get all workers
router.get('/', asyncHandler(workersController.getAllWorkers));

// GET /api/admin/workers/:id - Get single worker
router.get('/:id', asyncHandler(workersController.getWorker));

// POST /api/admin/workers - Create new worker account
router.post('/', asyncHandler(workersController.createWorker));

// PATCH /api/admin/workers/:id/status - Activate/deactivate worker
router.patch('/:id/status', asyncHandler(workersController.updateWorkerStatus));

export default router;



