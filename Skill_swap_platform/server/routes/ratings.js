import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateInput } from '../middleware/validation.js';
import {
  createRating,
  getUserRatings,
  getSwapRatings,
  updateRating,
  deleteRating
} from '../controllers/ratings.js';

const router = express.Router();

router.post('/', protect, validateInput, createRating);
router.get('/user/:userId', protect, getUserRatings);
router.get('/swap/:swapId', protect, getSwapRatings);
router.put('/:id', protect, validateInput, updateRating);
router.delete('/:id', protect, deleteRating);

export default router;