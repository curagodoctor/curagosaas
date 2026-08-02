/**
 * Practice OS bulk-import helpers.
 *
 * Pure functions for parsing the mission Excel sheet into normalized values.
 * Kept separate from the route so they can be unit-tested without a DB/server.
 */

// The canonical import columns, in template order. (Each row = one Day/Task.)
// Legacy layout — kept for backward compatibility with any old sheets.
export const IMPORT_COLUMNS = [
  'Framework', 'Module', 'Week', 'Day', 'Mission Number', 'Category', 'Purpose',
  'Mission', 'Sub Steps', 'Score Component', 'Points', 'Estimated Minutes',
  'Video URL', 'PDF URL', 'External Link', 'GPT Prompt',
  'Button Label 1', 'Button URL 1', 'Button Label 2', 'Button URL 2',
  'Evidence Required', 'Celebration Message', 'KPI Fields',
  'Completion Rules', 'Unlock Delay',
];

// The current "Mission_Content_Master" template header row (52 columns, in order).
// The importer detects the header row dynamically, so ordering here only drives
// the generated download template.
export const MISSION_COLUMNS = [
  'Mission_ID', 'Day_Number', 'Week_Number', 'Mission_Number', 'Todays_Mission',
  'Mission_Category', 'Mission_Objective', 'Brief_Description', 'Why_This_Matters',
  'Estimated_Time', 'Difficulty_Level', 'Module_ID', 'Module_Number', 'Module_Name',
  'Expected_Outcome', 'Prerequisites', 'Step_By_Step_Guide', 'Video_Link',
  'Prompt_output_with_placeholder', 'XP_Reward', 'Primary_Button_Text',
  'Primary_Button_Action', 'Primary_button_link', 'Secondary_button_text',
  'Secondary_button_action', 'Secondary_button_link', 'Tertiary_button_text',
  'Tertiary_button_action', 'Tertiary_button_link', 'Documentation_URL', 'Article_URL',
  'Mission_inputs_from_doctor', 'input-1', 'input-1_compulsory/not_compulsory',
  'input_2', 'input-2_compulsory/not_compulsory', 'input_3',
  'input-3_compulsory/not_compulsory', 'input_4', 'input-4_compulsory/not_compulsory',
  'Notes-to-self_Enabled', 'Feedback_for_us', 'Success_Message', 'Failure_Message',
  'Failure_criteria', 'Next_Mission_ID', 'Internal_Notes', 'Status', 'Created_By',
  'Version', 'Instareel number being live', 'GBP pot number that is being live',
];

// The "Resources" sheet header row (7 columns).
export const RESOURCE_COLUMNS = [
  'Mission_ID', 'Resource_Order', 'Resource_Type', 'Title', 'URL', 'Mandatory',
  'Description',
];

// Visibility Score components (CLAUDE.md §5). Normalizes free text -> key.
export function parseScoreComponent(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return 'none';
  if (/gbp|google business|business profile/.test(v)) return 'gbp';
  if (/review/.test(v)) return 'reviews';
  if (/site|website|web/.test(v)) return 'website';
  if (/system|booking|whatsapp|reminder/.test(v)) return 'systems';
  if (/social|instagram|insta|facebook|meta/.test(v)) return 'social';
  return ['gbp', 'reviews', 'website', 'systems', 'social', 'none'].includes(v) ? v : 'none';
}

// Sub-steps: split on newlines / semicolons / pipes OR numbered "1. / 2)" markers.
export function parseSubSteps(raw) {
  let s = String(raw || '').replace(/\r/g, '');
  if (!s.trim()) return [];
  // Break the string before inline numbered markers ("1. ", "2) ") so a single
  // cell like "1. Do this 2. Do that" splits into separate steps.
  s = s.replace(/(^|[\s;|])(\d{1,2})[.)]\s+/g, '$1\n');
  return s
    .split(/[\n;|]/)
    .map((x) => x.replace(/^\s*\d{1,2}[.)]\s*/, '').trim())
    .filter(Boolean);
}

