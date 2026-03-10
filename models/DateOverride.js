import mongoose from 'mongoose';

const DateOverrideSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false, // Optional for backward compatibility
    index: true,
  },
  date: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['blocked', 'custom_slots'],
  },
  reason: {
    type: String,
  },
  customSlots: {
    type: Map,
    of: Boolean,
  },
}, {
  timestamps: true,
});

// Indexes
DateOverrideSchema.index({ doctorId: 1, date: 1 }, { unique: true, sparse: true }); // Date unique per doctor
DateOverrideSchema.index({ date: 1 }); // For backward compat queries

export default mongoose.models.DateOverride || mongoose.model('DateOverride', DateOverrideSchema);
