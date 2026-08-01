/**
 * Practice OS — CV extraction (PRD / CLAUDE.md §4.0).
 *
 * Parses an uploaded CV to text, then uses the LLM to pull structured profile
 * facts. Strictly extraction-only — never invents a credential; anything not
 * clearly present comes back empty with confidence 0 (flagged, not filled).
 */

const PROFILE_KEYS = ['qualifications', 'specialty', 'registration', 'procedures', 'languages'];

// Parse a CV buffer to plain text (PDF or DOCX). Returns '' on failure.
export async function extractCvText(buffer, contentType = '', filename = '') {
  const name = filename.toLowerCase();
  const isPdf = contentType.includes('pdf') || name.endsWith('.pdf');
  const isDocx = contentType.includes('word') || contentType.includes('officedocument') || name.endsWith('.docx');

  try {
    if (isPdf) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      if (parser.destroy) await parser.destroy();
      return (result?.text || '').trim();
    }
    if (isDocx) {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      return (result?.value || '').trim();
    }
    // Fallback: best-effort plain text.
    return Buffer.from(buffer).toString('utf8').trim();
  } catch (e) {
    console.error('[Practice OS extractCvText]', e.message);
    return '';
  }
}

// Ask the LLM to extract the five profile fields. Extraction-only, with confidence.
export async function extractProfileFields(cvText) {
  if (!process.env.OPENAI_API_KEY) return { fields: [], configured: false };
  if (!cvText || cvText.length < 20) return { fields: [], configured: true };

  const system = `You extract structured facts from an Indian doctor's CV/resume text.
Return ONLY a JSON object with exactly these keys, each an object { "value": string, "confidence": number 0-1 }:
- qualifications (degrees, e.g. "MBBS, MD (General Medicine)")
- specialty (their medical specialty)
- registration (medical council registration number)
- procedures (key procedures/treatments they perform, comma-separated)
- languages (languages they speak, comma-separated)

Rules:
- Extract ONLY what is explicitly present in the text. NEVER invent or guess a credential — a wrong credential on a public profile is harmful.
- If a field is not clearly present, set value:"" and confidence:0.
- confidence reflects how explicitly the text states it (1 = stated verbatim, lower = inferred).`;

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: cvText.slice(0, 12000) },
      ],
    });
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    const fields = PROFILE_KEYS.map((k) => ({
      field: k,
      value: String(parsed[k]?.value || '').trim(),
      confidence: Math.max(0, Math.min(1, Number(parsed[k]?.confidence) || 0)),
    }));
    return { fields, configured: true };
  } catch (e) {
    console.error('[Practice OS extractProfileFields]', e.message);
    return { fields: [], configured: true, error: 'extraction_failed' };
  }
}
