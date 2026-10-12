/**
 * Turn an uploaded book file (PDF / DOCX / TXT) into sanitized HTML for the
 * in-app reader. The original file stays private in GCS and is never served to
 * the buyer — only this extracted content is rendered, so the book is read on
 * the account, not downloaded. Reuses the same pdf-parse / mammoth stack as the
 * CV extractor (lib/practice-os/extract.js).
 */
import { downloadObject } from '@/lib/gcs';

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Plain text → paragraphs (blank line = new paragraph; single newline = <br>).
function textToHtml(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// Strip anything executable from mammoth's HTML (it never emits scripts, but be
// defensive) — remove <script>/<style> and any on* event attributes.
function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Build reader HTML from a stored book file. Returns '' on failure.
 * @param {string} fileRef  gs:// URI of the uploaded file
 * @param {string} fileType 'pdf' | 'docx' | 'txt'
 */
export async function buildReaderHtml(fileRef, fileType = '') {
  if (!fileRef) return '';
  try {
    const buffer = await downloadObject(fileRef);
    if (!buffer) return '';
    const t = String(fileType || '').toLowerCase();

    if (t === 'pdf' || fileRef.toLowerCase().endsWith('.pdf')) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      if (parser.destroy) await parser.destroy();
      return textToHtml(result?.text || '');
    }
    if (t === 'docx' || fileRef.toLowerCase().endsWith('.docx')) {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
      return sanitizeHtml(result?.value || '');
    }
    // txt / fallback
    return textToHtml(Buffer.from(buffer).toString('utf8'));
  } catch (e) {
    console.error('[store extract] buildReaderHtml failed:', e.message);
    return '';
  }
}
