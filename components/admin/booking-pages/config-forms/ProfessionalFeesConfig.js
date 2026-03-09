"use client";

import { useState } from "react";

export default function ProfessionalFeesConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const fees = config.fees || [
    { serviceType: "In-Clinic (Offline)", newConsultation: "1000", followUp: "800" },
    { serviceType: "Video (Online)", newConsultation: "1000", followUp: "800" },
  ];

  const addFeeRow = () => {
    const newFees = [...fees, { serviceType: "", newConsultation: "", followUp: "" }];
    handleChange("fees", newFees);
  };

  const updateFeeRow = (index, field, value) => {
    const newFees = [...fees];
    newFees[index] = { ...newFees[index], [field]: value };
    handleChange("fees", newFees);
  };

  const removeFeeRow = (index) => {
    const newFees = fees.filter((_, i) => i !== index);
    handleChange("fees", newFees);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Professional Fees Table</p>
            <p>Display your consultation fees in a clean, professional table format.</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={config.title || "Professional Consultation Fees"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Professional Consultation Fees"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtitle (Optional)
        </label>
        <input
          type="text"
          value={config.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Transparent pricing for all consultations"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Currency Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency Symbol
          </label>
          <input
            type="text"
            value={config.currency || "₹"}
            onChange={(e) => handleChange("currency", e.target.value)}
            placeholder="₹"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Show Currency
          </label>
          <select
            value={config.showCurrency !== false ? "true" : "false"}
            onChange={(e) => handleChange("showCurrency", e.target.value === "true")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <select
          value={config.backgroundColor || "white"}
          onChange={(e) => handleChange("backgroundColor", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="white">White</option>
          <option value="beige">Beige</option>
          <option value="primary">Primary Light</option>
        </select>
      </div>

      {/* Fee Rows */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Fee Structure
          </label>
          <button
            type="button"
            onClick={addFeeRow}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Row
          </button>
        </div>

        {fees.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No fee rows added. Click "Add Row" to add fee information.
          </p>
        ) : (
          <div className="space-y-4">
            {fees.map((fee, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Row {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeFeeRow(index)}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Service Type</label>
                    <input
                      type="text"
                      value={fee.serviceType || ""}
                      onChange={(e) => updateFeeRow(index, "serviceType", e.target.value)}
                      placeholder="e.g., In-Clinic (Offline)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">New Consultation</label>
                      <input
                        type="text"
                        value={fee.newConsultation || ""}
                        onChange={(e) => updateFeeRow(index, "newConsultation", e.target.value)}
                        placeholder="e.g., 1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Follow-up Visit</label>
                      <input
                        type="text"
                        value={fee.followUp || ""}
                        onChange={(e) => updateFeeRow(index, "followUp", e.target.value)}
                        placeholder="e.g., 800"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Preview</h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-primary-600 text-white">
                <th className="py-2 px-3 text-left font-semibold border border-primary-700">Service Type</th>
                <th className="py-2 px-3 text-center font-semibold border border-primary-700">New</th>
                <th className="py-2 px-3 text-center font-semibold border border-primary-700">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-beige-50" : "bg-white"}>
                  <td className="py-2 px-3 font-medium border border-gray-200">{fee.serviceType || "-"}</td>
                  <td className="py-2 px-3 text-center font-bold border border-gray-200">
                    {fee.newConsultation ? `${config.currency || "₹"}${fee.newConsultation}` : "-"}
                  </td>
                  <td className="py-2 px-3 text-center font-bold border border-gray-200">
                    {fee.followUp ? `${config.currency || "₹"}${fee.followUp}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
