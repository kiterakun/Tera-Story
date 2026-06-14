import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * requestId middleware — assigns a UUID to every incoming request.
 *
 * The id is stored on `req.requestId` for downstream middleware/handlers
 * (logger, response envelope) and echoed back in the `X-Request-Id`
 * response header for client-side debugging.
 *
 * If the client provides an `X-Request-Id` header, that value is used
 * (after length and character whitelist validation) to preserve
 * traceability across services.
 */

const MAX_ID_LENGTH = 128;
const ALLOWED_ID = /^[A-Za-z0-9._-]+$/;

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

function sanitize(clientId: string | undefined): string | null {
  if (!clientId) return null;
  if (clientId.length > MAX_ID_LENGTH) return null;
  if (!ALLOWED_ID.test(clientId)) return null;
  return clientId;
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = sanitize(req.header('X-Request-Id')) ?? randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
