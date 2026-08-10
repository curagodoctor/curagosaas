import connectDB from '@/lib/mongodb';
import PracticeOsKnowledge from '@/models/practice-os/PracticeOsKnowledge';
import PracticeOsKnowledgeChunk from '@/models/practice-os/PracticeOsKnowledgeChunk';
import { chunkText, embedTexts, embedText, cosineSim, isEmbeddingConfigured } from '@/lib/practice-os/embeddings';

// Max characters of knowledge injected into the assistant per call.
const KB_CAP = 6000;
// How many top chunks to consider during semantic retrieval.
const TOP_K = 12;

/**
 * Combined knowledge for the assistant. When a query is given and embeddings are
 * configured, this does semantic retrieval (RAG) over global + this-pack chunks;
 * otherwise it falls back to concatenating the entries' raw text (capped).
 *
 * @param {string|import('mongoose').Types.ObjectId|null} frameworkId
 * @param {string} query
 * @param {number} cap
 * @returns {Promise<string>}
 */
export async function getKnowledgeContext(frameworkId, query = '', cap = KB_CAP) {
  try {
    await connectDB();
    if (query && isEmbeddingConfigured()) {
      const retrieved = await retrieveByEmbedding(frameworkId, query, cap);
      if (retrieved) return retrieved;
    }
    return await concatRawEntries(frameworkId, cap);
  } catch {
    // Never let a KB lookup break the assistant.
    return '';
  }
}

// Semantic retrieval: rank global + pack chunks by cosine similarity to the query.
async function retrieveByEmbedding(frameworkId, query, cap) {
  const or = [{ frameworkId: null }];
  if (frameworkId) or.push({ frameworkId });
  const chunks = await PracticeOsKnowledgeChunk
    .find({ $or: or, 'embedding.0': { $exists: true } })
    .select('text embedding')
    .lean();
  if (!chunks.length) return '';

  let qVec;
  try { qVec = await embedText(query); } catch { return ''; }
  if (!qVec) return '';

  const ranked = chunks
    .map((c) => ({ text: c.text, score: cosineSim(qVec, c.embedding) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  let out = '';
  for (const c of ranked) {
    const block = `${c.text.trim()}\n\n`;
    if (out.length + block.length > cap) { out += block.slice(0, Math.max(0, cap - out.length)); break; }
    out += block;
  }
  return out.trim();
}

// Fallback when there are no embeddings: concatenate entries (global first).
async function concatRawEntries(frameworkId, cap) {
  const or = [{ frameworkId: null }];
  if (frameworkId) or.push({ frameworkId });
  const entries = await PracticeOsKnowledge
    .find({ isActive: true, $or: or })
    .sort({ frameworkId: 1, updatedAt: -1 })
    .select('title content')
    .lean();
  if (!entries.length) return '';
  let out = '';
  for (const e of entries) {
    const block = `# ${e.title}\n${(e.content || '').trim()}\n\n`;
    if (out.length + block.length > cap) { out += block.slice(0, Math.max(0, cap - out.length)); break; }
    out += block;
  }
  return out.trim();
}

/**
 * Rebuild the chunk+embedding index for one KB entry. Best-effort: it clears old
 * chunks first, and silently no-ops (leaving raw-text fallback) if embeddings
 * aren't configured or the API call fails.
 *
 * @param {{ _id: any, content?: string, frameworkId?: any }} entry
 */
export async function reindexEntry(entry) {
  if (!entry?._id) return;
  await connectDB();
  await PracticeOsKnowledgeChunk.deleteMany({ knowledgeId: entry._id });
  if (!isEmbeddingConfigured()) return;
  const chunks = chunkText(entry.content, 1000);
  if (!chunks.length) return;
  let vectors;
  try {
    vectors = await embedTexts(chunks);
  } catch (e) {
    console.error('[KB reindex] embedding failed:', e.message);
    return;
  }
  const docs = chunks.map((text, i) => ({
    knowledgeId: entry._id,
    frameworkId: entry.frameworkId || null,
    text,
    embedding: vectors[i] || [],
    order: i,
  }));
  await PracticeOsKnowledgeChunk.insertMany(docs);
}

export async function removeEntryChunks(knowledgeId) {
  await connectDB();
  await PracticeOsKnowledgeChunk.deleteMany({ knowledgeId });
}
