import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  ShieldCheck,
  MessageSquare,
  Check,
  X,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import type {
  Suggestion,
  SuggestionStats,
  SuggestionStatus,
  SuggestionType,
  Pagination,
} from '../types';

const TYPE_OPTIONS: { value: SuggestionType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'suggest_remove', label: 'Suggest Remove' },
  { value: 'suggest_verify', label: 'Suggest Verify' },
  { value: 'comment', label: 'Comments' },
];

const STATUS_OPTIONS: { value: SuggestionStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resolved', label: 'Resolved' },
];

const getTypeIcon = (type: SuggestionType) => {
  switch (type) {
    case 'suggest_remove':
      return <Flag className="w-4 h-4 text-red-500" />;
    case 'suggest_verify':
      return <ShieldCheck className="w-4 h-4 text-green-500" />;
    case 'comment':
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
  }
};

const getTypeLabel = (type: SuggestionType) => {
  switch (type) {
    case 'suggest_remove':
      return 'Remove';
    case 'suggest_verify':
      return 'Verify';
    case 'comment':
      return 'Comment';
  }
};

const getStatusBadge = (status: SuggestionStatus) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Resolved
        </span>
      );
  }
};

export function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<SuggestionStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<SuggestionType | ''>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSuggestions = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getSuggestions(
        page,
        20,
        statusFilter || undefined,
        typeFilter || undefined
      );
      setSuggestions(data.suggestions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminApi.getSuggestionStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchStats();
  }, [statusFilter, typeFilter]);

  const handleUpdateStatus = async (
    suggestion: Suggestion,
    newStatus: SuggestionStatus
  ) => {
    setActionLoading(suggestion.id);
    try {
      await adminApi.updateSuggestion(suggestion.id, { status: newStatus });
      await fetchSuggestions(pagination?.page || 1);
      await fetchStats();
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyAttraction = async (suggestion: Suggestion) => {
    setActionLoading(suggestion.id);
    try {
      await adminApi.setAttractionVerified(suggestion.attractionId, true);
      await adminApi.updateSuggestion(suggestion.id, { status: 'approved' });
      await fetchSuggestions(pagination?.page || 1);
      await fetchStats();
    } catch (error) {
      console.error('Failed to verify attraction:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSuggestion = async (suggestion: Suggestion) => {
    if (
      !confirm(
        `Are you sure you want to delete this suggestion? This action cannot be undone.`
      )
    ) {
      return;
    }
    setActionLoading(suggestion.id);
    try {
      await adminApi.deleteSuggestion(suggestion.id);
      await fetchSuggestions(pagination?.page || 1);
      await fetchStats();
    } catch (error) {
      console.error('Failed to delete suggestion:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SuggestionStatus | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as SuggestionType | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-amber-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-red-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-blue-600">Resolved</p>
            <p className="text-2xl font-bold text-blue-600">{stats.resolved}</p>
          </div>
        </div>
      )}

      {/* Suggestions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Attraction
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                  </td>
                </tr>
              ) : suggestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No suggestions found
                  </td>
                </tr>
              ) : (
                suggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {suggestion.user.name}
                        </p>
                        <p className="text-sm text-gray-500">{suggestion.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {suggestion.attraction.name}
                          {suggestion.attraction.isVerified && (
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {suggestion.attraction.city}, {suggestion.attraction.country}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(suggestion.type)}
                        <span className="text-sm font-medium">
                          {getTypeLabel(suggestion.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(suggestion.status)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {suggestion.comment || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {suggestion.status === 'pending' && (
                          <>
                            {suggestion.type === 'suggest_verify' &&
                              !suggestion.attraction.isVerified && (
                                <button
                                  onClick={() => handleVerifyAttraction(suggestion)}
                                  disabled={actionLoading === suggestion.id}
                                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                  Verify
                                </button>
                              )}
                            <button
                              onClick={() =>
                                handleUpdateStatus(suggestion, 'approved')
                              }
                              disabled={actionLoading === suggestion.id}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(suggestion, 'rejected')
                              }
                              disabled={actionLoading === suggestion.id}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteSuggestion(suggestion)}
                          disabled={actionLoading === suggestion.id}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
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
              {pagination.total} suggestions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSuggestions(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchSuggestions(pagination.page + 1)}
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
