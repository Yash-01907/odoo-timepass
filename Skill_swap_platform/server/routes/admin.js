import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { validateInput } from '../middleware/validation.js';
import {
  getDashboardStats,
  getAllUsers,
  banUser,
  unbanUser,
  approveSkill,
  rejectSkill,
  getAllSwaps,
  sendPlatformMessage,
  getPlatformMessages,
  generateUserActivityReport,
  generateSwapReport,
  generateFeedbackReport
} from '../controllers/admin.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.put('/skills/:userId/:skillId/approve', approveSkill);
router.put('/skills/:userId/:skillId/reject', rejectSkill);
router.get('/swaps', getAllSwaps);
router.post('/messages', validateInput, sendPlatformMessage);
router.get('/messages', getPlatformMessages);
router.get('/reports/users', generateUserActivityReport);
router.get('/reports/swaps', generateSwapReport);
router.get('/reports/feedback', generateFeedbackReport);

export default router;