import { Router } from 'express';
import {
  register,
  login,
  demoLogin,
  me,
  updatePassword,
  updateProfile,
  updateEmail,
  deleteAccount,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, me);
router.patch('/password', requireAuth, updatePassword);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/email', requireAuth, updateEmail);
router.delete('/account', requireAuth, deleteAccount);

export default router;
