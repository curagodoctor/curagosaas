'use client';

import ClinicsManager from '@/components/admin/ClinicsManager';

// "Clinic Manager" (sidebar) — manage clinics and, per clinic, its consultation
// modes. Patients book by: pick clinic → pick one of its modes. Replaces the old
// doctor-level "Consultation Modes" screen (modes are now clinic-scoped).
export default function ClinicManagerPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clinic Manager</h1>
        <p className="text-gray-600 mt-1">Add your clinics and manage each clinic&apos;s consultation modes.</p>
      </div>
      <ClinicsManager />
    </div>
  );
}
