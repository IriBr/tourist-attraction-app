import { useEffect, useState } from 'react';
import {
  Search,
  Crown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import type { User, Pagination } from '../types';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(page, 20, search || undefined);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleSubscription = async (user: User) => {
    setActionLoading(user.id);
    try {
      const newTier = user.subscriptionTier === 'premium' ? 'free' : 'premium';
      await adminApi.updateUserSubscription(user.id, newTier);
      await fetchUsers(pagination?.page || 1);
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user: User) => {
    if (!confirm(`Are you sure you want to ${user.role === 'admin' ? 'remove admin access from' : 'grant admin access to'} ${user.name}?`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await adminApi.updateUserRole(user.id, newRole);
      await fetchUsers(pagination?.page || 1);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      await adminApi.deleteUser(user.id);
      await fetchUsers(pagination?.page || 1);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <form onSubmit={handleSearch} className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full sm:w-64"
          />
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <Shield size={12} />
                        ) : (
                          <UserIcon size={12} />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.subscriptionTier === 'premium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.subscriptionTier === 'premium' && <Crown size={12} />}
                        {user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        <p>{user._count?.reviews || 0} reviews</p>
                        <p>{user._count?.visits || 0} visits</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleSubscription(user)}
                          disabled={actionLoading === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.subscriptionTier === 'premium'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          } disabled:opacity-50`}
                        >
                          {user.subscriptionTier === 'premium'
                            ? 'Downgrade'
                            : 'Upgrade'}
                        </button>
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={actionLoading === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.role === 'admin'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          } disabled:opacity-50`}
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
