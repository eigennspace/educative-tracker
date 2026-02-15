import { z } from 'zod';
import {
  loginUser,
  refreshUserTokens,
  registerUser,
  requestPasswordReset,
  resetPassword
} from './auth.service.js';

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8).max(72)
});

export async function registerHandler(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);
    const data = await registerUser(payload);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);
    const data = await loginUser(payload);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export function refreshHandler(req, res, next) {
  try {
    const payload = refreshSchema.parse(req.body);
    const data = refreshUserTokens(payload.refreshToken);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export function forgotPasswordHandler(req, res, next) {
  try {
    const payload = forgotPasswordSchema.parse(req.body);
    const data = requestPasswordReset(payload);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    const data = await resetPassword(payload);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}