// Normalize a header cell to a lookup key: lowercase, collapse whitespace.
export function normalizeHeader(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Strong header key: drop parenthetical annotations, lowercase, strip every
// non-alphanumeric character. Robust to case, spacing, punctuation and the
// "(related to the mission)" style notes present in the real template.
export function normalizeKey(text) {
  return String(text || '')
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

// Build a { normalizedHeader -> 1-based column index } map from the header row.
// (Legacy: uses whitespace-collapsed keys.)
export function buildHeaderMap(headerRow) {
  const map = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = normalizeHeader(cell.text);
    if (key) map[key] = colNumber;
  });
  return map;
}

// Build a { normalizeKey(header) -> 1-based column index } map. First occurrence
// of a key wins so duplicate/merged headers don't clobber earlier columns.
export function buildColumnMap(headerRow) {
  const map = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeKey(cell.text);
    if (key && !(key in map)) map[key] = colNumber;
  });
  return map;
}

// Find the header row by scanning for a cell equal to "Mission_ID" (case/spacing
// insensitive). Returns { rowNumber, row } or null. Never hardcodes the row.
export function findHeaderRow(worksheet, maxScan = 50) {
  const limit = Math.min(worksheet.rowCount || maxScan, maxScan);
  for (let r = 1; r <= limit; r += 1) {
    const row = worksheet.getRow(r);
    let found = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (normalizeKey(cell.text) === 'missionid') found = true;
    });
    if (found) return { rowNumber: r, row };
  }
  return null;
}

// "35 min" / "35" / "~35 minutes" -> 35. Falls back when no number present.
export function parseEstimatedTime(raw, fallback = 35) {
  const m = String(raw ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : fallback;
}

// Build inputs[] from up to four { label, compulsory } pairs. A compulsory cell
// whose text contains "not" means required:false; anything else means required:true.
export function buildInputs(pairs) {
  const out = [];
  for (const p of pairs) {
    const label = String(p.label ?? '').trim();
    if (!label) continue;
    const comp = String(p.compulsory ?? '').trim().toLowerCase();
    const required = !/not/.test(comp);
    out.push({ label, required });
  }
  return out;
}

// Build buttons[] from up to three { text, action, link } triples. Skips empty
// triples; keeps the action verb alongside so callers can stash it in meta.
export function buildButtonTriples(triples) {
  const buttons = [];
  const actions = [];
  for (const t of triples) {
    const label = String(t.text ?? '').trim();
    const action = String(t.action ?? '').trim();
    const url = String(t.link ?? '').trim();
    if (!label && !action && !url) continue;
    buttons.push({ label: label || action || 'Open', url });
    if (action) actions.push({ label: label || action, action, url });
  }
  return { buttons, actions };
}

// Map a Resources-sheet Resource_Type to the ResourceSchema enum.
export function normalizeResourceType(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (['video', 'pdf', 'link', 'checklist', 'template'].includes(v)) return v;
  if (/video|youtube|youtu\.be|watch/.test(v)) return 'video';
  if (/pdf|document|doc/.test(v)) return 'pdf';
  if (/checklist|list/.test(v)) return 'checklist';
  if (/template|sheet/.test(v)) return 'template';
  return 'link';
}

// Documentation_URL + Article_URL -> education resources. PDF links become pdf,
// everything else a link.
export function buildDocEducation({ documentationUrl, articleUrl }) {
  const out = [];
  const asType = (url) => (/\.pdf($|\?)/i.test(String(url)) ? 'pdf' : 'link');
  const doc = String(documentationUrl || '').trim();
  const art = String(articleUrl || '').trim();
  if (doc) out.push({ type: asType(doc), label: 'Documentation', url: doc });
  if (art) out.push({ type: asType(art), label: 'Article', url: art });
  return out;
}

// Map a Status cell to the Mission publish state. "live"/"published"/"active"
// (and blank) publish; anything else is a draft.
export function parseStatus(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return 'published';
  if (['live', 'published', 'active', 'publish'].includes(v)) return 'published';
  return 'draft';
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
