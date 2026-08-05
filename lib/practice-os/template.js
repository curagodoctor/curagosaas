/**
 * Fill {{placeholder}} tokens in a string with a doctor's field/variable values.
 *
 * Used both for the AI system prompt (server-side, hidden) and for the
 * ready-to-copy module prompt shown in the workspace — so a doctor sees their
 * real Google Business Profile link / website / etc. inline and can paste it
 * without switching screens. Unknown/empty tokens collapse to nothing so no
 * "{{...}}" ever leaks.
 */
export function fillPlaceholders(text, fields = {}) {
  return String(text || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = fields[key];
    return v != null && String(v).trim() ? String(v).trim() : '';
  });
}

// Which variables in a template are still unfilled (so the UI can nudge the
// doctor to complete the module that provides them).
export function missingPlaceholders(text, fields = {}) {
  const out = [];
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(String(text || '')))) {
    const key = m[1];
    if (!(fields[key] != null && String(fields[key]).trim()) && !out.includes(key)) out.push(key);
  }
  return out;
}
