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

  it('should return empty blocked list initially', async () => {
    const res = await agent.get(`${friendsPath}/blocked`).expect(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.blocked).toEqual([]);
  });

  it('should send a friend request', async () => {
    const otherUser = await User.findById(otherUserId).orFail();
    const res = await agent
      .post(`${friendsPath}/request`)
      .send({ username: otherUser.username })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.message).toBe('Friend request sent');
    expect(res.body.data.request).toBeDefined();
  });

  it('should accept an incoming friend request and list the friend', async () => {
    const incomingAgent = await registerAndGetAgent({
      username: 'friends-incoming',
      email: 'friends-incoming@test.com',
      password: 'password123',
    });
    await User.findByIdAndUpdate(userId, { 'privacySettings.allowFriendRequests': true });

    const user = await User.findById(userId).orFail();
    await incomingAgent.post(`${friendsPath}/request`).send({ username: user.username }).expect(201);

    const requests = await agent.get(`${friendsPath}/requests`).expect(200);
    const requestId = requests.body.data.incoming[0].requestId;
    const accepted = await agent.put(`${friendsPath}/${requestId}/accept`).expect(200);

    expect(accepted.body.status).toBe('success');
    expect(accepted.body.data.friendship.status).toBe('accepted');

    const friends = await agent.get(friendsPath).expect(200);
    expect(friends.body.data.friends).toHaveLength(1);
    expect(friends.body.data.friends[0]._id).toBeDefined();
    expect(friends.body.data.friends[0].userId).toBe(friends.body.data.friends[0]._id);
  });

  it('should reject an incoming friend request', async () => {
    const incomingAgent = await registerAndGetAgent({
      username: 'friends-reject',
      email: 'friends-reject@test.com',
      password: 'password123',
    });
    await User.findByIdAndUpdate(userId, { 'privacySettings.allowFriendRequests': true });

    const user = await User.findById(userId).orFail();
    await incomingAgent.post(`${friendsPath}/request`).send({ username: user.username }).expect(201);

    const requests = await agent.get(`${friendsPath}/requests`).expect(200);
    const requestId = requests.body.data.incoming[0].requestId;
    await agent.put(`${friendsPath}/${requestId}/reject`).expect(200);

    const after = await agent.get(`${friendsPath}/requests`).expect(200);
    expect(after.body.data.incoming).toHaveLength(0);
  });

  it('should remove an accepted friend', async () => {
    await Friendship.create({ userId, friendId: otherUserId, status: 'accepted', acceptedAt: new Date() });

    await agent.delete(`${friendsPath}/${otherUserId}`).expect(200);

    const friends = await agent.get(friendsPath).expect(200);
    expect(friends.body.data.friends).toEqual([]);
  });

  it('should block and unblock a user', async () => {
    await agent.post(`${friendsPath}/${otherUserId}/block`).expect(200);

    const blocked = await agent.get(`${friendsPath}/blocked`).expect(200);
    expect(blocked.body.data.blocked).toHaveLength(1);
    expect(blocked.body.data.blocked[0].userId).toBe(otherUserId);

    await agent.delete(`${friendsPath}/${otherUserId}/unblock`).expect(200);

    const after = await agent.get(`${friendsPath}/blocked`).expect(200);
    expect(after.body.data.blocked).toEqual([]);
  });

  it('should fail sending friend request without username', async () => {
    const res = await agent
      .post(`${friendsPath}/request`)
      .send({})
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
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
