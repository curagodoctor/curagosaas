'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function GmbDashboard() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [gmbData, setGmbData] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Check for callback messages
  useEffect(() => {
    const connected = searchParams.get('connected');
    const business = searchParams.get('business');
    const errorParam = searchParams.get('error');

    if (connected === 'true' && business) {
      setSuccessMessage(`Successfully connected to ${decodeURIComponent(business)}!`);
      // Clear URL params
      window.history.replaceState({}, '', '/admin/dashboard/gmb');
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
      window.history.replaceState({}, '', '/admin/dashboard/gmb');
    }
  }, [searchParams]);

  // Fetch GMB data
  useEffect(() => {
    fetchGmbData();
  }, []);

  const fetchGmbData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/gmb');
      const data = await res.json();

      if (data.success) {
        setGmbData(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load GMB data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      const res = await fetch('/api/doctor/gmb/connect');
      const data = await res.json();

      if (data.success && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to initiate connection');
        setConnecting(false);
      }
    } catch (err) {
      setError('Failed to connect to GMB');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Business account?')) {
      return;
    }

    try {
      setDisconnecting(true);
      const res = await fetch('/api/doctor/gmb/disconnect', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setGmbData({ ...gmbData, connected: false, connections: [] });
        setSuccessMessage('GMB account disconnected successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDisconnectLocation = async (connectionId) => {
    if (!confirm('Are you sure you want to disconnect this location?')) {
      return;
    }

    try {
      setDisconnecting(true);
      const res = await fetch(`/api/doctor/gmb/disconnect?connectionId=${connectionId}`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        // Remove from local state
        const updatedConnections = gmbData.connections.filter(c => c.id !== connectionId);
        setGmbData({
          ...gmbData,
          connections: updatedConnections,
          connected: updatedConnections.length > 0,
        });
        setSuccessMessage('Location disconnected successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to disconnect location');
    } finally {
      setDisconnecting(false);
    }
  };

  const toggleFeature = async (feature, enabled) => {
    try {
      const res = await fetch('/api/doctor/gmb', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: { [feature]: enabled },
        }),
      });
      const data = await res.json();

      if (data.success) {
        setGmbData(prev => ({
          ...prev,
          connection: {
            ...prev.connection,
            features: data.features,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl text-[#096b17] mb-4">&#9696;</div>
          <p className="text-gray-600">Loading GMB data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Business Profile</h1>
        <p className="text-gray-600">Manage your Google Business Profile, posts, reviews, and more.</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-green-800">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Not Connected State */}
      {!gmbData?.connected && (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Connect Your Google Business Profile</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your Google Business Profile to manage posts, respond to reviews,
            track keywords, and automate review requests.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
                Connect Google Business
              </>
            )}
          </button>
        </div>
      )}

      {/* Connected State */}
      {gmbData?.connected && (
        <>
          {/* Connected Locations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Connected Locations ({gmbData.connections?.length || 1})
              </h2>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="text-[#096b17] hover:text-[#075212] text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Location
              </button>
            </div>

            <div className="grid gap-4">
              {(gmbData.connections || [gmbData.connection]).map((conn, index) => (
                <div key={conn.id || index} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        conn.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {conn.status === 'active' ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{conn.businessName}</h3>
                        <p className="text-sm text-gray-600">{conn.locationAddress}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {conn.businessPhone && (
                            <span>{conn.businessPhone}</span>
                          )}
                          {conn.businessCategory && (
                            <span>{conn.businessCategory}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnectLocation(conn.id)}
                      disabled={disconnecting}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                      title="Disconnect"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Posts Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Posts</h3>
                <Link href="/admin/dashboard/gmb/posts" className="text-[#096b17] text-sm hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{gmbData.stats?.posts?.published || 0}</p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{gmbData.stats?.posts?.scheduled || 0}</p>
                  <p className="text-sm text-gray-500">Scheduled</p>
                </div>
              </div>
            </div>

            {/* Reviews Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Reviews (30 days)</h3>
                <Link href="/admin/dashboard/gmb/reviews" className="text-[#096b17] text-sm hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{gmbData.stats?.reviews?.total || 0}</p>
                  <p className="text-sm text-gray-500">Total Reviews</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    {gmbData.stats?.reviews?.averageRating || '-'}
                    <span className="text-lg">★</span>
                  </p>
                  <p className="text-sm text-gray-500">Avg Rating</p>
                </div>
              </div>
            </div>

            {/* Review Requests Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Review Requests (30 days)</h3>
                <Link href="/admin/dashboard/gmb/requests" className="text-[#096b17] text-sm hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{gmbData.stats?.requests?.sent || 0}</p>
                  <p className="text-sm text-gray-500">Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{gmbData.stats?.requests?.reviewed || 0}</p>
                  <p className="text-sm text-gray-500">Converted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/dashboard/gmb/posts/new"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Create Post</span>
              </Link>

              <Link
                href="/admin/dashboard/gmb/reviews"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Manage Reviews</span>
              </Link>

              <Link
                href="/admin/dashboard/gmb/requests"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Review Requests</span>
              </Link>

              <Link
                href="/admin/dashboard/gmb/keywords"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Search Keywords</span>
              </Link>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Feature Settings</h3>
            <div className="space-y-4">
              {[
                { key: 'postAutomation', label: 'Post Automation', desc: 'Schedule and publish GMB posts' },
                { key: 'reviewRequest', label: 'Review Requests', desc: 'Send automated review requests after bookings' },
                { key: 'reviewInterceptor', label: 'Review Interceptor', desc: 'Pre-screen reviews before Google' },
                { key: 'reviewReply', label: 'Review Replies', desc: 'AI-powered review reply suggestions' },
                { key: 'faqManagement', label: 'FAQ Management', desc: 'Manage GMB Q&A section' },
                { key: 'keywordDashboard', label: 'Keyword Dashboard', desc: 'Track search keywords' },
              ].map(feature => (
                <div key={feature.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{feature.label}</p>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleFeature(feature.key, !gmbData.connection?.features?.[feature.key])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      gmbData.connection?.features?.[feature.key] ? 'bg-[#096b17]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        gmbData.connection?.features?.[feature.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
