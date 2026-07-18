import mongoose from 'mongoose';

/**
 * Practice OS — JourneyTimeline
 *
 * A doctor's visual practice-building history. Entries are created from mission
 * completions, KPI milestones, evidence uploads, and achievements. Week 3.
 */
const JourneyTimelineSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['mission_completed', 'kpi', 'evidence', 'achievement', 'milestone'],
    required: true,
  },
  title: { type: String, trim: true, required: true },
  description: { type: String, trim: true, default: '' },
  imageUrl: { type: String, trim: true, default: '' },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
  occurredAt: { type: Date, default: Date.now },
}, { timestamps: true });

JourneyTimelineSchema.index({ doctorId: 1, occurredAt: -1 });

export default mongoose.models.JourneyTimeline
  || mongoose.model('JourneyTimeline', JourneyTimelineSchema);
