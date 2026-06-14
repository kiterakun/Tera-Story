import { AsyncLocalStorage } from 'node:async_hooks';
import { pino, type Logger, type LoggerOptions } from 'pino';

/**
 * Structured logger (pino) with request ID correlation via AsyncLocalStorage.
 *
 * Usage:
 *   import { logger, withRequestContext } from './utils/logger';
 *
 *   // Wrap an Express middleware to seed the request id:
 *   app.use((req, res, next) => {
 *     withRequestContext({ requestId: req.requestId }, () => next());
 *   });
 *
 *   // Anywhere downstream, the request id is auto-included:
 *   logger.info({ userId }, 'login succeeded');
 *
 *   // Or for ad-hoc calls:
 *   logger.warn({ err }, 'failed to send email');
 *
 * Log level is controlled by the LOG_LEVEL env var (default: 'info' in
 * production, 'debug' otherwise). Output is structured JSON to stdout,
 * which is the format expected by log aggregators (Loki, CloudWatch,
 * etc.). The requestId field is auto-merged when the AsyncLocalStorage
 * context is active.
 */

const isProduction = process.env.NODE_ENV === 'production';

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  base: {
    service: 'tera-story-api',
    env: process.env.NODE_ENV ?? 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  mixin() {
    const ctx = requestContext.getStore();
    return ctx ? { requestId: ctx.requestId } : {};
  },
};

export const logger: Logger = pino(baseOptions);

interface RequestContext {
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Run `fn` inside an async context with the given request metadata. */
export function withRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return requestContext.run(ctx, fn);
}
