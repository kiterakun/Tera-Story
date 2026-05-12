import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { Friendship } from '../../models/Friendship';

const friendsPath = '/api/friends';

describe('Friends routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await Friendship.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({
      username: 'friends-user',
      email: 'friends-user@test.com',
      password: 'password123',
    });
    await registerAndGetAgent({
      username: 'friends-other',
      email: 'friends-other@test.com',
      password: 'password123',
    });

    const user = await User.findOne({ email: 'friends-user@test.com' }).orFail();
    const other = await User.findOne({ email: 'friends-other@test.com' }).orFail();
    userId = String(user._id);
    otherUserId = String(other._id);

    // Enable friend requests for the other user (privacy default is off)
    await User.findByIdAndUpdate(other._id, { 'privacySettings.allowFriendRequests': true });
  });

  it('should return empty friend list initially', async () => {
    const res = await agent.get(friendsPath).expect(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.friends).toEqual([]);
  });

  it('should return empty friend requests initially', async () => {
    const res = await agent.get(`${friendsPath}/requests`).expect(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
  });

  it('should send a friend request', async () => {
    const otherUser = await User.findById(otherUserId).orFail();
    const res = await agent
      .post(`${friendsPath}/request`)
      .send({ username: otherUser.username })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.message).toBe('Friend request sent');
  });

  it('should fail sending friend request without username', async () => {
    const res = await agent
      .post(`${friendsPath}/request`)
      .send({})
      .expect(400);

    expect(res.body.status).toBe('error');
  });

  it('should not allow friending self', async () => {
    const user = await User.findById(userId).orFail();
    const res = await agent
      .post(`${friendsPath}/request`)
      .send({ username: user.username })
      .expect(400);

    expect(res.body.status).toBe('error');
  });

  it('should search users', async () => {
    const res = await agent
      .get(`${friendsPath}/search?q=friends`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
  });

  it('should require authentication', async () => {
    await request(app)
      .get(friendsPath)
      .expect(401);
  });
});
