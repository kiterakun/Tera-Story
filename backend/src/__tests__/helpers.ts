import request from 'supertest';
import { app } from '../index';

/**
 * Register a test user via the API and return a supertest agent
 * with the auth cookie automatically stored for subsequent requests.
 */
export async function registerAndGetAgent(userData?: {
  username?: string;
  email?: string;
  password?: string;
}) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({
    username: userData?.username || 'testuser',
    email: userData?.email || 'testuser@example.com',
    password: userData?.password || 'password123',
  });
  return agent;
}

/**
 * Login and get an agent with auth cookie.
 */
export async function loginAndGetAgent(
  email: string,
  password: string,
) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password });
  return agent;
}
