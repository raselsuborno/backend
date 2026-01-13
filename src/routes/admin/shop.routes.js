import express from 'express';
import shopController from '../../controllers/admin/shop.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// Product Categories
router.get('/categories', shopController.getAllCategories);
router.post('/categories', shopController.createCategory);
router.patch('/categories/:id', shopController.updateCategory);
router.delete('/categories/:id', shopController.deleteCategory);

// Products
router.get('/products', shopController.getAllProducts);
router.get('/products/:id', shopController.getProduct);
router.post('/products', shopController.createProduct);
router.patch('/products/:id', shopController.updateProduct);
router.delete('/products/:id', shopController.deleteProduct);

export default router;
