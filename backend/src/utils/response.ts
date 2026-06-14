import type { Request, Response } from 'express';

/**
 * Response envelope helpers.
 *
 * Standard shape returned from all /api/v1/* endpoints:
 *   { status: 'success' | 'error', data, message, requestId }
 *
 * The legacy /api/* routes can opt-in by using ok()/fail() too, but are
 * not required to (backward compat).
 */

export interface ApiSuccess<T> {
  status: 'success';
  data: T;
  message?: string;
  requestId: string;
}

export interface ApiError {
  status: 'error';
  error: { code: string; message: string; details?: unknown };
  requestId: string;
}

export type Envelope<T> = ApiSuccess<T> | ApiError;

/** Read the requestId attached by requestId middleware (set on every request). */
function getRequestId(req: Request): string {
  return (req as Request & { requestId?: string }).requestId ?? '';
}

export function ok<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const body: ApiSuccess<T> = {
    status: 'success',
    data,
    message,
    requestId: getRequestId(res.req),
  };
  return res.status(statusCode).json(body);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return ok(res, data, message, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).end();
}

export function fail(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown,
): Response {
  const body: ApiError = {
    status: 'error',
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    requestId: getRequestId(res.req),
  };
  return res.status(statusCode).json(body);
}
