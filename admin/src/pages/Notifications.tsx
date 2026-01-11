import { useEffect, useState } from 'react';
import { Bell, Send, Users, Crown, UserIcon, Search } from 'lucide-react';
import { notificationsApi, NotificationStats, SendNotificationRequest } from '../api/notifications';
import { adminApi } from '../api/admin';
import type { User } from '../types';

type TargetType = 'all' | 'premium' | 'free' | 'user';

export function NotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<TargetType>('all');
  const [selectedUserId, setSelectedUserId] = useState('');

  // User search for individual targeting
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await notificationsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearchLoading(true);
    try {
      const data = await adminApi.getUsers(1, 10, userSearch);
      setSearchResults(data.users);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setSearchResults([]);
    setUserSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!body.trim()) {
      setError('Message body is required');
      return;
    }
    if (target === 'user' && !selectedUserId) {
      setError('Please select a user');
      return;
    }

    setSending(true);
    try {
      const request: SendNotificationRequest = {
        title: title.trim(),
        body: body.trim(),
        target,
        userId: target === 'user' ? selectedUserId : undefined,
      };

      const response = await notificationsApi.sendNotification(request);
      setSuccess(response.data.message);

      // Reset form
      setTitle('');
      setBody('');
      setTarget('all');
      setSelectedUserId('');
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getTargetDescription = () => {
    if (!stats) return '';
    switch (target) {
      case 'all':
        return `Will be sent to ${stats.total} device(s)`;
      case 'premium':
        return `Will be sent to ${stats.premium} premium user device(s)`;
      case 'free':
        return `Will be sent to ${stats.free} free user device(s)`;
      case 'user':
        return selectedUser ? `Will be sent to ${selectedUser.name}` : 'Select a user';
      default:
        return '';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-pink-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">Send Notifications</h1>
      </div>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Crown className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Premium Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.premium}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserIcon className="text-gray-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Free Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.free}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Notification</h2>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1">{title.length}/100</p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{body.length}/500</p>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setTarget('all'); setSelectedUser(null); }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  target === 'all'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                All Users
              </button>
              <button
                type="button"
                onClick={() => { setTarget('premium'); setSelectedUser(null); }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  target === 'premium'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                Premium Only
              </button>
              <button
                type="button"
                onClick={() => { setTarget('free'); setSelectedUser(null); }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  target === 'free'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                Free Only
              </button>
              <button
                type="button"
                onClick={() => setTarget('user')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  target === 'user'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                }`}
              >
                Specific User
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">{getTargetDescription()}</p>
          </div>

          {/* User Search (shown when target is 'user') */}
          {target === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              {selectedUser ? (
                <div className="flex items-center justify-between p-3 bg-pink-50 border border-pink-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setSelectedUserId(''); }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchUsers())}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                    <button
                      type="button"
                      onClick={handleSearchUsers}
                      disabled={searchLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {searchLoading ? '...' : 'Search'}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={sending}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
