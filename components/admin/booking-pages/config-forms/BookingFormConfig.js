"use client";

import { useEffect } from "react";

export default function BookingFormConfig({ config, onChange, slug }) {
  // Force no_payment mode (payment coming soon)
  useEffect(() => {
    if (config.paymentMode !== 'no_payment') {
      onChange({ ...config, paymentMode: 'no_payment' });
    }
  }, []);

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Note:</p>
        <p>The booking form is always included at the end of the page. Customize the payment and display options below.</p>
      </div>

      {/* Payment Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Booking Confirmation Mode
        </label>
        <div className="space-y-2">
          {/* OTP Only - Active */}
          <label className="flex items-center gap-2 p-3 border border-green-200 bg-green-50 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="paymentMode"
              value="no_payment"
              checked={true}
              readOnly
              className="w-4 h-4 text-green-600"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">OTP Verification Only</span>
              <p className="text-xs text-gray-500">Users verify via OTP to confirm booking without payment</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">Active</span>
          </label>

          {/* Payment Required - Coming Soon */}
          <div className="flex items-center gap-2 p-3 border border-gray-200 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed">
            <input
              type="radio"
              name="paymentMode"
              value="payment"
              disabled
              className="w-4 h-4 text-gray-400"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-500">Payment Required</span>
              <p className="text-xs text-gray-400">Users must pay to confirm their booking slot</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* Payment settings commented out - Coming Soon
      {config.paymentMode !== 'no_payment' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              value={config.bookingFee || 150}
              onChange={(e) => handleChange("bookingFee", parseInt(e.target.value) || 0)}
              placeholder="150"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Amount user pays to reserve the slot
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razorpay Button ID
            </label>
            <input
              type="text"
              value={config.razorpayButtonId || "pl_S32iD93nAACoNH"}
              onChange={(e) => handleChange("razorpayButtonId", e.target.value)}
              placeholder="pl_XXXXXXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from your Razorpay Dashboard → Payment Button
            </p>
          </div>
        </>
      )}
      */}

      {/* Consultation Fee */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Consultation Fee Display (₹)
        </label>
        <input
          type="number"
          min="0"
          value={config.consultationFee || 1000}
          onChange={(e) => handleChange("consultationFee", parseInt(e.target.value) || 0)}
          placeholder="1000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Full consultation fee shown to users (for reference)
        </p>
      </div>

      <hr className="border-gray-200" />

      {/* Display Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Title (optional)
        </label>
        <input
          type="text"
          value={config.customTitle || ""}
          onChange={(e) => handleChange("customTitle", e.target.value)}
          placeholder="Leave blank for default"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Subtitle (optional)
        </label>
        <textarea
          value={config.customSubtitle || ""}
          onChange={(e) => handleChange("customSubtitle", e.target.value)}
          rows={2}
          placeholder="Leave blank for default"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
