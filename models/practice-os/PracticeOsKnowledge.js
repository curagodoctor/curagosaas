import mongoose from 'mongoose';

/**
 * Practice OS — Knowledge Base entry.
 *
 * Curated "working knowledge" the mission assistant learns from. An entry is
 * either GLOBAL (frameworkId = null → applies to every pack) or scoped to a
 * single Builder Pack (frameworkId set). At query time the assistant loads the
 * global entries PLUS the current pack's entries and injects them as reference
 * knowledge beneath the confidential master SOP.
 */
const PracticeOsKnowledgeSchema = new mongoose.Schema({
  // null = global (all packs); set = this Builder Pack only.
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    default: null,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  // Where the content came from (e.g. a filename), for the admin's reference.
  sourceName: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

PracticeOsKnowledgeSchema.index({ frameworkId: 1, updatedAt: -1 });

export default mongoose.models.PracticeOsKnowledge
  || mongoose.model('PracticeOsKnowledge', PracticeOsKnowledgeSchema);
