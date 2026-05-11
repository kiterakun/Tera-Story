import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, IUserDocument } from '../models/User';
import { UserSettings } from '../models/UserSettings';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

const router = Router();
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function setAuthCookies(res: Response, token: string, refreshToken: string): void {
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

async function issueRefreshToken(user: IUserDocument): Promise<string> {
  const refreshToken = generateRefreshToken();
  user.refreshToken = refreshToken;
  user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
  await user.save();
  return refreshToken;
}

function readRefreshToken(req: Request): string | undefined {
  const body = req.body as { refreshToken?: unknown } | undefined;
  const bodyToken = typeof body?.refreshToken === 'string' ? body.refreshToken : undefined;
  return req.cookies?.refreshToken ?? bodyToken;
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
  const refreshToken = await issueRefreshToken(user);

  setAuthCookies(res, token, refreshToken);

  res.status(201).json({ user: user.toPublicJSON(), token, refreshToken });
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
  const refreshToken = await issueRefreshToken(user);

  setAuthCookies(res, token, refreshToken);

  res.json({ user: user.toPublicJSON(), token, refreshToken });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const currentRefreshToken = readRefreshToken(req);

  if (!currentRefreshToken) {
    res.status(401).json({ error: 'Invalid refresh token', code: 'token_expired' });
    return;
  }

  const user = await User.findOne({
    refreshToken: currentRefreshToken,
    refreshTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid refresh token', code: 'token_expired' });
    return;
  }

  const token = signToken(user);
  const refreshToken = await issueRefreshToken(user);

  setAuthCookies(res, token, refreshToken);

  res.json({ user: user.toPublicJSON(), token, refreshToken });
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

  res.json({ user: user.toPublicJSON() });
});

// POST /api/auth/logout
router.post('/logout', async (req: AuthRequest, res: Response): Promise<void> => {
  const refreshToken = readRefreshToken(req);

  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: '', refreshTokenExpires: '' } },
      { returnDocument: 'after' }
    );
  }

  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
});

export default router;
