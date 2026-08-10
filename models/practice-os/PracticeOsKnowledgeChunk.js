import mongoose from 'mongoose';

/**
 * A chunk of a Knowledge Base entry with its embedding vector, for semantic
 * retrieval (RAG). Rebuilt whenever the parent entry changes. frameworkId is
 * copied from the parent so retrieval can filter global + current-pack in one
 * query without a join.
 */
const PracticeOsKnowledgeChunkSchema = new mongoose.Schema({
  knowledgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeOsKnowledge', required: true, index: true },
  frameworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Framework', default: null, index: true },
  text: { type: String, required: true },
  embedding: { type: [Number], default: [] },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.PracticeOsKnowledgeChunk
  || mongoose.model('PracticeOsKnowledgeChunk', PracticeOsKnowledgeChunkSchema);
