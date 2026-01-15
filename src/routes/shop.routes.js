import express from 'express';
import shopController from '../controllers/shop.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

// Public routes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('products').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/categories', shopController.getCategories);
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProductById);

// Protected routes
router.use(requireAuth);
router.post('/orders', shopController.createOrder);
router.get('/orders/mine', shopController.getMyOrders);

export default router;



