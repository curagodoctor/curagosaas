/**
 * Practice OS bulk-import helpers.
 *
 * Pure functions for parsing the mission Excel sheet into normalized values.
 * Kept separate from the route so they can be unit-tested without a DB/server.
 */

// The canonical import columns (PRD §16), in template order.
export const IMPORT_COLUMNS = [
  'Framework', 'Module', 'Week', 'Day', 'Mission Number', 'Category', 'Purpose',
  'Mission', 'Video URL', 'PDF URL', 'External Link', 'GPT Prompt',
  'Button Label 1', 'Button URL 1', 'Button Label 2', 'Button URL 2',
  'Evidence Required', 'Reward Points', 'Celebration Message', 'KPI Fields',
  'Completion Rules', 'Unlock Delay',
];

// Normalize a header cell to a lookup key: lowercase, collapse whitespace.
export function normalizeHeader(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Build a { normalizedHeader -> 1-based column index } map from the header row.
export function buildHeaderMap(headerRow) {
  const map = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = normalizeHeader(cell.text);
    if (key) map[key] = colNumber;
  });
  return map;
}

// URL-safe slug from arbitrary text.
export function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse "Evidence Required" cell into { required, allowedTypes }.
// Accepts yes/no/true/false/required, or a type list like "image, url".
export function parseEvidence(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v || ['no', 'false', '0', 'none'].includes(v)) {
    return { required: false, allowedTypes: ['image', 'url', 'text'] };
  }
  if (['yes', 'true', '1', 'required'].includes(v)) {
    return { required: true, allowedTypes: ['image', 'url', 'text'] };
  }
  // Otherwise treat as an explicit type list.
  const known = ['image', 'pdf', 'document', 'url', 'text', 'video'];
  const types = v.split(/[,|;/]/).map((t) => t.trim()).filter((t) => known.includes(t));
  return { required: types.length > 0, allowedTypes: types.length ? types : ['image', 'url', 'text'] };
}

// Parse "KPI Fields" cell into [{ key, label, unit }].
// Items separated by comma/pipe/semicolon; optional "Label:unit" syntax.
export function parseKpiFields(raw) {
  const v = String(raw || '').trim();
  if (!v) return [];
  return v
    .split(/[,|;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [labelPart, unitPart] = item.split(':').map((s) => s.trim());
      return { key: slugify(labelPart) || labelPart, label: labelPart, unit: unitPart || '' };
    });
}

// Build the education[] array from the three resource-URL columns.
export function buildEducation({ videoUrl, pdfUrl, externalLink }) {
  const out = [];
  if (videoUrl) out.push({ type: 'video', label: 'Watch Video', url: videoUrl });
  if (pdfUrl) out.push({ type: 'pdf', label: 'View PDF', url: pdfUrl });
  if (externalLink) out.push({ type: 'link', label: 'Open Link', url: externalLink });
  return out;
}

// Build the buttons[] array from the two label/url pairs (label required).
export function buildButtons(pairs) {
  return pairs
    .filter((p) => p.label)
    .map((p) => ({ label: p.label, url: p.url || '' }));
}

// Integer parse with fallback.
export function toInt(raw, fallback = 0) {
  const n = parseInt(String(raw ?? '').trim(), 10);
  return Number.isNaN(n) ? fallback : n;
}
