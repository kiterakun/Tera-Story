import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { UserSettings } from '../models/UserSettings';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

const router = Router();

// --- Validation Schemas ---

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// --- Helpers ---

function signToken(user: { _id: unknown; email: string; username: string }): string {
  return jwt.sign(
    { id: String(user._id), email: user.email, username: user.username },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user: { _id: unknown; username: string; email: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// --- Routes ---

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  // Check for existing user
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    throw new AppError(`User with this ${field} already exists`, 409);
  }

  const user = await User.create({ username, email, password });

  // Auto-create UserSettings after registration
  await UserSettings.create({
    userId: user._id,
    language: 'en',
    theme: 'dark',
    aiSettings: {
      contextAgent: { provider: 'openai', model: 'gpt-4o' },
      writerAgent: { provider: 'openai', model: 'gpt-4o' },
      supportAgent: { provider: 'openai', model: 'gpt-4o' },
      imageAgent: { provider: 'openai', model: 'dall-e-3' },
    },
  });

  const token = signToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.status(201).json({ user: sanitizeUser(user) });
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({ user: sanitizeUser(user) });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user: sanitizeUser(user) });
});

// POST /api/auth/logout
router.post('/logout', (_req: AuthRequest, res: Response): void => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true });
});

export default router;