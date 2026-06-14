import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory that validates a request property against a Zod
 * schema. On failure, responds 400 with validation error details.
 *
 * Default source is 'body'; pass 'params' or 'query' to validate those
 * instead. On success the parsed value replaces the request property.
 */
export function validate(schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues,
      });
      return;
    }

    // Replace with parsed (coerced/sanitized) data
    if (source === 'body') {
      req.body = result.data;
    } else {
      // For params/query we mutate the source object in place.
      Object.assign(req[source] as Record<string, unknown>, result.data);
    }
    next();
  };
}
