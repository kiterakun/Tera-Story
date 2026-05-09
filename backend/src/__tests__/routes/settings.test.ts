import request from 'supertest';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';

describe('Settings routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  describe('GET /api/settings', () => {
    it('auto-creates and returns default settings', async () => {
      const agent = await registerAndGetAgent({ username: 'settingsuser', email: 'settings@test.com' });

      const res = await agent.get('/api/settings');

      expect(res.status).toBe(200);
      expect(res.body.settings).toBeDefined();
      expect(res.body.settings.language).toBe('en');
      expect(res.body.settings.theme).toBe('dark');
      expect(res.body.settings.aiSettings).toBeDefined();
      expect(res.body.settings.writerAgent).toBeUndefined();
      expect(res.body.settings.aiSettings.writerAgent.provider).toBe('openai');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/settings');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/settings', () => {
    it('updates language', async () => {
      const agent = await registerAndGetAgent({ username: 'settings2', email: 'settings2@test.com' });

      const res = await agent
        .put('/api/settings')
        .send({ language: 'vi' });

      expect(res.status).toBe(200);
      expect(res.body.settings.language).toBe('vi');
    });

    it('updates theme', async () => {
      const agent = await registerAndGetAgent({ username: 'settings3', email: 'settings3@test.com' });

      const res = await agent
        .put('/api/settings')
        .send({ theme: 'light' });

      expect(res.status).toBe(200);
      expect(res.body.settings.theme).toBe('light');
    });

    it('updates both language and theme', async () => {
      const agent = await registerAndGetAgent({ username: 'settings4', email: 'settings4@test.com' });

      const res = await agent
        .put('/api/settings')
        .send({ language: 'vi', theme: 'light' });

      expect(res.status).toBe(200);
      expect(res.body.settings.language).toBe('vi');
      expect(res.body.settings.theme).toBe('light');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put('/api/settings')
        .send({ language: 'vi' });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/settings/ai', () => {
    it('updates AI provider settings', async () => {
      const agent = await registerAndGetAgent({ username: 'settingsai', email: 'settingsai@test.com' });

      const res = await agent
        .put('/api/settings/ai')
        .send({
          writerAgent: { provider: 'anthropic', model: 'claude-3-5-sonnet', apiKey: 'sk-ant-test1234' },
        });

      expect(res.status).toBe(200);
      expect(res.body.settings.aiSettings.writerAgent.provider).toBe('anthropic');
      expect(res.body.settings.aiSettings.writerAgent.model).toBe('claude-3-5-sonnet');
      // API key should be masked in response
      expect(res.body.settings.aiSettings.writerAgent.apiKey).toMatch(/sk-\*{4}/);
    });

    it('updates multiple AI agents at once', async () => {
      const agent = await registerAndGetAgent({ username: 'settingsai2', email: 'settingsai2@test.com' });

      const res = await agent
        .put('/api/settings/ai')
        .send({
          writerAgent: { provider: 'openai', model: 'gpt-4-turbo' },
          imageAgent: { provider: 'openai', model: 'dall-e-3' },
        });

      expect(res.status).toBe(200);
      expect(res.body.settings.aiSettings.writerAgent.model).toBe('gpt-4-turbo');
      expect(res.body.settings.aiSettings.imageAgent.model).toBe('dall-e-3');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put('/api/settings/ai')
        .send({
          writerAgent: { provider: 'openai', model: 'gpt-4o' },
        });

      expect(res.status).toBe(401);
    });
  });
});
