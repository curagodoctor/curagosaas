"use client";

import { useState } from "react";

export default function ClinicInfoConfig({ config, onChange, slug }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    locationLink: "",
    phone: "",
    timings: "",
  });

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setFormData(config.clinics[index]);
  };

  const saveClinic = () => {
    if (!formData.name.trim() || !formData.address.trim()) return;

    const clinics = [...(config.clinics || [])];
    if (editingIndex !== null) {
      clinics[editingIndex] = formData;
    } else {
      clinics.push(formData);
    }

    onChange({ ...config, clinics });
    setEditingIndex(null);
    setFormData({ name: "", address: "", locationLink: "", phone: "", timings: "" });
  };

  const removeClinic = (index) => {
    const clinics = config.clinics.filter((_, i) => i !== index);
    onChange({ ...config, clinics });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData({ name: "", address: "", locationLink: "", phone: "", timings: "" });
  };

  // For backward compatibility: migrate single clinic to array format
  const migrateLegacyData = () => {
    if (config.address && !config.clinics) {
      const legacyClinic = {
        name: config.title || "Main Clinic",
        address: config.address || "",
        locationLink: config.locationLink || "",
        phone: "",
        timings: "",
      };
      onChange({
        ...config,
        clinics: [legacyClinic],
        address: undefined,
        locationLink: undefined,
      });
    }
  };

  // Run migration on first render if needed
  if (config.address && !config.clinics) {
    migrateLegacyData();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "Our Clinics"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Our Clinics"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Clinics List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clinic Locations ({config.clinics?.length || 0})
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add multiple clinic locations where you practice
        </p>

        {config.clinics && config.clinics.length > 0 && (
          <div className="space-y-2 mb-3">
            {config.clinics.map((clinic, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{clinic.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{clinic.address}</div>
                    {clinic.phone && (
                      <div className="text-xs text-gray-500 mt-1">Phone: {clinic.phone}</div>
                    )}
                    {clinic.timings && (
                      <div className="text-xs text-gray-500">Timings: {clinic.timings}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeClinic(index)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Clinic Form */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-sm text-gray-900 mb-3">
            {editingIndex !== null ? "Edit Clinic" : "Add New Clinic"}
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Clinic Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Clinic, SRV Hospital"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="Full address with landmarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Google Maps Link</label>
              <input
                type="url"
                value={formData.locationLink}
                onChange={(e) => setFormData({ ...formData, locationLink: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Timings</label>
                <input
                  type="text"
                  value={formData.timings}
                  onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                  placeholder="e.g., Mon-Sat, 10AM-6PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveClinic}
                disabled={!formData.name.trim() || !formData.address.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? "Update Clinic" : "Add Clinic"}
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="showConsultationInfo"
            checked={config.showConsultationInfo !== false}
            onChange={(e) => handleChange("showConsultationInfo", e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showConsultationInfo" className="text-sm font-medium text-gray-700">
            Show Consultation Information
          </label>
        </div>

        {config.showConsultationInfo !== false && (
          <div className="space-y-3 pl-6 border-l-2 border-gray-200">
            <p className="text-xs text-gray-600 italic">
              Note: Consultation and booking fees will use the global page settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
