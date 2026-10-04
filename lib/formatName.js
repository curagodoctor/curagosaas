// Consistent formatting for user-entered text so what a doctor types (e.g. ALL
// CAPS) is stored and shown in a clean, uniform format everywhere.

// Title-case a string: "JOHN smith" -> "John Smith". Collapses whitespace.
export function titleCase(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s(\-/'.])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// A doctor's display name: Title Case with a "Dr." prefix by default.
// "DR RAGHAVENDRA" / "raghavendra" -> "Dr. Raghavendra".
export function formatDoctorName(raw) {
  let s = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!s) return s;
  // Strip any leading "dr"/"dr." (any case) so we don't double-prefix.
  s = s.replace(/^dr\.?\s+/i, '');
  s = titleCase(s);
  return s ? `Dr. ${s}` : s;
}

// Qualifications are abbreviations (MBBS, MS, DNB) — upper-case each token,
// keep the comma spacing tidy. "mbbs,ms" -> "MBBS, MS".
export function formatQualifications(raw) {
  return String(raw || '')
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .join(', ');
}
