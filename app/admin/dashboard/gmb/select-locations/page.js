'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SelectLocationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingId = searchParams.get('pending');

  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pendingId) {
      fetchLocations();
    } else {
      setError('Invalid connection. Please try again.');
      setLoading(false);
    }
  }, [pendingId]);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`/api/doctor/gmb/select-locations?pending=${pendingId}`);
      const data = await res.json();

      if (data.success) {
        setLocations(data.locations);
        // Pre-select locations that are not already connected
        const unconnected = data.locations
          .filter(loc => !loc.alreadyConnected)
          .map(loc => loc.locationId);
        setSelectedLocations(unconnected);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locationId) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      }
      return [...prev, locationId];
    });
  };

  const handleConnect = async () => {
    if (selectedLocations.length === 0) {
      setError('Please select at least one location');
      return;
    }

    try {
      setConnecting(true);
      setError(null);

      const res = await fetch('/api/doctor/gmb/select-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingId,
          locationIds: selectedLocations,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/admin/dashboard/gmb?connected=true&count=${data.connectedLocations.length}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect locations');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl text-[#096b17] mb-4">&#9696;</div>
          <p className="text-gray-600">Loading your business locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/dashboard/gmb" className="hover:text-[#096b17]">GMB</Link>
          <span>/</span>
          <span>Select Locations</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Business Locations</h1>
        <p className="text-gray-600">
          Choose which locations you want to connect. You can manage posts and reviews for each location separately.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Locations List */}
      {locations.length > 0 && (
        <div className="space-y-4 mb-8">
          {locations.map((location) => (
            <div
              key={location.locationId}
              onClick={() => !location.alreadyConnected && toggleLocation(location.locationId)}
              className={`bg-white rounded-xl shadow-sm border p-4 transition-all cursor-pointer ${
                location.alreadyConnected
                  ? 'opacity-60 cursor-not-allowed'
                  : selectedLocations.includes(location.locationId)
                  ? 'border-[#096b17] ring-2 ring-[#096b17]/20'
                  : 'hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  location.alreadyConnected
                    ? 'bg-gray-200 border-gray-300'
                    : selectedLocations.includes(location.locationId)
                    ? 'bg-[#096b17] border-[#096b17]'
                    : 'border-gray-300'
                }`}>
                  {(selectedLocations.includes(location.locationId) || location.alreadyConnected) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Location Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{location.businessName}</h3>
                    {location.alreadyConnected && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Already Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{location.locationAddress}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {location.businessPhone && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {location.businessPhone}
                      </span>
                    )}
                    {location.businessCategory && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {location.businessCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard/gmb"
          className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleConnect}
          disabled={connecting || selectedLocations.length === 0}
          className="px-6 py-2 bg-[#096b17] text-white font-medium rounded-lg hover:bg-[#075212] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            `Connect ${selectedLocations.length} Location${selectedLocations.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </div>
  );
}
