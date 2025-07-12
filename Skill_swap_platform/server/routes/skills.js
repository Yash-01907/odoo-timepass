import express from 'express';
import { protect } from '../middleware/auth.js';
import { searchSkills, getSkillCategories, getPopularSkills } from '../controllers/skills.js';

const router = express.Router();

router.get('/search', protect, searchSkills);
router.get('/categories', protect, getSkillCategories);
router.get('/popular', protect, getPopularSkills);

export default router;