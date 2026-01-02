import express from 'express';
import careersController from '../controllers/careers.controller.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';

const router = express.Router();

// POST /api/careers - Submit application (public, but can be authenticated)
router.post('/', optionalAuth, careersController.createApplication);

export default router;


