"use client";

export default function ClinicInfoConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "Find Us in Mumbai"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Find Us in Mumbai"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clinic Address *
        </label>
        <input
          type="text"
          value={config.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="SRV Hospital, Tilak Nagar, Chembur."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Google Maps Link
        </label>
        <input
          type="url"
          value={config.locationLink || ""}
          onChange={(e) => handleChange("locationLink", e.target.value)}
          placeholder="https://maps.google.com/?q=..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Link to open Google Maps when "View Location" is clicked
        </p>
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
