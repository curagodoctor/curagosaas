import mongoose from 'mongoose';

const ConsultationModeSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false, // Optional for backward compatibility
    index: true,
  },
  // Which clinic this mode belongs to. Modes are managed per-clinic; the patient
  // booking flow is: pick clinic → pick one of its modes. Nullable for legacy
  // modes until migrated to the doctor's primary clinic.
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    default: null,
    index: true,
  },
  name: {
    type: String,
    required: true,
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

// Index for efficient queries. Name is unique per clinic (a mode can repeat
// across a doctor's clinics).
ConsultationModeSchema.index({ doctorId: 1, clinicId: 1, name: 1 }, { unique: true, sparse: true });
ConsultationModeSchema.index({ doctorId: 1, isActive: 1, sortOrder: 1 });
ConsultationModeSchema.index({ clinicId: 1, isActive: 1, sortOrder: 1 });
ConsultationModeSchema.index({ isActive: 1, sortOrder: 1 });

const ConsultationMode = mongoose.models.ConsultationMode || mongoose.model('ConsultationMode', ConsultationModeSchema);

export default ConsultationMode;
