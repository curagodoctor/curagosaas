import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
  activeOnline: {
    type: Boolean,
    default: true,
  },
  activeInClinic: {
    type: Boolean,
    default: true,
  },
  // Keep old 'active' field for backward compatibility during migration
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Slot || mongoose.model('Slot', SlotSchema);
