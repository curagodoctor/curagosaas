import mongoose from 'mongoose';

/**
 * Practice OS — Module
 *
 * Groups missions within a Framework. Auto-created by the bulk importer when a
 * mission row references a module title that doesn't yet exist.
 */
const ModuleSchema = new mongoose.Schema({
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Unique per framework by title so the importer can upsert modules idempotently.
ModuleSchema.index({ frameworkId: 1, title: 1 }, { unique: true });
ModuleSchema.index({ frameworkId: 1, order: 1 });

export default mongoose.models.Module || mongoose.model('Module', ModuleSchema);
