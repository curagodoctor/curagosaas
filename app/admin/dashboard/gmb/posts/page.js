'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GmbPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? '/api/doctor/gmb/posts'
        : `/api/doctor/gmb/posts?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      setDeleting(postId);
      const res = await fetch(`/api/doctor/gmb/posts/${postId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setPosts(posts.filter(p => p._id !== postId));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      publishing: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      deleted: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPostTypeLabel = (type) => {
    const labels = {
      STANDARD: 'Update',
      EVENT: 'Event',
      OFFER: 'Offer',
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/dashboard/gmb" className="hover:text-[#096b17]">GMB</Link>
            <span>/</span>
            <span>Posts</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GMB Posts</h1>
        </div>
        <Link
          href="/admin/dashboard/gmb/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#096b17] text-white rounded-lg hover:bg-[#075212] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'draft', 'scheduled', 'published', 'failed'].map(status => (
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
      {!loading && posts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500 mb-4">Create your first GMB post to engage with patients.</p>
          <Link
            href="/admin/dashboard/gmb/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#096b17] text-white rounded-lg hover:bg-[#075212] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </Link>
        </div>
      )}

      {/* Posts List */}
      {!loading && posts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map(post => (
                  <tr key={post._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                        {post.mediaUrl && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Has media
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{getPostTypeLabel(post.postType)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(post.status)}
                      {post.lastError && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={post.lastError}>
                          {post.lastError}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(post.scheduledAt)}</span>
                      {post.publishedAt && (
                        <p className="text-xs text-green-600 mt-1">Published: {formatDate(post.publishedAt)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {['draft', 'scheduled'].includes(post.status) && (
                          <Link
                            href={`/admin/dashboard/gmb/posts/${post._id}`}
                            className="p-2 text-gray-400 hover:text-[#096b17] transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                        )}
                        {post.gmbPostUrl && (
                          <a
                            href={post.gmbPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View on Google"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(post._id)}
                          disabled={deleting === post._id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === post._id ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
