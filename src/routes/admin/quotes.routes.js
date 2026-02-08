import express from 'express';
import * as quotesController from '../../controllers/admin/quotes.controller.js';

const router = express.Router();

// Async error wrapper for controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/', asyncHandler(quotesController.getAllQuotes));
router.patch('/:id/status', asyncHandler(quotesController.updateQuoteStatus));
router.delete('/:id', asyncHandler(quotesController.deleteQuote));

export default router;



