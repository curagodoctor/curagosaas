import mongoose from 'mongoose';

/**
 * The output of the double AI-run's FIRST pass (the content architect) — the
 * unique structure + angle designed for a doctor's article, persisted so it is
 * never lost: auditable, reusable on regeneration, and reviewable/editable later.
 * One per (doctorId, missionId); regenerating a task updates the same record.
 */
const BlueprintSectionSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  cover: { type: [String], default: [] },
}, { _id: false });

const ContentBlueprintSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', required: true, index: true },
  frameworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Framework', default: null },

  topic: { type: String, default: '' },
  archetype: { type: String, default: '' },      // which structural archetype was chosen
  angle: { type: String, default: '' },
  titleIdea: { type: String, default: '' },
  toneNote: { type: String, default: '' },
  sections: { type: [BlueprintSectionSchema], default: [] },

  model: { type: String, default: '' },          // the architect model used
}, { timestamps: true });

ContentBlueprintSchema.index({ doctorId: 1, missionId: 1 }, { unique: true });

export default mongoose.models.ContentBlueprint
  || mongoose.model('ContentBlueprint', ContentBlueprintSchema);
