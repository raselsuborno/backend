import express from 'express';
import usersController from '../../controllers/admin/users.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/admin/users - Get all users (customers)
router.get('/', usersController.getAllUsers);

// GET /api/admin/users/:id - Get single user with details
router.get('/:id', usersController.getUser);

// PATCH /api/admin/users/:id - Update user profile (manual corrections)
router.patch('/:id', usersController.updateUser);

export default router;



