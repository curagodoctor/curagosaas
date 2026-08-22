import Doctor from '@/models/Doctor';

// Resolve a doctor's clinic/practice name for WhatsApp webhook payloads.
// Source is the doctor's editable Clinic/Practice name (Settings). Falls back to
// their display name / name so the payload field is never empty.
export async function getClinicName(doctorId) {
  if (!doctorId) return '';
  try {
    const d = await Doctor.findById(doctorId).select('clinicName displayName name').lean();
    return d?.clinicName?.trim() || d?.displayName || d?.name || '';
  } catch {
    return '';
  }
}

// Batch version — one query for many doctors. Returns a Map(doctorId → name).
export async function getClinicNames(doctorIds) {
  const map = new Map();
  const ids = [...new Set((doctorIds || []).map(String).filter(Boolean))];
  if (!ids.length) return map;
  try {
    const docs = await Doctor.find({ _id: { $in: ids } }).select('clinicName displayName name').lean();
    for (const d of docs) {
      map.set(String(d._id), (d.clinicName && d.clinicName.trim()) || d.displayName || d.name || '');
    }
  } catch { /* ignore */ }
  return map;
}
