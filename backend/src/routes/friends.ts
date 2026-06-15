import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logger } from '../utils/logger';
import {
  getFriendsList,
  getBlockedUsers,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  searchUsers,
} from '../services/socialService';

const router = Router();

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

const friendRequestBody = z.object({
  username: z.string().min(1).max(64),
});

const requestIdParam = z.object({
  requestId: z.string().min(1).max(64),
});

const friendIdParam = z.object({
  friendId: z.string().min(1).max(64),
});

const targetUserIdParam = z.object({
  targetUserId: z.string().min(1).max(64),
});

const searchQuerySchema = z.object({
  q: z.string().min(1).max(128),
});

router.use(authMiddleware);

// GET /api/friends - List accepted friends
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const friends = await getFriendsList(userId);
    res.json({ status: 'success', data: { friends } });
  } catch (err) {
    logger.error({ err }, 'List friends error:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/friends/blocked - List blocked users
router.get('/blocked', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const blocked = await getBlockedUsers(userId);
    res.json({ status: 'success', data: { blocked } });
  } catch (err) {
    logger.error({ err }, 'List blocked users error:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/friends/requests - Pending friend requests (incoming + outgoing)
router.get('/requests', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const requests = await getFriendRequests(userId);
    res.json({ status: 'success', data: requests });
  } catch (err) {
    logger.error({ err }, 'Get friend requests error:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/friends/request - Send friend request
router.post('/request', validate(friendRequestBody), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ status: 'error', message: 'Username is required' });
      return;
    }
    const result = await sendFriendRequest(userId, username);
    res.status(201).json({ status: 'success', data: { message: 'Friend request sent', request: result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = ['User not found', 'Cannot friend yourself', 'Friend limit reached', 'Friendship already exists', 'Cannot send friend request', 'User does not allow friend requests'].includes(message) ? 400 : 500;
    if (status === 500) {
      logger.error({ err }, 'Send friend request error:');
    }
    res.status(status).json({ status: 'error', message });
  }
});

// PUT /api/friends/:requestId/accept - Accept friend request
router.put('/:requestId/accept', validate(requestIdParam, 'params'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const requestId = routeParam(req.params.requestId);
    const result = await acceptFriendRequest(userId, requestId);
    res.json({ status: 'success', data: { friendship: result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Friend request not found' ? 404 : message === 'Friend limit reached' ? 400 : 500;
    if (status === 500) {
      logger.error({ err }, 'Accept friend request error:');
    }
    res.status(status).json({ status: 'error', message });
  }
});

// PUT /api/friends/:requestId/reject - Reject friend request
router.put('/:requestId/reject', validate(requestIdParam, 'params'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const requestId = routeParam(req.params.requestId);
    await rejectFriendRequest(userId, requestId);
    res.json({ status: 'success', data: { message: 'Friend request rejected' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Friend request not found' ? 404 : 500;
    if (status === 500) {
      logger.error({ err }, 'Reject friend request error:');
    }
    res.status(status).json({ status: 'error', message });
  }
});

// DELETE /api/friends/:friendId - Remove friend
router.delete('/:friendId', validate(friendIdParam, 'params'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const friendId = routeParam(req.params.friendId);
    await removeFriend(userId, friendId);
    res.json({ status: 'success', data: { message: 'Friend removed' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Friendship not found' ? 404 : 500;
    if (status === 500) {
      logger.error({ err }, 'Remove friend error:');
    }
    res.status(status).json({ status: 'error', message });
  }
});

// POST /api/friends/:userId/block - Block user
router.post('/:targetUserId/block', validate(targetUserIdParam, 'params'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const targetUserId = routeParam(req.params.targetUserId);
    const result = await blockUser(userId, targetUserId);
    res.json({ status: 'success', data: { friendship: result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Cannot block yourself' || message === 'User not found' ? 400 : 500;
    if (status === 500) {
      logger.error({ err }, 'Block user error:');
    }
    res.status(status).json({ status: 'error', message });
  }
});

// DELETE /api/friends/:userId/unblock - Unblock user
router.delete('/:targetUserId/unblock', validate(targetUserIdParam, 'params'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const targetUserId = routeParam(req.params.targetUserId);
    await unblockUser(userId, targetUserId);
    res.json({ status: 'success', data: { message: 'User unblocked' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Blocked user not found' ? 404 : 500;
    if (status === 500) {
      logger.error({ err }, 'Unblock user error:');
    }
    res.status(status).json({ status: 'error', message });
  }
});

// GET /api/friends/search?q= - Search users
router.get('/search', validate(searchQuerySchema, 'query'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ status: 'error', message: 'Search query is required' });
      return;
    }
    const users = await searchUsers(userId, query);
    res.json({ status: 'success', data: { users } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Search query must be at least 3 characters' ? 400 : 500;
    if (status === 500) {
      logger.error({ err }, 'Search users error:');
    }
    res.status(status).json({ status: 'error', message });
  }
});

export default router;
