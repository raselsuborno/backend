import express from 'express';
import * as ordersController from '../../controllers/admin/orders.controller.js';

const router = express.Router();

router.get('/', ordersController.getAllOrders);
router.get('/:id', ordersController.getOrder);
router.patch('/:id/status', ordersController.updateOrderStatus);

export default router;


