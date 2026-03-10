import mongoose from 'mongoose';

const ClinicSchema = new mongoose.Schema({
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
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India',
    },
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  timings: {
    type: String,
    trim: true,
  },
  // Google Maps embed URL or coordinates
  mapUrl: {
    type: String,
    trim: true,
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  // Clinic images
  images: [{
    url: String,
    alt: String,
  }],
  // Fees and services
  consultationFee: {
    type: Number,
    default: 0,
  },
  services: [{
    type: String,
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
ClinicSchema.index({ doctorId: 1, isActive: 1, sortOrder: 1 });

// Ensure only one primary clinic per doctor
ClinicSchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    await this.constructor.updateMany(
      { doctorId: this.doctorId, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);

export default Clinic;
