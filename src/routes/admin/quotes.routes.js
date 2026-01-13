import express from 'express';
import * as quotesController from '../../controllers/admin/quotes.controller.js';

const router = express.Router();

router.get('/', quotesController.getAllQuotes);
router.patch('/:id/status', quotesController.updateQuoteStatus);
router.delete('/:id', quotesController.deleteQuote);

export default router;



