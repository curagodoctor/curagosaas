'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReviewRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? '/api/doctor/gmb/requests'
        : `/api/doctor/gmb/requests?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests);
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load review requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-blue-100 text-blue-700',
      delivered: 'bg-blue-100 text-blue-700',
      clicked: 'bg-purple-100 text-purple-700',
      intercepted: 'bg-orange-100 text-orange-700',
      reviewed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/dashboard/gmb" className="hover:text-[#096b17]">GMB</Link>
            <span>/</span>
            <span>Review Requests</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Review Requests</h1>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            <p className="text-sm text-gray-500">Total Sent</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.clicked || 0}</p>
            <p className="text-sm text-gray-500">Clicked</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-2xl font-bold text-green-600">{stats.reviewed || 0}</p>
            <p className="text-sm text-gray-500">Reviewed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-2xl font-bold text-orange-600">{stats.intercepted || 0}</p>
            <p className="text-sm text-gray-500">Intercepted</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'sent', 'clicked', 'intercepted', 'reviewed', 'failed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-[#096b17] text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-4xl text-[#096b17]">&#9696;</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No review requests yet</h3>
          <p className="text-gray-500">Review requests are sent automatically after confirmed bookings.</p>
        </div>
      )}

      {/* Requests List */}
      {!loading && requests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{req.patientName}</p>
                        <p className="text-sm text-gray-500">{req.patientPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm text-gray-700">{req.channel}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                      {req.clickCount > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({req.clickCount} click{req.clickCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {req.interceptorRating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-medium text-gray-700">{req.interceptorRating}</span>
                          {req.redirectedToGoogle && (
                            <span className="ml-1 text-xs text-green-600">→ Google</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(req.sentAt || req.scheduledAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feedback List (for intercepted low ratings) */}
      {!loading && requests.some(r => r.interceptorFeedback) && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Feedback</h2>
          <div className="space-y-4">
            {requests
              .filter(r => r.interceptorFeedback)
              .map(req => (
                <div key={req._id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{req.patientName}</p>
                      <p className="text-sm text-gray-500">{formatDate(req.interceptedAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-medium text-gray-700">{req.interceptorRating}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{req.interceptorFeedback}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
