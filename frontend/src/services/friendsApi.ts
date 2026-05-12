import { api } from './api';

export interface FriendUser {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
}

export interface FriendRequest {
  _id: string;
  from: FriendUser;
  to: FriendUser;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: string;
}

export interface FriendsListResult {
  friends: FriendUser[];
}

export interface FriendRequestsResult {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface SearchUsersResult {
  users: FriendUser[];
}

export async function getFriendsList() {
  const res = await api.get<{ status: string; data: FriendsListResult }>('/friends');
  return res.data;
}

export async function getFriendRequests() {
  const res = await api.get<{ status: string; data: FriendRequestsResult }>('/friends/requests');
  return res.data;
}

export async function sendFriendRequest(username: string) {
  const res = await api.post<{ status: string; data: { request: FriendRequest } }>('/friends/request', { username });
  return res.data;
}

export async function acceptFriendRequest(requestId: string) {
  const res = await api.put<{ status: string; data: { request: FriendRequest } }>(`/friends/${requestId}/accept`);
  return res.data;
}

export async function rejectFriendRequest(requestId: string) {
  const res = await api.put<{ status: string; data: { request: FriendRequest } }>(`/friends/${requestId}/reject`);
  return res.data;
}

export async function removeFriend(friendId: string) {
  const res = await api.delete<{ status: string; data: Record<string, never> }>(`/friends/${friendId}`);
  return res.data;
}

export async function blockUser(userId: string) {
  const res = await api.post<{ status: string; data: { blocked: FriendUser } }>(`/friends/block/${userId}`);
  return res.data;
}

export async function unblockUser(userId: string) {
  const res = await api.post<{ status: string; data: { unblocked: string } }>(`/friends/unblock/${userId}`);
  return res.data;
}

export async function searchUsers(query: string) {
  const res = await api.get<{ status: string; data: SearchUsersResult }>('/friends/search', { params: { q: query } });
  return res.data;
}
