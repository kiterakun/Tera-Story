import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { env } from '../../config/env';

function mockResponse() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as import('express').Response;
}

describe('authMiddleware', () => {
  const payload = { id: 'user-1', email: 'a@test.com', username: 'aria' };

  it('sets req.user and calls next for valid Authorization bearer token', () => {
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(req.user).toMatchObject(payload);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when token is missing', () => {
    const req = { cookies: {}, headers: {} } as AuthRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
  });

  it('returns 401 for expired token', () => {
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '-1s' });
    const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired', code: 'token_expired' });
  });

  it('returns 401 for invalid token', () => {
    const req = { cookies: {}, headers: { authorization: 'Bearer nope' } } as AuthRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token', code: 'token_invalid' });
  });

  it('reads cookie token before Authorization header', () => {
    const cookieToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    const headerToken = jwt.sign({ ...payload, id: 'header-user' }, env.JWT_SECRET, { expiresIn: '1h' });
    const req = {
      cookies: { token: cookieToken },
      headers: { authorization: `Bearer ${headerToken}` },
    } as unknown as AuthRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(req.user).toMatchObject(payload);
    expect(req.user?.id).toBe('user-1');
    expect(next).toHaveBeenCalledOnce();
  });
});
