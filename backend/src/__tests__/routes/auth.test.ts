import request from 'supertest';
import { app } from '../../index';
import { registerAndGetAgent, loginAndGetAgent } from '../helpers';
import { User } from '../../models/User';

describe('Auth routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  beforeEach(() => {
    // setup.ts cleans database after each test; hook kept for route-suite consistency.
  });

  it('POST /api/auth/register creates user and sets httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: 'alice', email: 'alice@example.com' });
    expect(res.body.user.password).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((cookie: string) =>
      cookie.startsWith('token='),
    );
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
  });

  it('POST /api/auth/register rejects duplicate user', async () => {
    await registerAndGetAgent({ username: 'dupe', email: 'dupe@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dupe2', email: 'dupe@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('POST /api/auth/register returns validation errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('POST /api/auth/login authenticates and sets httpOnly cookie', async () => {
    await registerAndGetAgent({ username: 'loginuser', email: 'login@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('login@example.com');
    const cookies = res.headers['set-cookie'];
    const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((cookie: string) =>
      cookie.startsWith('token='),
    );
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
  });

  it('POST /api/auth/login rejects wrong password', async () => {
    await registerAndGetAgent({ username: 'wrongpass', email: 'wrongpass@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'badpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('POST /api/auth/login returns validation errors for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('GET /api/auth/me returns current authenticated user', async () => {
    const agent = await registerAndGetAgent({ username: 'meuser', email: 'me@example.com' });

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ username: 'meuser', email: 'me@example.com' });
  });

  it('GET /api/auth/me rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  it('POST /api/auth/logout clears cookie', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'logout', email: 'logout@example.com', password: 'password123' });
    const loggedInAgent = await loginAndGetAgent('logout@example.com', 'password123');

    const res = await loggedInAgent.post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cookies = res.headers['set-cookie'];
    const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((cookie: string) =>
      cookie.startsWith('token='),
    );
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('Expires=Thu, 01 Jan 1970');
  });
});
