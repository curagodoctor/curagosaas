'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function BookingsPage() {
  const { showAlert, showConfirm } = useModal();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchTerm, filterMode, filterStatus, filterDate]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/slots', {
        credentials: 'include',
      });
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await response.json();
      if (data.success) {
        // Sort bookings by date and time (newest first)
        const sorted = data.bookings.sort((a, b) => {
          const dateCompare = new Date(b.date) - new Date(a.date);
          if (dateCompare !== 0) return dateCompare;
          return b.time.localeCompare(a.time);
        });
        setBookings(sorted);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.name?.toLowerCase().includes(search) ||
          booking.email?.toLowerCase().includes(search) ||
          booking.whatsapp?.includes(search) ||
          booking.time?.toLowerCase().includes(search)
      );
    }

    // Mode filter
    if (filterMode !== 'all') {
      filtered = filtered.filter((booking) => booking.mode === filterMode);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((booking) => booking.status === filterStatus);
    }

    // Date filter
    if (filterDate) {
      filtered = filtered.filter((booking) => booking.date === filterDate);
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-[#096B17]/10', text: 'text-[#096B17]', label: 'Confirmed' },
      pending_payment: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending Payment' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
      expired: { bg: 'bg-[#EDF1EB]', text: 'text-[#5E6B5F]', label: 'Expired' },
    };

    const config = statusConfig[status] || { bg: 'bg-[#EDF1EB]', text: 'text-[#5E6B5F]', label: status };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getModeBadge = (mode) => {
    return mode === 'online' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        Online
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#F26A1B]/10 text-[#F26A1B]">
        In-Clinic
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = await showConfirm({
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking? This will reactivate the slot.',
      confirmText: 'Cancel Booking',
      cancelText: 'Keep Booking',
      type: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch('/api/admin/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();
      if (data.success) {
        await showAlert({
          title: 'Success',
          message: 'Booking cancelled successfully!',
          type: 'success'
        });
        setSelectedBooking(null);
        fetchBookings();
      } else {
        await showAlert({
          title: 'Error',
          message: data.error || 'Failed to cancel booking',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      await showAlert({
        title: 'Error',
        message: 'Failed to cancel booking',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#5E6B5F]">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-[#101A13]">Appointments</h1>
          <p className="text-[#5E6B5F] mt-2">View and manage all consultation bookings</p>
        </div>
        {/* §9 — the clinic manager lives within Appointments */}
        <a href="/admin/dashboard/modes" className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#DDE4D9] rounded-lg text-sm font-medium text-[#101A13] hover:bg-[#F7F9F5] whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" /></svg>
          Manage clinics &amp; consultation modes
        </a>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-[#101A13] mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent text-sm"
            />
          </div>

          {/* Mode Filter */}
          <div>
            <label className="block text-sm font-medium text-[#101A13] mb-2">
              Mode
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-4 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent text-sm"
            >
              <option value="all">All Modes</option>
              <option value="online">Online</option>
              <option value="in-clinic">In-Clinic</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-[#101A13] mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-[#101A13] mb-2">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || filterMode !== 'all' || filterStatus !== 'all' || filterDate) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterMode('all');
                setFilterStatus('all');
                setFilterDate('');
              }}
              className="text-sm text-[#F26A1B] hover:opacity-80 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
          <div className="text-sm text-[#5E6B5F]">Total Bookings</div>
          <div className="text-2xl font-semibold text-[#101A13] mt-1">{bookings.length}</div>
        </div>
        <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
          <div className="text-sm text-[#5E6B5F]">Confirmed</div>
          <div className="text-2xl font-semibold text-[#096B17] mt-1">
            {bookings.filter((b) => b.status === 'confirmed').length}
          </div>
        </div>
        <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
          <div className="text-sm text-[#5E6B5F]">Pending</div>
          <div className="text-2xl font-semibold text-amber-600 mt-1">
            {bookings.filter((b) => b.status === 'pending_payment').length}
          </div>
        </div>
        <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6">
          <div className="text-sm text-[#5E6B5F]">Cancelled</div>
          <div className="text-2xl font-semibold text-red-600 mt-1">
            {bookings.filter((b) => b.status === 'cancelled').length}
          </div>
        </div>
      </div>

      {/* Bookings Table - Desktop */}
      <div className="hidden md:block bg-white border border-[#EDF1EB] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EDF1EB]">
            <thead className="bg-[#F7F9F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#5E6B5F] uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#5E6B5F] uppercase tracking-wider">
                  Patient Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#5E6B5F] uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#5E6B5F] uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#5E6B5F] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#5E6B5F] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EDF1EB]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-[#5E6B5F]">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-[#F7F9F5]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#101A13]">{formatDate(booking.date)}</div>
                      <div className="text-sm text-[#5E6B5F]">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#101A13]">{booking.name}</div>
                      <div className="text-sm text-[#5E6B5F]">
                        Age: {booking.age} • {booking.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#101A13]">{booking.email}</div>
                      <div className="text-sm text-[#5E6B5F]">{booking.whatsapp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getModeBadge(booking.mode)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="text-[#F26A1B] hover:opacity-80 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6 text-center text-[#5E6B5F]">
            No bookings found
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-[#101A13]">{formatDate(booking.date)}</div>
                  <div className="text-sm text-[#5E6B5F]">{booking.time}</div>
                </div>
                <div className="flex gap-2">
                  {getModeBadge(booking.mode)}
                  {getStatusBadge(booking.status)}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="text-base font-semibold text-[#101A13]">{booking.name}</div>
                <div className="text-sm text-[#5E6B5F]">
                  Age: {booking.age} • {booking.gender}
                </div>
                <div className="text-sm text-[#5E6B5F]">{booking.email}</div>
                <div className="text-sm text-[#5E6B5F]">{booking.whatsapp}</div>
              </div>

              <button
                onClick={() => setSelectedBooking(booking)}
                className="w-full text-center py-2 px-4 bg-[#F26A1B] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EDF1EB]">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-semibold text-[#101A13]">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-[#5E6B5F] hover:text-[#101A13]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Mode */}
              <div className="flex gap-3">
                {getStatusBadge(selectedBooking.status)}
                {getModeBadge(selectedBooking.mode)}
              </div>

              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold text-[#101A13] mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-[#F7F9F5] p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-[#5E6B5F]">Name</div>
                    <div className="font-medium text-[#101A13]">{selectedBooking.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#5E6B5F]">Age</div>
                    <div className="font-medium text-[#101A13]">{selectedBooking.age}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#5E6B5F]">Gender</div>
                    <div className="font-medium text-[#101A13] capitalize">{selectedBooking.gender}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#5E6B5F]">Email</div>
                    <div className="font-medium text-[#101A13]">{selectedBooking.email}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-[#5E6B5F]">WhatsApp</div>
                    <div className="font-medium text-[#101A13]">{selectedBooking.whatsapp}</div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h3 className="text-lg font-semibold text-[#101A13] mb-3">Appointment Details</h3>
                <div className="bg-[#F7F9F5] p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#5E6B5F]">Date:</span>
                    <span className="font-medium text-[#101A13]">{formatDate(selectedBooking.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5E6B5F]">Time:</span>
                    <span className="font-medium text-[#101A13]">{selectedBooking.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5E6B5F]">Mode:</span>
                    <span className="font-medium text-[#101A13] capitalize">{selectedBooking.mode}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {selectedBooking.paymentId && (
                <div>
                  <h3 className="text-lg font-semibold text-[#101A13] mb-3">Payment Information</h3>
                  <div className="bg-[#F7F9F5] p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#5E6B5F]">Payment ID:</span>
                      <span className="font-medium text-[#101A13] text-sm">{selectedBooking.paymentId}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              {selectedBooking.meetLink && (
                <div>
                  <h3 className="text-lg font-semibold text-[#101A13] mb-3">Meeting Link</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <a
                      href={selectedBooking.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:opacity-80 break-all"
                    >
                      {selectedBooking.meetLink}
                    </a>
                  </div>
                </div>
              )}

              {/* Actions */}
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending_payment') && (
                <div className="pt-4 border-t border-[#EDF1EB]">
                  <button
                    onClick={() => handleCancelBooking(selectedBooking._id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Cancel Booking & Reactivate Slot
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
