'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DoctorDetailsPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [bookingPages, setBookingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await fetch(`/api/platform/doctors/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Doctor not found');
          } else {
            throw new Error('Failed to fetch doctor');
          }
          return;
        }
        const data = await response.json();
        setDoctor(data.doctor);
        setBookingPages(data.bookingPages || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${doctor.displayName || doctor.name}"? This will remove ALL their data (bookings, contacts, pages, workflows, etc). This cannot be undone.`)) {
      return;
    }
    if (!confirm(`FINAL WARNING: This will permanently delete this doctor and all associated data. Type confirm by clicking OK.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/platform/doctors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete doctor');
      }

      const data = await response.json();
      alert(data.message);
      router.push('/dashboard/doctors');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm(`Are you sure you want to ${doctor.isActive ? 'suspend' : 'activate'} this doctor?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/platform/doctors/${id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin action' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      setDoctor(prev => ({ ...prev, isActive: data.doctor.isActive }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
        <Link href="/dashboard/doctors" className="text-blue-600 hover:text-blue-800">
          Back to Doctors
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile' },
    { id: 'bookings', name: 'Bookings' },
    { id: 'website', name: 'Website' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/doctors"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Doctors
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
              {doctor.profileImage ? (
                <img
                  src={doctor.profileImage}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  {doctor.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {doctor.displayName || doctor.name}
              </h1>
              <p className="text-gray-500">{doctor.email}</p>
              <div className="flex items-center mt-1 space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {doctor.isActive ? 'Active' : 'Suspended'}
                </span>
                {doctor.isEmailVerified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={`https://${doctor.subdomain}.curago.in`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Site
            </a>
            <button
              onClick={handleSuspend}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-lg flex items-center ${
                doctor.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {actionLoading ? (
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {doctor.isActive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              )}
              {doctor.isActive ? 'Suspend' : 'Activate'}
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg flex items-center bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading ? (
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Full Name</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Display Name</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.displayName || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Phone</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.phone}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">WhatsApp</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.whatsappNumber || doctor.phone}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Subdomain</dt>
                <dd className="text-sm font-medium text-blue-600">
                  <a href={`https://${doctor.subdomain}.curago.in`} target="_blank" rel="noopener noreferrer">
                    {doctor.subdomain}.curago.in
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Professional Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Specialization</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.specialization || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Qualification</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.qualification || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">License Number</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.licenseNumber || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Bio</dt>
                <dd className="text-sm text-gray-900">{doctor.bio || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-900">{doctor.stats?.confirmedBookings || 0}</p>
                <p className="text-sm text-gray-500">Confirmed Bookings</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-900">{doctor.stats?.totalViews || 0}</p>
                <p className="text-sm text-gray-500">Page Views</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-900">{doctor.stats?.bookingPagesCount || 0}</p>
                <p className="text-sm text-gray-500">Booking Pages</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-900">
                  {doctor.lastLoginAt
                    ? new Date(doctor.lastLoginAt).toLocaleDateString()
                    : 'Never'}
                </p>
                <p className="text-sm text-gray-500">Last Login</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(doctor.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email Verified</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {doctor.isEmailVerified ? 'Yes' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {doctor.isActive ? 'Active' : 'Suspended'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Referral Code</dt>
                <dd className="text-sm font-medium text-gray-900">{doctor.myReferralCode || '-'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
          </div>
          <DoctorBookings doctorId={id} />
        </div>
      )}

      {activeTab === 'website' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Pages</h3>
          {bookingPages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No booking pages created yet</p>
          ) : (
            <div className="space-y-4">
              {bookingPages.map((page) => (
                <div key={page._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{page.title}</h4>
                    <p className="text-sm text-gray-500">/{page.slug}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{page.views || 0} views</span>
                      <span>{page.bookings || 0} bookings</span>
                      <span className={`px-2 py-0.5 rounded ${
                        page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {page.status}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://${doctor.subdomain}.curago.in/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Separate component for bookings to handle its own loading state
function DoctorBookings({ doctorId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/platform/doctors/${doctorId}/bookings?page=${page}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data.bookings || []);
          setPagination(data.pagination || { total: 0, pages: 1 });
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [doctorId, page]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">No bookings found</div>
    );
  }

  return (
    <>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-gray-900">{booking.name}</p>
                <p className="text-sm text-gray-500">{booking.whatsapp}</p>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{booking.mode}</td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-900">{booking.date}</p>
                <p className="text-sm text-gray-500">{booking.time}</p>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {bookings.length} of {pagination.total} bookings
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
