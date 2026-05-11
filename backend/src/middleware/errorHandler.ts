import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface MongoError extends Error {
  code?: number;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message });
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }

  // Handle duplicate key errors
  if ((err as MongoError).code === 11000) {
    res.status(409).json({ error: 'Duplicate entry' });
    return;
  }

  // Unknown errors - log and return generic 500
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
