import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateInput } from '../middleware/validation.js';
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getUserSkills,
  addSkill,
  updateSkill,
  deleteSkill
} from '../controllers/users.js';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

// Skills routes
router.get('/:id/skills', protect, getUserSkills);
router.post('/:id/skills', protect, validateInput, addSkill);
router.put('/:id/skills/:skillId', protect, validateInput, updateSkill);
router.delete('/:id/skills/:skillId', protect, deleteSkill);

export default router;