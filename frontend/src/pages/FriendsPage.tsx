import { useState, useEffect, useRef } from 'react';
import { useFriends } from '../hooks/useFriends';
import { showSuccess, showError } from '../lib/toast';
import type { FriendUser, FriendRequest } from '../services/friendsApi';
import { LevelBadge } from '../components/progression/LevelBadge';
import { UserPlus, UserCheck, UserX, ShieldBan, Search, Clock, Ban } from 'lucide-react';
import { useTranslation } from '../i18n';

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
  primary,
}: {
  user: FriendUser;
  action: () => void;
  actionLabel: string;
  actionIcon: React.FC<{ size?: number }>;
  destructive?: boolean;
  primary?: boolean;
}) {
  const nameToUse = user.displayName || user.username || '?';
  const initial = nameToUse.charAt(0).toUpperCase();

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
        <p className="text-sm font-medium text-ink-100 truncate">{nameToUse}</p>
        <p className="text-xs text-ink-500">@{user.username}</p>
      </div>
      <LevelBadge level={user.level} size="sm" />
      <button
        onClick={action}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
          destructive
            ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
            : primary
            ? 'bg-accent-600 text-white hover:bg-accent-500 shadow-sm'
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
  const t = useTranslation();
  const user = request.user;
  const nameToUse = user.displayName || user.username || '?';
  const initial = nameToUse.charAt(0).toUpperCase();

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
        <p className="text-sm font-medium text-ink-100 truncate">{nameToUse}</p>
        <p className="text-xs text-ink-500">
          {isIncoming ? t.friends.wantsToFriend : t.friends.sentRequest}
        </p>
      </div>
      <LevelBadge level={user.level} size="sm" />
      <div className="flex items-center gap-1.5 shrink-0">
        {isIncoming && (
          <button
            onClick={onAccept}
            className="flex items-center gap-1 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-500 shadow-sm transition-colors"
          >
            <UserCheck size={14} />
            {t.friends.accept}
          </button>
        )}
        <button
          onClick={onReject}
          className="flex items-center gap-1 rounded-lg border border-ink-600 px-2.5 py-1.5 text-xs text-ink-400 hover:bg-ink-800 transition-colors"
        >
          <UserX size={14} />
          {isIncoming ? t.friends.reject : t.friends.cancel}
        </button>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const t = useTranslation();
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
  const prevDebouncedRef = useRef('');

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const run = async () => {
      // Query empty → clear results, keep dropdown open
      if (searchQuery.trim().length === 0) {
        searchUsers('');
        prevDebouncedRef.current = '';
        return;
      }
      // Debounce hasn't caught up yet
      if (debouncedQuery.trim().length < 3) {
        return;
      }
      // Skip duplicate searches for same query
      if (debouncedQuery === prevDebouncedRef.current) {
        return;
      }
      prevDebouncedRef.current = debouncedQuery;
      await searchUsers(debouncedQuery);
    };
    run();
  }, [debouncedQuery, searchQuery, searchUsers]);

  const handleSendRequest = async (username: string) => {
    try {
      await sendRequest(username);
      showSuccess(t.friends.requestSent);
      setSearchQuery('');
    } catch {
      showError(t.friends.failedToSend);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      showSuccess(t.friends.requestAccept);
    } catch {
      showError(t.friends.failedToAccept);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest(requestId);
      showSuccess(t.friends.requestReject);
    } catch {
      showError(t.friends.failedToReject);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      showSuccess(t.friends.unfriendSuccess);
    } catch {
      showError(t.friends.failedToRemove);
    }
  };

  const tabs = [
    { id: 'friends' as Tab, label: t.friends.title, count: friends.length },
    { id: 'requests' as Tab, label: t.friends.noRequests, count: requests.incoming.length },
    { id: 'blocked' as Tab, label: t.friends.blocked, icon: ShieldBan },
  ];

  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-ink-100 mb-6">{t.friends.title}</h1>

      {/* Search */}
      <div className="relative mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.friends.searchPlaceholder}
            className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2.5 pl-10 pr-4 text-sm text-ink-100 placeholder:text-ink-500 focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 outline-none transition-all"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {hasSearchQuery ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-100 uppercase tracking-wider">
              {t.friends.searchResults}
            </h2>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-medium text-ink-400 hover:text-ink-200"
            >
              {t.worldCreate.cancel}
            </button>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent mb-3" />
              <p className="text-sm text-ink-400">{t.friends.searching}</p>
            </div>
          ) : debouncedQuery.length < 3 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-ink-700 rounded-xl bg-ink-900/50">
              <Search size={40} className="text-ink-600 mb-3" />
              <p className="text-sm text-ink-400">{t.friends.minChars}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-ink-700 rounded-xl bg-ink-900/50">
              <UserX size={40} className="text-ink-600 mb-3" />
              <p className="text-sm text-ink-400">{t.friends.noPlayers}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <FriendCard
                  key={user._id}
                  user={user}
                  action={() => handleSendRequest(user.username)}
                  actionLabel={t.friends.addFriend}
                  actionIcon={UserPlus}
                  primary
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
                {t.gallery.retry}
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserPlus size={40} className="text-ink-600 mb-3" />
              <p className="text-sm text-ink-400">{t.friends.noFriends}</p>
              <div className="mt-4 h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
          ) : activeTab === 'friends' ? (
            friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <UserPlus size={40} className="text-ink-600 mb-3" />
                <p className="text-sm text-ink-400">{t.friends.noFriends}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <FriendCard
                    key={friend._id}
                    user={friend}
                    action={() => handleRemoveFriend(friend._id)}
                    actionLabel={t.friends.unfriend}
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
                <p className="text-sm text-ink-400">{t.friends.noRequests}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.incoming.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wider">
                      {t.friends.incoming} ({requests.incoming.length})
                    </p>
                    <div className="space-y-2">
                      {requests.incoming.map((req) => (
                        <RequestCard
                          key={req.requestId}
                          request={req}
                          isIncoming
                          onAccept={() => handleAccept(req.requestId)}
                          onReject={() => handleReject(req.requestId)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {requests.outgoing.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wider">
                      {t.friends.outgoing} ({requests.outgoing.length})
                    </p>
                    <div className="space-y-2">
                      {requests.outgoing.map((req) => (
                        <RequestCard
                          key={req.requestId}
                          request={req}
                          isIncoming={false}
                          onAccept={() => {}}
                          onReject={() => handleReject(req.requestId)}
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
              <p className="text-sm text-ink-400">{t.friends.noBlocked}</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
