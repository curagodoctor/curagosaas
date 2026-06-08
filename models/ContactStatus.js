import mongoose from 'mongoose';

const ContactStatusSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    default: '#6B7280',
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
ContactStatusSchema.index({ doctorId: 1, name: 1 }, { unique: true });
ContactStatusSchema.index({ doctorId: 1, sortOrder: 1 });

// Static: seed defaults for a new doctor
ContactStatusSchema.statics.createDefaultsForDoctor = async function(doctorId) {
  const defaults = [
    { doctorId, name: 'new', label: 'New', color: '#3B82F6', sortOrder: 0, isDefault: true },
    { doctorId, name: 'contacted', label: 'Contacted', color: '#F59E0B', sortOrder: 1 },
    { doctorId, name: 'follow-up', label: 'Follow-up', color: '#8B5CF6', sortOrder: 2 },
    { doctorId, name: 'visited', label: 'Visited', color: '#10B981', sortOrder: 3 },
    { doctorId, name: 'review-sent', label: 'Review Sent', color: '#EC4899', sortOrder: 4 },
    { doctorId, name: 'review-done', label: 'Review Done', color: '#059669', sortOrder: 5 },
  ];

  try {
    return await this.insertMany(defaults, { ordered: false });
  } catch (error) {
    // Ignore duplicate key errors (already seeded)
    if (error.code !== 11000) throw error;
  }
};

// Static: get active statuses for a doctor
ContactStatusSchema.statics.getActiveStatuses = function(doctorId) {
  return this.find({ doctorId, isActive: true }).sort({ sortOrder: 1 }).lean();
};

export default mongoose.models.ContactStatus || mongoose.model('ContactStatus', ContactStatusSchema);
