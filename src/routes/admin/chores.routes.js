import express from 'express';
import * as choresController from '../../controllers/admin/chores.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(choresController.getAllChores));
router.patch('/:id/status', asyncHandler(choresController.updateChoreStatus));
router.delete('/:id', asyncHandler(choresController.deleteChore));

export default router;



