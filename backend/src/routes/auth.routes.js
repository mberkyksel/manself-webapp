import { Router } from 'express';
import { register, login, me, updatePassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.patch('/password', requireAuth, updatePassword);

export default router;
