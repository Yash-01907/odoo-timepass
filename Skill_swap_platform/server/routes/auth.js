import express from 'express';
import { protect } from '../middleware/auth.js';
import { registerValidation, loginValidation, validateInput } from '../middleware/validation.js';
import { register, login, getProfile, updateProfile, logout } from '../controllers/auth.js';

const router = express.Router();

router.post('/register', registerValidation, validateInput, register);
router.post('/login', loginValidation, validateInput, login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;