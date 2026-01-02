import express from 'express';
import * as choresController from '../../controllers/admin/chores.controller.js';

const router = express.Router();

router.get('/', choresController.getAllChores);
router.patch('/:id/status', choresController.updateChoreStatus);
router.delete('/:id', choresController.deleteChore);

export default router;


