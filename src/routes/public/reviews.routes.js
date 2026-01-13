import express from 'express';
const router = express.Router();
import reviewsController from '../../controllers/public/reviews.controller.js';

// Public route - no auth required
router.get('/', reviewsController.getGoogleReviews);

export default router;
