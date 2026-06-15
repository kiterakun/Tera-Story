import mongoose from 'mongoose';
import { Friendship } from '../models/Friendship';
import { User } from '../models/User';

const MAX_FRIENDS = 200;

interface BasicUserInfo {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
}

interface FriendRequestInfo {
  requestId: string;
  user: BasicUserInfo;
  createdAt: Date;
}

interface FriendRequestsResult {
  incoming: FriendRequestInfo[];
  outgoing: FriendRequestInfo[];
}

type BasicUserSource = {
  _id: mongoose.Types.ObjectId | string;
  username: string;
  displayName?: string;
  avatar?: string;
  level?: number;
};

function isBasicUserSource(value: unknown): value is BasicUserSource {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as { _id?: unknown; username?: unknown };
  return candidate._id !== undefined && typeof candidate.username === 'string';
}

function userToBasicInfo(user: BasicUserSource): BasicUserInfo {
  const id = user._id.toString();
  return {
    _id: id,
    userId: id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar,
    level: user.level ?? 1,
  };
}

function friendshipPairQuery(userId: string, targetUserId: string) {
  return {
    $or: [
      { userId, friendId: targetUserId },
      { userId: targetUserId, friendId: userId },
    ],
  };
}

async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ userId }, { friendId: userId }],
  })
    .select('userId friendId')
    .lean();

  return friendships.map((friendship) => {
    const requesterId = friendship.userId.toString();
    const recipientId = friendship.friendId.toString();
    return requesterId === userId ? recipientId : requesterId;
  });
}

export async function getFriendsList(userId: string): Promise<BasicUserInfo[]> {
  const friendIds = await getAcceptedFriendIds(userId);
  if (friendIds.length === 0) return [];

  const friends = await User.find({ _id: { $in: friendIds } })
    .select('username displayName avatar level')
    .sort({ username: 1 })
    .lean();

  return friends.map(userToBasicInfo);
}

export async function getBlockedUsers(userId: string): Promise<BasicUserInfo[]> {
  const blocked = await Friendship.find({ userId, status: 'blocked' })
    .select('friendId')
    .populate('friendId', 'username displayName avatar level')
    .sort({ updatedAt: -1 })
    .lean();

  return blocked.flatMap((entry) => {
    if (!isBasicUserSource(entry.friendId)) return [];
    return [userToBasicInfo(entry.friendId)];
  });
}

export async function getFriendRequests(userId: string): Promise<FriendRequestsResult> {
  const [incoming, outgoing] = await Promise.all([
    Friendship.find({ friendId: userId, status: 'pending' })
      .select('userId createdAt')
      .populate('userId', 'username displayName avatar level')
      .lean(),
    Friendship.find({ userId, status: 'pending' })
      .select('friendId createdAt')
      .populate('friendId', 'username displayName avatar level')
      .lean(),
  ]);

  const incomingRequests = incoming.flatMap((request) => {
    if (!isBasicUserSource(request.userId)) return [];
    return [{
      requestId: request._id.toString(),
      user: userToBasicInfo(request.userId),
      createdAt: request.createdAt,
    }];
  });

  const outgoingRequests = outgoing.flatMap((request) => {
    if (!isBasicUserSource(request.friendId)) return [];
    return [{
      requestId: request._id.toString(),
      user: userToBasicInfo(request.friendId),
      createdAt: request.createdAt,
    }];
  });

  return {
    incoming: incomingRequests,
    outgoing: outgoingRequests,
  };
}

export async function sendFriendRequest(userId: string, targetUsername: string) {
  const username = targetUsername.trim();
  if (!username) throw new Error('Username is required');

  const target = await User.findOne({ username })
    .select('_id username privacySettings')
    .lean();
  if (!target) throw new Error('User not found');

  const targetId = target._id.toString();
  if (targetId === userId) throw new Error('Cannot friend yourself');
  if (!target.privacySettings?.allowFriendRequests) {
    throw new Error('User does not allow friend requests');
  }

  const [friendCount, existing] = await Promise.all([
    Friendship.countDocuments({ status: 'accepted', $or: [{ userId }, { friendId: userId }] }),
    Friendship.findOne(friendshipPairQuery(userId, targetId)).lean(),
  ]);

  if (friendCount >= MAX_FRIENDS) throw new Error('Friend limit reached');
  if (existing?.status === 'accepted' || existing?.status === 'pending') {
    throw new Error('Friendship already exists');
  }
  if (existing?.status === 'blocked') throw new Error('Cannot send friend request');

  return Friendship.create({ userId, friendId: targetId, status: 'pending' });
}

export async function acceptFriendRequest(userId: string, requestId: string) {
  const friendCount = await Friendship.countDocuments({
    status: 'accepted',
    $or: [{ userId }, { friendId: userId }],
  });
  if (friendCount >= MAX_FRIENDS) throw new Error('Friend limit reached');

  const request = await Friendship.findOneAndUpdate(
    { _id: requestId, friendId: userId, status: 'pending' },
    { $set: { status: 'accepted', acceptedAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  if (!request) throw new Error('Friend request not found');
  return request;
}

export async function rejectFriendRequest(userId: string, requestId: string): Promise<void> {
  const result = await Friendship.deleteOne({ _id: requestId, friendId: userId, status: 'pending' });
  if (result.deletedCount === 0) throw new Error('Friend request not found');
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const result = await Friendship.deleteOne({
    status: 'accepted',
    ...friendshipPairQuery(userId, friendId),
  });
  if (result.deletedCount === 0) throw new Error('Friendship not found');
}

export async function blockUser(userId: string, targetUserId: string) {
  if (targetUserId === userId) throw new Error('Cannot block yourself');

  const target = await User.findById(targetUserId).select('_id').lean();
  if (!target) throw new Error('User not found');

  return Friendship.findOneAndUpdate(
    { userId, friendId: targetUserId },
    { $set: { status: 'blocked' }, $unset: { acceptedAt: '' } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  ).lean();
}

export async function unblockUser(userId: string, targetUserId: string): Promise<void> {
  const result = await Friendship.deleteOne({ userId, friendId: targetUserId, status: 'blocked' });
  if (result.deletedCount === 0) throw new Error('Blocked user not found');
}

export async function searchUsers(userId: string, query: string): Promise<BasicUserInfo[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) throw new Error('Search query must be at least 3 characters');

  const existing = await Friendship.find(friendshipPairQuery(userId, userId))
    .select('userId friendId')
    .lean();

  const related = await Friendship.find({ $or: [{ userId }, { friendId: userId }] })
    .select('userId friendId')
    .lean();

  const excludedIds = new Set<string>([userId]);
  for (const friendship of [...existing, ...related]) {
    excludedIds.add(friendship.userId.toString());
    excludedIds.add(friendship.friendId.toString());
  }

  const users = await User.find({
    _id: { $nin: Array.from(excludedIds) },
    username: { $regex: normalizedQuery, $options: 'i' },
    'privacySettings.allowFriendRequests': true,
  })
    .select('username displayName avatar level')
    .sort({ username: 1 })
    .limit(20)
    .lean();

  return users.map(userToBasicInfo);
}

export { getAcceptedFriendIds };
