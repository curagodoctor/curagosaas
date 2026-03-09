"use client";

import { useState, useEffect } from "react";

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export default function ModesPage() {
  const [modes, setModes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    color: "#3B82F6",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchModes();
  }, []);

  const fetchModes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch("/api/admin/consultation-modes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        window.location.href = '/admin';
        return;
      }
      const data = await response.json();
      if (data.success) {
        setModes(data.modes);
      }
    } catch (err) {
      console.error("Error fetching modes:", err);
      setError("Failed to fetch consultation modes");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingMode(null);
    setFormData({
      name: "",
      displayName: "",
      description: "",
      color: PRESET_COLORS[modes.length % PRESET_COLORS.length],
    });
    setShowModal(true);
    setError("");
  };

  const openEditModal = (mode) => {
    setEditingMode(mode);
    setFormData({
      name: mode.name,
      displayName: mode.displayName,
      description: mode.description || "",
      color: mode.color,
    });
    setShowModal(true);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem('adminToken');
      if (editingMode) {
        // Update existing mode
        const response = await fetch("/api/admin/consultation-modes", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingMode._id,
            displayName: formData.displayName,
            description: formData.description,
            color: formData.color,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Failed to update mode");
          return;
        }

        setSuccess("Mode updated successfully!");
      } else {
        // Create new mode
        const response = await fetch("/api/admin/consultation-modes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Failed to create mode");
          return;
        }

        setSuccess("Mode created successfully!");
      }

      setShowModal(false);
      fetchModes();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving mode:", err);
      setError("Failed to save mode");
    }
  };

  const toggleModeStatus = async (mode) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch("/api/admin/consultation-modes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: mode._id,
          isActive: !mode.isActive,
        }),
      });

      if (response.ok) {
        fetchModes();
        setSuccess(`Mode ${mode.isActive ? "deactivated" : "activated"} successfully!`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error toggling mode:", err);
      setError("Failed to toggle mode status");
    }
  };

  const deleteMode = async (mode) => {
    if (!confirm(`Are you sure you want to delete "${mode.displayName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/consultation-modes?id=${mode._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to delete mode");
        return;
      }

      fetchModes();
      setSuccess("Mode deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting mode:", err);
      setError("Failed to delete mode");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Modes</h1>
          <p className="text-gray-600 mt-1">Manage your consultation types</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Mode
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Modes List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : modes.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Consultation Modes</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first consultation mode.</p>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Create Mode
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {modes.map((mode) => (
            <div
              key={mode._id}
              className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
                !mode.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Color indicator */}
                <div
                  className="w-4 h-12 rounded-full"
                  style={{ backgroundColor: mode.color }}
                ></div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {mode.displayName}
                    </h3>
                    {!mode.isActive && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {mode.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Slug: {mode.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Active */}
                <button
                  onClick={() => toggleModeStatus(mode)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    mode.isActive
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {mode.isActive ? "Deactivate" : "Activate"}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditModal(mode)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteMode(mode)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingMode ? "Edit Mode" : "Create Mode"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (only for new modes) */}
              {!editingMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (slug)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., home-visit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lowercase, no spaces (use hyphens)
                  </p>
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Home Visit Consultation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this consultation type"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? "border-gray-900 scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  {editingMode ? "Save Changes" : "Create Mode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
