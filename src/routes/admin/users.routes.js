import express from 'express';
import usersController from '../../controllers/admin/users.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/users - Get all users (customers)
router.get('/', asyncHandler(usersController.getAllUsers));

// GET /api/admin/users/:id - Get single user with details
router.get('/:id', asyncHandler(usersController.getUser));

// PATCH /api/admin/users/:id - Update user profile (manual corrections)
router.patch('/:id', asyncHandler(usersController.updateUser));

export default router;



