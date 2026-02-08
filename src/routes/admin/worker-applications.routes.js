import express from 'express';
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
  requestDocuments,
} from '../../controllers/admin/worker-applications.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(getAllApplications));
router.post('/:id/approve', asyncHandler(approveApplication));
router.post('/:id/reject', asyncHandler(rejectApplication));
router.post('/:id/request-docs', asyncHandler(requestDocuments));

export default router;
