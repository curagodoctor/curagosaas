'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function BlogArticlesPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useModal();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // AI draft chatbox — context → AI draft → review in editor → publish.
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');
  const draftWithAi = async () => {
    if (!aiContext.trim() || aiBusy) return;
    setAiBusy(true); setAiErr('');
    try {
      const res = await fetch('/api/practice-os/actions/draft-blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ context: aiContext.trim() }),
      });
      const d = await res.json();
      if (d.success && d.id) {
        // Open the draft in the editor for review; the doctor publishes it there.
        router.push(`/admin/dashboard/blog-articles/${d.id}`);
      } else {
        setAiErr(d.error === 'PaymentRequired' ? 'This needs an active builder pack.' : (d.error || 'Could not draft the article.'));
      }
    } catch { setAiErr('Something went wrong.'); }
    finally { setAiBusy(false); }
  };

  useEffect(() => {
    fetchArticles();
  }, [filterStatus, filterCategory, pagination.page]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
      });

      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const response = await fetch(`/api/admin/blog-articles?${params}`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.articles) {
        setArticles(data.articles);
        setPagination(data.pagination);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = await showConfirm({
      title: 'Delete Article',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/blog-articles/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await showAlert({
          title: 'Success',
          message: 'Article deleted successfully!',
          type: 'success'
        });
        fetchArticles();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      await showAlert({
        title: 'Error',
        message: 'Failed to delete article',
        type: 'error'
      });
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
      archived: { bg: 'bg-red-100', text: 'text-red-800', label: 'Archived' },
    };
    const { bg, text, label } = config[status] || config.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading articles...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Blog Articles</h1>
          <p className="text-gray-600 mt-2">Manage your medical blog content</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAiDraft(true); setAiErr(''); }}
            className="bg-[#096b17] hover:bg-[#075512] text-white px-5 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            ✨ Draft with AI
          </button>
          <button
            onClick={() => router.push('/admin/dashboard/blog-articles/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Article
          </button>
        </div>
      </div>

      {/* AI draft chatbox — describe the article, AI writes a draft, you review before publishing */}
      {showAiDraft && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !aiBusy && setShowAiDraft(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-[#096b17] text-white grid place-items-center">✨</span>
              <h2 className="text-lg font-semibold text-gray-900">Draft a blog with AI</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Describe the topic and anything to include. The AI writes a draft — you review and edit it, then publish with one click. It won&apos;t go live until you publish.</p>
            <textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              rows={5}
              autoFocus
              placeholder="e.g. Write an article for patients about what to expect during a first gastroenterology consultation — preparation, questions to ask, and when to see a specialist."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#096b17] focus:border-transparent"
            />
            {aiErr && <p className="text-sm text-red-600 mt-2">{aiErr}</p>}
            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={() => setShowAiDraft(false)} disabled={aiBusy} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={draftWithAi} disabled={aiBusy || !aiContext.trim()} className="bg-[#096b17] hover:bg-[#075512] text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {aiBusy ? 'Drafting…' : 'Draft & review →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={filterCategory === 'all' ? '' : filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value === '' ? 'all' : e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              placeholder="All categories (type to filter)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {(filterStatus !== 'all' || filterCategory !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterCategory('all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Articles</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{pagination.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Published</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {articles.filter(a => a.status === 'published').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Drafts</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">
            {articles.filter(a => a.status === 'draft').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Views</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {articles.reduce((sum, a) => sum + (a.analytics?.views || 0), 0)}
          </div>
        </div>
      </div>

      {/* Articles Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No articles found. Create your first article!
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{article.title}</div>
                      <div className="text-sm text-gray-500 mt-1">/{article.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{article.category || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(article.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{article.analytics?.views || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(article.publishedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => router.push(`/admin/dashboard/blog-articles/${article._id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(article._id, article.title)}
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

      {/* Articles Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No articles found. Create your first article!
          </div>
        ) : (
          articles.map((article) => (
            <div key={article._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{article.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">/{article.slug}</div>
                </div>
                {getStatusBadge(article.status)}
              </div>

              <div className="space-y-2 mb-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-gray-900">{article.category || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span className="text-gray-900">{article.analytics?.views || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span className="text-gray-900">{formatDate(article.publishedAt)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/admin/dashboard/blog-articles/${article._id}`)}
                  className="flex-1 text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(article._id, article.title)}
                  className="flex-1 text-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
