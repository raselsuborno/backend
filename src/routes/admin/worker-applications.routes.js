import express from 'express';
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
  requestDocuments,
} from '../../controllers/admin/worker-applications.controller.js';

const router = express.Router();

router.get('/', getAllApplications);
router.post('/:id/approve', approveApplication);
router.post('/:id/reject', rejectApplication);
router.post('/:id/request-docs', requestDocuments);

export default router;
