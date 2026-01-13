import express from 'express';
import shopController from '../controllers/shop.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/categories', shopController.getCategories);
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProductById);

// Protected routes
router.use(requireAuth);
router.post('/orders', shopController.createOrder);
router.get('/orders/mine', shopController.getMyOrders);

export default router;



