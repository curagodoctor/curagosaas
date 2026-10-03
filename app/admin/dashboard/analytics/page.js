'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [filterPage, setFilterPage] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filterMode !== 'all') params.append('mode', filterMode);
      if (filterPage !== 'all') params.append('pageSlug', filterPage);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(`/api/admin/analytics/slot-views?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setAnalytics(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  }, [filterMode, filterPage, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilterMode('all');
    setFilterPage('all');
    setDateRange({ startDate: '', endDate: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#5E6B5F]">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#5E6B5F]">No analytics data available</div>
      </div>
    );
  }

  const { stats, breakdown, views } = analytics;

  const hasActiveFilters = filterMode !== 'all' || filterPage !== 'all' || dateRange.startDate || dateRange.endDate;

  return (
    <div className="space-y-6">
      {/* Header with Filter Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#101A13]">Slot View Analytics</h1>
          <p className="text-[#5E6B5F] mt-1">Track users who viewed available slots</p>
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DDE4D9] rounded-lg hover:bg-[#F7F9F5] transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 text-[#5E6B5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium text-[#101A13]">Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-[#096B17]/10 text-[#096B17] text-xs font-semibold rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#EDF1EB]">
              <h2 className="text-xl font-semibold text-[#101A13]">Filter Analytics</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-[#F7F9F5] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#5E6B5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-[#101A13] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#101A13] mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17]"
                  />
                </div>

                {/* Mode Filter */}
                <div>
                  <label className="block text-sm font-medium text-[#101A13] mb-1">Consultation Mode</label>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17]"
                  >
                    <option value="all">All Modes</option>
                    <option value="online">Online</option>
                    <option value="in-clinic">In-Clinic</option>
                  </select>
                </div>

                {/* Page Filter */}
                <div>
                  <label className="block text-sm font-medium text-[#101A13] mb-1">Page</label>
                  <select
                    value={filterPage}
                    onChange={(e) => setFilterPage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17]"
                  >
                    <option value="all">All Pages</option>
                    {breakdown.byPage.map((page) => (
                      <option key={page.slug} value={page.slug}>
                        {page.pageName || page.slug}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-[#EDF1EB] bg-[#F7F9F5]">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-[#5E6B5F] hover:text-[#101A13] bg-white border border-[#DDE4D9] rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-6 py-2 bg-[#F26A1B] text-white rounded-lg hover:bg-[#d85c14] transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          color="blue"
        />

        <StatCard
          title="Unique Users"
          value={stats.uniqueUsers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="green"
        />

        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="purple"
        />

        <StatCard
          title="Average Age"
          value={stats.avgAge}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          color="orange"
        />
      </div>

      {/* Mode Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#101A13] mb-4">Consultation Mode Distribution</h3>
          <div className="space-y-3">
            <ProgressBar
              label="Online"
              value={stats.onlineViews}
              total={stats.totalViews}
              color="blue"
            />
            <ProgressBar
              label="In-Clinic"
              value={stats.inClinicViews}
              total={stats.totalViews}
              color="green"
            />
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#101A13] mb-4">Gender Distribution</h3>
          <div className="space-y-3">
            {breakdown.byGender.map((item) => (
              <ProgressBar
                key={item.gender}
                label={item.gender}
                value={item.count}
                total={stats.totalViews}
                color="purple"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page Performance */}
      <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101A13] mb-4">Views by Page</h3>
        <div className="space-y-3">
          {breakdown.byPage.map((page) => (
            <div key={page.slug} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#101A13]">{page.pageName || page.slug}</span>
                  <span className="text-sm text-[#5E6B5F]">{page.count} views</span>
                </div>
                <div className="w-full bg-[#EDF1EB] rounded-full h-2">
                  <div
                    className="bg-[#096B17] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(page.count / stats.totalViews) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Referrers */}
      <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101A13] mb-4">Top Referrers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#EDF1EB]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Source</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#101A13]">Views</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#101A13]">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.byReferrer.map((item, idx) => (
                <tr key={idx} className="border-b border-[#EDF1EB] hover:bg-[#F7F9F5]">
                  <td className="py-3 px-4 text-sm text-[#101A13]">{item.referrer}</td>
                  <td className="py-3 px-4 text-sm text-[#5E6B5F] text-right">{item.count}</td>
                  <td className="py-3 px-4 text-sm text-[#5E6B5F] text-right">
                    {((item.count / stats.totalViews) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Slot Views */}
      <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101A13] mb-4">Recent Slot Views</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[#EDF1EB]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Age/Gender</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Mode</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Page</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#101A13]">Converted</th>
              </tr>
            </thead>
            <tbody>
              {views.slice(0, 50).map((view) => (
                <tr key={view._id} className="border-b border-[#EDF1EB] hover:bg-[#F7F9F5]">
                  <td className="py-3 px-4 text-sm text-[#101A13]">
                    {new Date(view.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#101A13]">{view.name}</td>
                  <td className="py-3 px-4 text-sm text-[#5E6B5F]">
                    <div>{view.email}</div>
                    <div className="text-xs">{view.whatsapp}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#5E6B5F]">
                    {view.age} / {view.gender}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      view.modeOfContact === 'online'
                        ? 'bg-[#096B17]/10 text-[#096B17]'
                        : 'bg-[#F26A1B]/10 text-[#F26A1B]'
                    }`}>
                      {view.modeOfContact === 'online' ? 'Online' : 'In-Clinic'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#5E6B5F]">{view.pageName || view.pageSlug}</td>
                  <td className="py-3 px-4">
                    {view.convertedToBooking ? (
                      <span className="text-[#096B17] text-xs font-medium">✓ Yes</span>
                    ) : (
                      <span className="text-[#5E6B5F] text-xs">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {views.length > 50 && (
          <p className="text-sm text-[#5E6B5F] mt-4 text-center">
            Showing 50 of {views.length} total views
          </p>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-[#096B17]',
    green: 'bg-[#096B17]',
    purple: 'bg-[#096B17]',
    orange: 'bg-[#F26A1B]',
  };

  return (
    <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#5E6B5F] mb-1">{title}</p>
          <p className="text-2xl font-semibold text-[#101A13]">{value}</p>
        </div>
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color = 'blue' }) {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

  const colorClasses = {
    blue: 'bg-[#096B17]',
    green: 'bg-[#096B17]',
    purple: 'bg-[#F26A1B]',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[#101A13]">{label}</span>
        <span className="text-sm text-[#5E6B5F]">{value} ({percentage}%)</span>
      </div>
      <div className="w-full bg-[#EDF1EB] rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
