// OpenAI embeddings + cosine similarity for the Practice OS knowledge base (RAG).
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

export function isEmbeddingConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

// Split text into ~maxChars chunks on paragraph boundaries; hard-split very long
// paragraphs. Chunks are what we embed + retrieve against.
export function chunkText(text, maxChars = 1000) {
  const clean = String(text || '').replace(/\r/g, '').trim();
  if (!clean) return [];
  const paras = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let cur = '';
  for (const p of paras) {
    if (cur && (cur.length + p.length + 2) > maxChars) { chunks.push(cur); cur = ''; }
    cur = cur ? `${cur}\n\n${p}` : p;
    while (cur.length > maxChars) { chunks.push(cur.slice(0, maxChars)); cur = cur.slice(maxChars); }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export async function embedTexts(texts) {
  if (!texts.length) return [];
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.embeddings.create({ model: EMBED_MODEL, input: texts });
  return res.data.map((d) => d.embedding);
}

export async function embedText(text) {
  const [v] = await embedTexts([text]);
  return v || null;
}

export function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
