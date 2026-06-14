import type { Request, Response, NextFunction } from 'express';

/**
 * responseEnvelope middleware — wraps res.json() so existing handlers
 * automatically emit the v1 envelope shape { status, data, requestId }.
 *
 * This is a non-invasive adapter: handlers keep returning plain data via
 * res.json(data) and the middleware rewraps it on the way out. The
 * `status` is 'success' for 2xx, 'error' for 4xx/5xx.
 *
 * Behavior preservation:
 * - res.status(...).json(data) → wrapped envelope with same status
 * - res.send(...) (non-JSON) → passthrough
 * - res.end() (e.g., 204) → passthrough
 *
 * Errors already handled by errorHandler middleware are passed through
 * unchanged (their envelope is whatever errorHandler wrote).
 */

declare module 'express-serve-static-core' {
  interface Response {
    /** Original res.json before envelope wrapping; used internally. */
    _envelopeWrapped?: boolean;
  }
}

interface EnvelopeSuccess<T> {
  status: 'success';
  data: T;
  requestId: string;
}

interface EnvelopeError {
  status: 'error';
  error: { message: string };
  requestId: string;
}

function getRequestId(req: Request): string {
  return (req as Request & { requestId?: string }).requestId ?? '';
}

export function responseEnvelope(_req: Request, res: Response, next: NextFunction): void {
  if (res._envelopeWrapped) {
    next();
    return;
  }
  res._envelopeWrapped = true;

  const originalJson = res.json.bind(res);
  res.json = function envelopeJson(body?: unknown): Response {
    // If body is already an envelope, just attach requestId and pass through.
    if (
      body !== null &&
      typeof body === 'object' &&
      'status' in body &&
      (body as { status: unknown }).status === 'success'
    ) {
      (body as EnvelopeSuccess<unknown>).requestId = getRequestId(res.req);
      return originalJson(body);
    }
    if (
      body !== null &&
      typeof body === 'object' &&
      'status' in body &&
      (body as { status: unknown }).status === 'error'
    ) {
      (body as EnvelopeError).requestId = getRequestId(res.req);
      return originalJson(body);
    }
    const status = res.statusCode;
    if (status >= 400) {
      const envelope: EnvelopeError = {
        status: 'error',
        error:
          typeof body === 'object' && body !== null && 'error' in body
            ? { message: String((body as { error: unknown }).error) }
            : { message: typeof body === 'string' ? body : 'Request failed' },
        requestId: getRequestId(res.req),
      };
      return originalJson(envelope);
    }
    const envelope: EnvelopeSuccess<unknown> = {
      status: 'success',
      data: body,
      requestId: getRequestId(res.req),
    };
    return originalJson(envelope);
  };

  next();
}
