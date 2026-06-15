import { useState, useCallback, useEffect } from 'react';
import * as friendsApi from '../services/friendsApi';
import type { FriendUser, FriendRequest } from '../services/friendsApi';

export function useFriends() {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [friendsRes, requestsRes, blockedRes] = await Promise.all([
        friendsApi.getFriendsList(),
        friendsApi.getFriendRequests(),
        friendsApi.getBlockedUsers(),
      ]);
      setFriends(friendsRes.data.friends);
      setRequests(requestsRes.data);
      setBlockedUsers(blockedRes.data.blocked);
    } catch {
      setError('Không thể tải danh sách bạn bè');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = useCallback(async (username: string) => {
    try {
      await friendsApi.sendFriendRequest(username);
      await fetchFriends();
    } catch {
      throw new Error('Không thể gửi lời mời kết bạn');
    }
  }, [fetchFriends]);

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      await friendsApi.acceptFriendRequest(requestId);
      await fetchFriends();
    } catch {
      throw new Error('Không thể chấp nhận lời mời');
    }
  }, [fetchFriends]);

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      await friendsApi.rejectFriendRequest(requestId);
      await fetchFriends();
    } catch {
      throw new Error('Không thể từ chối lời mời');
    }
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      await friendsApi.removeFriend(friendId);
      await fetchFriends();
    } catch {
      throw new Error('Không thể hủy kết bạn');
    }
  }, [fetchFriends]);

  const blockUser = useCallback(async (userId: string) => {
    try {
      await friendsApi.blockUser(userId);
      await fetchFriends();
    } catch {
      throw new Error('Không thể chặn người dùng');
    }
  }, [fetchFriends]);

  const unblockUser = useCallback(async (userId: string) => {
    try {
      await friendsApi.unblockUser(userId);
      await fetchFriends();
    } catch {
      throw new Error('Không thể bỏ chặn người dùng');
    }
  }, [fetchFriends]);

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await friendsApi.searchUsers(query);
      setSearchResults(res.data.users);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    friends,
    blockedUsers,
    requests,
    searchResults,
    isLoading,
    isSearching,
    error,
    fetchFriends,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    unblockUser,
    searchUsers,
  };
}
