import { useState, useEffect } from 'react';
import { useFriends } from '../hooks/useFriends';
import { showSuccess, showError } from '../lib/toast';
import type { FriendUser, FriendRequest } from '../services/friendsApi';
import { LevelBadge } from '../components/progression/LevelBadge';
import { UserPlus, UserCheck, UserX, ShieldBan, Search, Clock, Ban } from 'lucide-react';

type Tab = 'friends' | 'requests' | 'blocked';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function FriendCard({
  user,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  destructive,
}: {
  user: FriendUser;
  action: () => void;
  actionLabel: string;
  actionIcon: React.FC<{ size?: number }>;
  destructive?: boolean;
}) {
  const initial = user.displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-3 hover:border-ink-600 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-700 text-sm font-bold text-ink-300">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100 truncate">{user.displayName}</p>
        <p className="text-xs text-ink-500">@{user.username}</p>
      </div>
      <LevelBadge level={user.level} size="sm" />
      <button
        onClick={action}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
          destructive
            ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
            : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
        }`}
      >
        <ActionIcon size={14} />
        {actionLabel}
      </button>
    </div>
  );
}

function RequestCard({
  request,
  isIncoming,
  onAccept,
  onReject,
}: {
  request: FriendRequest;
  isIncoming: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const user = isIncoming ? request.from : request.to;
  const initial = user.displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-3 hover:border-ink-600 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-700 text-sm font-bold text-ink-300">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100 truncate">{user.displayName}</p>
        <p className="text-xs text-ink-500">
          {isIncoming ? 'Muốn kết bạn với bạn' : 'Đã gửi lời mời'}
        </p>
      </div>
      <LevelBadge level={user.level} size="sm" />
      <div className="flex items-center gap-1.5 shrink-0">
        {isIncoming && (
          <button
            onClick={onAccept}
            className="flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-gold/80 transition-colors"
          >
            <UserCheck size={14} />
            Chấp nhận
          </button>
        )}
        <button
          onClick={onReject}
          className="flex items-center gap-1 rounded-lg border border-ink-600 px-2.5 py-1.5 text-xs text-ink-400 hover:bg-ink-800 transition-colors"
        >
          <UserX size={14} />
          {isIncoming ? 'Từ chối' : 'Hủy'}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-ink-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-ink-700" />
        <div className="h-2 w-16 rounded bg-ink-700" />
      </div>
      <div className="h-6 w-6 rounded-full bg-ink-700" />
      <div className="h-7 w-20 rounded-lg bg-ink-700" />
    </div>
  );
}

export default function FriendsPage() {
  const {
    friends,
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
    searchUsers,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const run = async () => {
      if (debouncedQuery.trim()) {
        await searchUsers(debouncedQuery);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    };
    run();
  }, [debouncedQuery, searchUsers]);

  const handleSendRequest = async (username: string) => {
    try {
      await sendRequest(username);
      showSuccess('Đã gửi lời mời kết bạn!');
      setSearchQuery('');
      setShowDropdown(false);
    } catch {
      showError('Không thể gửi lời mời');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      showSuccess('Đã chấp nhận lời mời!');
    } catch {
      showError('Không thể chấp nhận lời mời');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
      showSuccess('Đã từ chối lời mời');
    } catch {
      showError('Không thể từ chối lời mời');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      showSuccess('Đã hủy kết bạn');
    } catch {
      showError('Không thể hủy kết bạn');
    }
  };



  const tabs = [
    { id: 'friends' as Tab, label: 'Bạn bè', count: friends.length },
    { id: 'requests' as Tab, label: 'Lời mời kết bạn', count: requests.incoming.length },
    { id: 'blocked' as Tab, label: 'Đã chặn', icon: ShieldBan },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-ink-100 mb-6">Bạn bè</h1>

      {/* Search */}
      <div className="relative mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm người chơi..."
            className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2.5 pl-10 pr-4 text-sm text-ink-100 placeholder:text-ink-500 focus:border-gold/50 focus:ring-1 focus:ring-gold/30 outline-none transition-all"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          )}
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-ink-700 bg-ink-900 shadow-2xl overflow-hidden">
            {searchResults.length === 0 && !isSearching ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-ink-500">Không tìm thấy người chơi nào</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink-800 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-ink-300">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      user.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-100 truncate">{user.displayName}</p>
                    <p className="text-xs text-ink-500">@{user.username}</p>
                  </div>
                  <LevelBadge level={user.level} size="sm" />
                  <button
                    onClick={() => handleSendRequest(user.username)}
                    className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-gold/80 transition-colors shrink-0"
                  >
                    <UserPlus size={14} />
                    Kết bạn
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-ink-900 p-1 mb-4 border border-ink-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-ink-800 text-ink-100'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-ink-700 text-ink-300' : 'bg-ink-800 text-ink-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={fetchFriends}
            className="rounded-lg bg-ink-800 px-5 py-2 text-sm text-ink-300 hover:bg-ink-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeTab === 'friends' ? (
        friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserPlus size={40} className="text-ink-600 mb-3" />
            <p className="text-sm text-ink-400">Chưa có bạn bè. Tìm kiếm để kết bạn!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <FriendCard
                key={friend._id}
                user={friend}
                action={() => handleRemoveFriend(friend._id)}
                actionLabel="Hủy kết bạn"
                actionIcon={UserX}
                destructive
              />
            ))}
          </div>
        )
      ) : activeTab === 'requests' ? (
        requests.incoming.length === 0 && requests.outgoing.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock size={40} className="text-ink-600 mb-3" />
            <p className="text-sm text-ink-400">Chưa có lời mời kết bạn nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.incoming.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wider">
                  Đến ({requests.incoming.length})
                </p>
                <div className="space-y-2">
                  {requests.incoming.map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      isIncoming
                      onAccept={() => handleAccept(req._id)}
                      onReject={() => handleReject(req._id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {requests.outgoing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wider">
                  Đã gửi ({requests.outgoing.length})
                </p>
                <div className="space-y-2">
                  {requests.outgoing.map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      isIncoming={false}
                      onAccept={() => {}}
                      onReject={() => handleReject(req._id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : activeTab === 'blocked' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ban size={40} className="text-ink-600 mb-3" />
          <p className="text-sm text-ink-400">Chưa chặn người dùng nào</p>
        </div>
      ) : null}
    </div>
  );
}
