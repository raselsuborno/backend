import express from 'express';
import documentsController from '../../controllers/worker/documents.controller.js';

const router = express.Router();

// All routes are protected by parent router middleware (requireAuth + requireRole)

// GET /api/worker/documents - Get all documents for logged-in worker
router.get('/', documentsController.getMyDocuments);

// POST /api/worker/documents - Upload a document
router.post('/', documentsController.uploadDocument);

// DELETE /api/worker/documents/:id - Delete a document
router.delete('/:id', documentsController.deleteDocument);

export default router;



