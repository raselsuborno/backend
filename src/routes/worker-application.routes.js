import express from 'express';
import workerApplicationController from '../controllers/worker/worker-application.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes - no auth required for application submission
// POST /api/worker-applications - Submit worker application
router.post('/', optionalAuth, workerApplicationController.createApplication);

// GET /api/worker-applications/:id - Check application status (public, by ID)
router.get('/:id', workerApplicationController.getApplicationStatus);

// GET /api/worker-applications?email=xxx - Check application status (public, by email)
router.get('/', workerApplicationController.getApplicationStatus);

export default router;

