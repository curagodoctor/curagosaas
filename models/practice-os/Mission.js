import mongoose from 'mongoose';

/**
 * Practice OS — Mission
 *
 * One guided daily mission. This is the unit the bulk importer creates (one
 * Excel row = one Mission). Week and Day are numeric fields here rather than
 * separate collections, keeping the Framework → Module → Week → Day → Mission
 * hierarchy queryable without extra CRUD surfaces.
 */

// A single education resource attached to a mission.
const ResourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'pdf', 'link', 'checklist', 'template'],
    required: true,
  },
  label: { type: String, trim: true, default: '' },
  url: { type: String, trim: true, default: '' },
  // For checklist-type resources: the list items.
  items: { type: [String], default: [] },
}, { _id: true });

// A dynamic action button ({ label, url }).
const ButtonSchema = new mongoose.Schema({
  label: { type: String, trim: true, required: true },
  url: { type: String, trim: true, default: '' },
}, { _id: true });

// A KPI metric this mission asks the doctor to record.
const KpiFieldSchema = new mongoose.Schema({
  key: { type: String, trim: true, required: true },
  label: { type: String, trim: true, default: '' },
  unit: { type: String, trim: true, default: '' },
}, { _id: true });

const MissionSchema = new mongoose.Schema({
  frameworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Framework',
    required: true,
    index: true,
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    index: true,
  },

  // Hierarchy position
  weekNumber: { type: Number, default: 1 },
  dayNumber: { type: Number, default: 1 },
  // Global ordering within the framework (drives sequential unlock).
  missionNumber: { type: Number, required: true },

  // Core content
  category: { type: String, trim: true, default: '' },
  purpose: { type: String, trim: true, default: '' },
  missionText: { type: String, trim: true, default: '' },

  // Education resources + dynamic action buttons
  education: { type: [ResourceSchema], default: [] },
  buttons: { type: [ButtonSchema], default: [] },

  // Per-mission AI assistant context
  aiContext: {
    systemPrompt: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
  },

  // Completion / evidence configuration
  evidence: {
    required: { type: Boolean, default: false },
    // Which evidence forms are accepted: image | pdf | document | url | text
    allowedTypes: { type: [String], default: ['image', 'url', 'text'] },
  },

  // Optional reflection prompts
  reflection: {
    enabled: { type: Boolean, default: false },
    fields: { type: [String], default: [] },
  },

  // Reward on completion
  reward: {
    points: { type: Number, default: 10 },
    badge: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
  },

  // KPI metrics requested by this mission
  kpiFields: { type: [KpiFieldSchema], default: [] },

  // Free-form completion rules (evaluated later by the progress engine)
  completionRules: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Days after the previous mission before this one unlocks (default 1/day).
  unlockDelayDays: { type: Number, default: 1 },

  // Publish state — only published missions are shown to doctors. Bulk-imported
  // missions default to published so they're live without an extra step.
  status: { type: String, enum: ['draft', 'published'], default: 'published' },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Importer upsert key — unique mission position within a framework/module.
MissionSchema.index(
  { frameworkId: 1, moduleId: 1, weekNumber: 1, dayNumber: 1, missionNumber: 1 },
  { unique: true }
);
// Ordered reads (dashboard / unlock sequence).
MissionSchema.index({ frameworkId: 1, missionNumber: 1 });

export default mongoose.models.Mission || mongoose.model('Mission', MissionSchema);
