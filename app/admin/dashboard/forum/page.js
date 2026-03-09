'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function ForumPage() {
  const { showAlert, showConfirm } = useModal();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [stats, setStats] = useState({ pending: 0, replied: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'symptoms', label: 'Symptoms' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'diet', label: 'Diet' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, searchTerm, filterStatus, filterCategory]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/forum', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        window.location.href = '/admin';
        return;
      }
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
        setStats(data.stats);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.name?.toLowerCase().includes(search) ||
          post.email?.toLowerCase().includes(search) ||
          post.query?.toLowerCase().includes(search)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((post) => post.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((post) => post.category === filterCategory);
    }

    setFilteredPosts(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      replied: { bg: 'bg-green-100', text: 'text-green-800', label: 'Replied' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      symptoms: 'bg-red-100 text-red-800',
      treatment: 'bg-green-100 text-green-800',
      diet: 'bg-yellow-100 text-yellow-800',
      lifestyle: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[category] || colors.general}`}>
        {category}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      await showAlert({
        title: 'Error',
        message: 'Please enter a reply message',
        type: 'error'
      });
      return;
    }

    setReplying(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/forum/${selectedPost._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reply',
          reply: replyText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await showAlert({
          title: 'Success',
          message: 'Reply sent successfully!',
          type: 'success'
        });
        setReplyText('');
        setSelectedPost(data.post);
        fetchPosts();
      } else {
        await showAlert({
          title: 'Error',
          message: data.error || 'Failed to send reply',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      await showAlert({
        title: 'Error',
        message: 'Failed to send reply',
        type: 'error'
      });
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/forum/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPosts();
        if (selectedPost?._id === postId) {
          setSelectedPost(data.post);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleVisibilityToggle = async (postId, isPublic) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/forum/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPosts();
        if (selectedPost?._id === postId) {
          setSelectedPost(data.post);
        }
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const handleDelete = async (postId) => {
    const confirmed = await showConfirm({
      title: 'Delete Post',
      message: 'Are you sure you want to delete this forum post? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/forum/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        await showAlert({
          title: 'Success',
          message: 'Post deleted successfully!',
          type: 'success'
        });
        setSelectedPost(null);
        fetchPosts();
      } else {
        await showAlert({
          title: 'Error',
          message: data.error || 'Failed to delete post',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      await showAlert({
        title: 'Error',
        message: 'Failed to delete post',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading forum posts...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Forum Management</h1>
        <p className="text-gray-600 mt-2">View and respond to user queries</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Posts</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{posts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Replied</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.replied}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Closed</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.closed}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or query..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterCategory('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Posts Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No forum posts found
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{post.name}</div>
                      <div className="text-sm text-gray-500">{post.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{post.query}</div>
                      {post.replies?.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(post.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View & Reply
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Posts Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No forum posts found
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  {getCategoryBadge(post.category)}
                  {getStatusBadge(post.status)}
                </div>
                <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="text-sm font-semibold text-gray-900">{post.name}</div>
                <div className="text-xs text-gray-600">{post.email}</div>
                <div className="text-sm text-gray-800 line-clamp-2">{post.query}</div>
                {post.replies?.length > 0 && (
                  <div className="text-xs text-green-600">
                    {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPost(post)}
                  className="flex-1 text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View & Reply
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-800">Forum Post Details</h2>
                <button
                  onClick={() => {
                    setSelectedPost(null);
                    setReplyText('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Category */}
              <div className="flex flex-wrap gap-3">
                {getStatusBadge(selectedPost.status)}
                {getCategoryBadge(selectedPost.category)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedPost.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedPost.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              {/* User Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-medium text-gray-900">{selectedPost.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium text-gray-900">{selectedPost.email}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">Submitted On</div>
                    <div className="font-medium text-gray-900">{formatDate(selectedPost.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Query */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Query</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedPost.query}</p>
                </div>
              </div>

              {/* Existing Replies */}
              {selectedPost.replies && selectedPost.replies.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Replies</h3>
                  <div className="space-y-3">
                    {selectedPost.replies.map((reply, idx) => (
                      <div key={idx} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                        <p className="text-gray-800 whitespace-pre-wrap">{reply.message}</p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium text-green-700">{reply.repliedBy}</span>
                          <span>•</span>
                          <span>{formatDate(reply.repliedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Send Reply</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type your reply here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleReply}
                  disabled={replying}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {replying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex flex-wrap gap-4">
                  {/* Status Change */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Change Status</label>
                    <select
                      value={selectedPost.status}
                      onChange={(e) => handleStatusChange(selectedPost._id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="replied">Replied</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                    <button
                      onClick={() => handleVisibilityToggle(selectedPost._id, !selectedPost.isPublic)}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedPost.isPublic
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {selectedPost.isPublic ? 'Make Private' : 'Make Public'}
                    </button>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(selectedPost._id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
