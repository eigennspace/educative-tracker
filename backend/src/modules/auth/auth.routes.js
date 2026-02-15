import { Router } from 'express';
import {
  forgotPasswordHandler,
  loginHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler
} from './auth.controller.js';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

export default router;
