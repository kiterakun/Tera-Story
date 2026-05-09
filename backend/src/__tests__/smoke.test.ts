import request from 'supertest';
import { app } from '../index';

describe('Smoke tests — verify test infrastructure works', () => {
  it('GET /api/health returns ok with db connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });

  it('POST /api/auth/register creates user and sets httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'smoketest',
        email: 'smoke@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('smoketest');
    expect(res.body.user.email).toBe('smoke@test.com');
    // token cookie should be set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith('token='),
    );
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
  });
});
