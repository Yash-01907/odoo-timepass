import express from 'express';
import { protect } from '../middleware/auth.js';
import { swapValidation, validateInput } from '../middleware/validation.js';
import {
  createSwapRequest,
  getMySwaps,
  getSwapById,
  respondToSwap,
  cancelSwap,
  markSwapCompleted,
  getSwapHistory
} from '../controllers/swaps.js';

const router = express.Router();

router.post('/', protect, swapValidation, validateInput, createSwapRequest);
router.get('/my-swaps', protect, getMySwaps);
router.get('/history', protect, getSwapHistory);
router.get('/:id', protect, getSwapById);
router.put('/:id/respond', protect, respondToSwap);
router.put('/:id/cancel', protect, cancelSwap);
router.put('/:id/complete', protect, markSwapCompleted);

export default router;