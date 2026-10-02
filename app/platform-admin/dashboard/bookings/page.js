'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Platform-admin booking view — DOCTOR ACTIVITY ONLY. Patient details (name, phone,
// email) are never fetched or shown here; they belong to the doctor and appear only
// on the doctor's own dashboard. We track how many bookings each doctor is getting.
export default function BookingsPage() {
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({ total: 0, activeDoctors: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });
  const [statuses, setStatuses] = useState([]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const response = await fetch(`/api/platform/bookings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
        setStats(data.stats || { total: 0, activeDoctors: 0, byStatus: {} });
        setStatuses(data.filters?.statuses || []);
      }
    } catch (err) {
      console.error('Error fetching booking activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivity(); }, [filters]);

  const handleFilterChange = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));
  const clearFilters = () => setFilters({ status: '', dateFrom: '', dateTo: '' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Activity</h1>
        <p className="mt-1 text-gray-500">
          Which doctors are receiving bookings. Patient details are private to each doctor and are never shown here.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Total bookings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Doctors with bookings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeDoctors}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Confirmed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStatus?.confirmed || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">From:</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">To:</label>
            <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={clearFilters} className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">Clear</button>
        </div>
      </div>

      {/* Per-doctor table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading activity…</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No booking activity for these filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map((d) => (
                  <tr key={d.doctorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/doctors/${d.doctorId}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {d.doctorName}
                      </Link>
                      {d.doctorSubdomain && <p className="text-xs text-gray-400">{d.doctorSubdomain}.curago.in</p>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{d.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.confirmed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {d.lastBookingAt ? new Date(d.lastBookingAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
