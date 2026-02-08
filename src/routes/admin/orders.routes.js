import express from 'express';
import * as ordersController from '../../controllers/admin/orders.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(ordersController.getAllOrders));
router.get('/:id', asyncHandler(ordersController.getOrder));
router.patch('/:id/status', asyncHandler(ordersController.updateOrderStatus));

export default router;



