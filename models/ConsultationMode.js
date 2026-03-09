import mongoose from 'mongoose';

const ConsultationModeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ConsultationModeSchema.index({ isActive: 1, sortOrder: 1 });

const ConsultationMode = mongoose.models.ConsultationMode || mongoose.model('ConsultationMode', ConsultationModeSchema);

export default ConsultationMode;
