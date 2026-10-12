import { Router } from 'express';
import { getChores, saveChores } from '../controllers/chore.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getChores);
router.put('/', saveChores);

export default router;
