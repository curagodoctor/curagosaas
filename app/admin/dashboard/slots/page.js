"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DAYS = [
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
  { id: 0, name: "Sunday", short: "Sun" },
];

export default function WeeklySchedulePage() {
  const [modes, setModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [availableToCreate, setAvailableToCreate] = useState([]);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchModes();
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    if (selectedMode) {
      fetchSchedule();
    }
  }, [selectedMode]);

  const fetchModes = async () => {
    try {
      const response = await fetch("/api/admin/consultation-modes", {
        credentials: 'include',
      });
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await response.json();
      if (data.success && data.modes.length > 0) {
        setModes(data.modes);
        setSelectedMode(data.modes[0]);
      } else {
        // No modes found, stop loading
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error fetching modes:", err);
      setError("Failed to fetch consultation modes");
      setIsLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch("/api/admin/time-slots?all=true", {
        credentials: 'include',
      });
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await response.json();
      if (data.success) {
        setTimeSlots(data.slots);
        setAvailableToCreate(data.availableToCreate);
      }
    } catch (err) {
      console.error("Error fetching time slots:", err);
    }
  };

  const fetchSchedule = async () => {
    if (!selectedMode) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/weekly-schedule?modeId=${selectedMode._id}`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await response.json();

      if (data.success) {
        // Build schedule object: { dayOfWeek: { isEnabled, enabledSlots } }
        const scheduleMap = {};
        for (const item of data.raw) {
          scheduleMap[item.dayOfWeek] = {
            isEnabled: item.isEnabled,
            enabledSlots: item.enabledSlots || [],
          };
        }
        setSchedule(scheduleMap);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setError("Failed to fetch schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayEnabled = async (dayOfWeek) => {
    const currentState = schedule[dayOfWeek]?.isEnabled ?? false;
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/weekly-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          modeId: selectedMode._id,
          dayOfWeek,
          isEnabled: !currentState,
        }),
      });

      if (response.ok) {
        setSchedule((prev) => ({
          ...prev,
          [dayOfWeek]: {
            ...prev[dayOfWeek],
            isEnabled: !currentState,
          },
        }));
        setSuccess(`${DAYS.find(d => d.id === dayOfWeek)?.name} ${!currentState ? "enabled" : "disabled"}`);
        setTimeout(() => setSuccess(""), 2000);
      }
    } catch (err) {
      console.error("Error toggling day:", err);
      setError("Failed to update day");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSlot = async (dayOfWeek, slotTime) => {
    const daySchedule = schedule[dayOfWeek] || { isEnabled: false, enabledSlots: [] };
    const isEnabled = daySchedule.enabledSlots.includes(slotTime);
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/weekly-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          modeId: selectedMode._id,
          dayOfWeek,
          slotTime,
          enabled: !isEnabled,
        }),
      });

      if (response.ok) {
        setSchedule((prev) => {
          const current = prev[dayOfWeek] || { isEnabled: false, enabledSlots: [] };
          const newSlots = isEnabled
            ? current.enabledSlots.filter((s) => s !== slotTime)
            : [...current.enabledSlots, slotTime].sort();
          return {
            ...prev,
            [dayOfWeek]: {
              ...current,
              enabledSlots: newSlots,
            },
          };
        });
      }
    } catch (err) {
      console.error("Error toggling slot:", err);
      setError("Failed to update slot");
    } finally {
      setIsSaving(false);
    }
  };

  const addTimeSlot = async () => {
    if (!newSlotTime) return;

    try {
      const response = await fetch("/api/admin/time-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ time: newSlotTime }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Time slot ${data.slot.label} added`);
        setTimeout(() => setSuccess(""), 2000);
        fetchTimeSlots();
        setShowAddSlotModal(false);
        setNewSlotTime("");
      } else {
        setError(data.error || "Failed to add time slot");
      }
    } catch (err) {
      console.error("Error adding slot:", err);
      setError("Failed to add time slot");
    }
  };

  const deleteTimeSlot = async (time) => {
    if (!confirm(`Delete this time slot? It will be removed from all schedules.`)) return;

    try {
      const response = await fetch(`/api/admin/time-slots?time=${encodeURIComponent(time)}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess("Time slot deleted");
        setTimeout(() => setSuccess(""), 2000);
        fetchTimeSlots();
        fetchSchedule();
      }
    } catch (err) {
      console.error("Error deleting slot:", err);
      setError("Failed to delete time slot");
    }
  };

  const isSlotEnabled = (dayOfWeek, slotTime) => {
    return schedule[dayOfWeek]?.enabledSlots?.includes(slotTime) ?? false;
  };

  const isDayEnabled = (dayOfWeek) => {
    return schedule[dayOfWeek]?.isEnabled ?? false;
  };

  const resetAllTimeSlots = async () => {
    if (!confirm("Reset all time slots to full 24 hours? This will remove all current time slots and create slots from 12:00 AM to 11:30 PM.")) return;

    setIsResetting(true);
    try {
      const response = await fetch("/api/admin/time-slots/reset", {
        method: "POST",
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => setSuccess(""), 3000);
        fetchTimeSlots();
        fetchSchedule();
      } else {
        setError(data.error || "Failed to reset time slots");
      }
    } catch (err) {
      console.error("Error resetting slots:", err);
      setError("Failed to reset time slots");
    } finally {
      setIsResetting(false);
    }
  };

  // Show all time slots (not just active ones)
  const activeTimeSlots = timeSlots;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#101A13]">Weekly Schedule</h1>
          <p className="text-[#5E6B5F] mt-1">Configure available slots for each consultation mode</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link
            href="/admin/dashboard/modes"
            className="bg-white border border-[#DDE4D9] hover:bg-[#F7F9F5] text-[#101A13] px-4 py-2 rounded-lg font-medium text-sm"
          >
            Manage Modes
          </Link>
          <button
            onClick={resetAllTimeSlots}
            disabled={isResetting}
            className="bg-[#F26A1B] hover:bg-[#d95a12] text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            {isResetting ? "Resetting..." : "Reset Time Slots"}
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      {modes.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#5E6B5F] mb-2">
            Consultation Mode
          </label>
          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode._id}
                onClick={() => setSelectedMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedMode?._id === mode._id
                    ? "text-white shadow-sm"
                    : "bg-white border border-[#DDE4D9] text-[#101A13] hover:bg-[#F7F9F5]"
                }`}
                style={{
                  backgroundColor: selectedMode?._id === mode._id ? mode.color : undefined,
                }}
              >
                {mode.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {success && (
        <div className="mb-4 bg-white border border-[#096B17]/30 text-[#096B17] px-4 py-2 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-white border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* No modes message */}
      {modes.length === 0 && !isLoading && (
        <div className="bg-white border border-[#EDF1EB] rounded-2xl shadow-sm p-6 text-center">
          <p className="text-[#5E6B5F] mb-4">No consultation modes found.</p>
          <Link
            href="/admin/dashboard/modes"
            className="bg-[#F26A1B] hover:bg-[#d95a12] text-white px-6 py-2 rounded-lg font-medium inline-block"
          >
            Create Your First Mode
          </Link>
        </div>
      )}

      {/* Schedule Grid */}
      {selectedMode && (
        <div className="bg-white rounded-2xl border border-[#EDF1EB] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096B17]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F7F9F5] border-b border-[#EDF1EB]">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#101A13] sticky left-0 bg-[#F7F9F5] z-10">
                      Time Slot
                    </th>
                    {DAYS.map((day) => (
                      <th key={day.id} className="px-3 py-3 text-center text-sm font-semibold text-[#101A13] min-w-[80px]">
                        {day.short}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-sm font-semibold text-[#101A13]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Day Enable/Disable Row */}
                  <tr className="bg-[#F7F9F5] border-b border-[#EDF1EB]">
                    <td className="px-4 py-3 font-medium text-[#101A13] sticky left-0 bg-[#F7F9F5] z-10">
                      Day Enabled
                    </td>
                    {DAYS.map((day) => (
                      <td key={day.id} className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleDayEnabled(day.id)}
                          disabled={isSaving}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isDayEnabled(day.id)
                              ? "bg-[#096B17] text-white"
                              : "bg-[#F7F9F5] border border-[#DDE4D9] text-[#5E6B5F]"
                          } ${isSaving ? "opacity-50" : "hover:opacity-80"}`}
                        >
                          {isDayEnabled(day.id) ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      </td>
                    ))}
                    <td></td>
                  </tr>

                  {/* Time Slot Rows */}
                  {activeTimeSlots.map((slot) => (
                    <tr key={slot.time} className="border-b border-[#EDF1EB] hover:bg-[#F7F9F5]">
                      <td className="px-4 py-2 font-medium text-[#101A13] sticky left-0 bg-white z-10">
                        {slot.label}
                      </td>
                      {DAYS.map((day) => {
                        const dayEnabled = isDayEnabled(day.id);
                        const slotEnabled = isSlotEnabled(day.id, slot.time);
                        return (
                          <td key={day.id} className="px-3 py-2 text-center">
                            {dayEnabled ? (
                              <button
                                onClick={() => toggleSlot(day.id, slot.time)}
                                disabled={isSaving}
                                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                                  slotEnabled
                                    ? "bg-[#096B17]/10 text-[#096B17] hover:bg-[#096B17]/20"
                                    : "bg-[#F7F9F5] border border-[#DDE4D9] text-[#5E6B5F] hover:bg-[#EDF1EB]"
                                } ${isSaving ? "opacity-50" : ""}`}
                              >
                                {slotEnabled ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="w-2 h-2 bg-[#DDE4D9] rounded-full"></span>
                                )}
                              </button>
                            ) : (
                              <span className="text-[#DDE4D9]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => deleteTimeSlot(slot.time)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete slot"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add Slot Row */}
                  <tr>
                    <td colSpan={DAYS.length + 2} className="px-4 py-4">
                      <button
                        onClick={() => setShowAddSlotModal(true)}
                        className="w-full py-2 border-2 border-dashed border-[#DDE4D9] rounded-lg text-[#5E6B5F] hover:border-[#F26A1B] hover:text-[#F26A1B] transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Time Slot
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-[#5E6B5F]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#096B17] rounded flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>Day/Slot Enabled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#F7F9F5] border border-[#DDE4D9] rounded flex items-center justify-center text-[#5E6B5F]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span>Disabled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#DDE4D9]">—</span>
          <span>Day not available</span>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-[#EDF1EB] shadow-sm p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-[#101A13] mb-4">Add Time Slot</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#5E6B5F] mb-2">
                Select Time
              </label>
              <select
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE4D9] rounded-lg focus:ring-2 focus:ring-[#096b17]"
              >
                <option value="">Select a time...</option>
                {availableToCreate.map((slot) => (
                  <option key={slot.time} value={slot.time}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddSlotModal(false);
                  setNewSlotTime("");
                }}
                className="flex-1 px-4 py-2 border border-[#DDE4D9] text-[#101A13] rounded-lg hover:bg-[#F7F9F5]"
              >
                Cancel
              </button>
              <button
                onClick={addTimeSlot}
                disabled={!newSlotTime}
                className="flex-1 px-4 py-2 bg-[#F26A1B] hover:bg-[#d95a12] text-white rounded-lg font-medium disabled:opacity-50"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
