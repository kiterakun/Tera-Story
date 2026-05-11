import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { addClient, emit, removeClient } from '../services/sseManager';

const router = Router();

router.get('/:playthroughId', (req: Request, res: Response): void => {
  const playthroughParam = req.params.playthroughId;
  const playthroughId = typeof playthroughParam === 'string' ? playthroughParam : undefined;

  // Read token from httpOnly cookie first (EventSource sends cookies for same-origin),
  // fallback to query param for cross-origin or non-cookie clients.
  let token: string | undefined;
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!playthroughId) {
    res.status(400).json({ error: 'Missing playthroughId' });
    return;
  }

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    jwt.verify(token, env.JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  addClient(playthroughId, res);
  emit(playthroughId, 'connected', { playthroughId, connectedAt: new Date().toISOString() });

  req.on('close', () => {
    removeClient(playthroughId, res);
  });
});

export default router;
