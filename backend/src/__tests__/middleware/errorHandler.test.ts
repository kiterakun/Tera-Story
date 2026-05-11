import { errorHandler } from '../../middleware/errorHandler';
import { AppError } from '../../utils/AppError';

function mockResponse() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as import('express').Response;
}

describe('errorHandler middleware', () => {
  const req = {} as import('express').Request;
  const next = vi.fn();

  it('handles AppError with statusCode and message', () => {
    const res = mockResponse();

    errorHandler(new AppError('Forbidden', 403), req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles mongoose ValidationError as 400', () => {
    const res = mockResponse();
    const err = new Error('User validation failed');
    err.name = 'ValidationError';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'User validation failed' });
  });

  it('handles CastError as invalid ID format', () => {
    const res = mockResponse();
    const err = new Error('Cast failed');
    err.name = 'CastError';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
  });

  it('handles duplicate key error code 11000 as 409', () => {
    const res = mockResponse();
    const err = new Error('duplicate key') as Error & { code: number };
    err.code = 11000;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Duplicate entry' });
  });

  it('handles generic errors as 500 with generic response', () => {
    const res = mockResponse();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(new Error('boom'), req, res, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    consoleSpy.mockRestore();
  });
});
