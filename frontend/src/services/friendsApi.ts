import { api } from './api';

export interface FriendUser {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
}

export interface FriendRequest {
  requestId: string;
  user: FriendUser;
  createdAt: string;
}

export interface FriendsListResult {
  friends: FriendUser[];
}

export interface BlockedUsersResult {
  blocked: FriendUser[];
}

export interface FriendRequestsResult {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface FriendActionMessage {
  message: string;
}

export interface FriendRequestCreated extends FriendActionMessage {
  request: unknown;
}

export interface FriendshipResult {
  friendship: unknown;
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

export async function getBlockedUsers() {
  const res = await api.get<{ status: string; data: BlockedUsersResult }>('/friends/blocked');
  return res.data;
}

export async function sendFriendRequest(username: string) {
  const res = await api.post<{ status: string; data: FriendRequestCreated }>('/friends/request', { username });
  return res.data;
}

export async function acceptFriendRequest(requestId: string) {
  const res = await api.put<{ status: string; data: FriendshipResult }>(`/friends/${requestId}/accept`);
  return res.data;
}

export async function rejectFriendRequest(requestId: string) {
  const res = await api.put<{ status: string; data: FriendActionMessage }>(`/friends/${requestId}/reject`);
  return res.data;
}

export async function removeFriend(friendId: string) {
  const res = await api.delete<{ status: string; data: FriendActionMessage }>(`/friends/${friendId}`);
  return res.data;
}

export async function blockUser(userId: string) {
  const res = await api.post<{ status: string; data: FriendshipResult }>(`/friends/${userId}/block`);
  return res.data;
}

export async function unblockUser(userId: string) {
  const res = await api.delete<{ status: string; data: { message: string } }>(`/friends/${userId}/unblock`);
  return res.data;
}

export async function searchUsers(query: string) {
  const res = await api.get<{ status: string; data: SearchUsersResult }>('/friends/search', { params: { q: query } });
  return res.data;
}
