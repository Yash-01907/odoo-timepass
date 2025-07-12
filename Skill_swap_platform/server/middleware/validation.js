import { body, validationResult } from 'express-validator';
import xss from 'xss';

export const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  // Sanitize input
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  next();
};

const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const skillValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .isIn(['Technology', 'Design', 'Business', 'Languages', 'Arts', 'Sports', 'Music', 'Other'])
    .withMessage('Invalid category'),
  body('experienceLevel')
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Invalid experience level')
];

export const swapValidation = [
  body('skillOffered.skillId')
    .isMongoId()
    .withMessage('Invalid skill ID'),
  body('skillRequested.skillId')
    .isMongoId()
    .withMessage('Invalid skill ID'),
  body('proposedDate')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('duration')
    .isFloat({ min: 0.5, max: 8 })
    .withMessage('Duration must be between 0.5 and 8 hours'),
  body('format')
    .isIn(['online', 'in-person', 'hybrid'])
    .withMessage('Invalid format')
];