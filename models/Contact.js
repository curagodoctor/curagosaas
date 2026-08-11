import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: 100,
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
  status: {
    type: String,
    default: 'new',
    lowercase: true,
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  source: {
    type: String,
    enum: ['manual', 'import', 'booking', 'website'],
    default: 'manual',
  },
  notes: {
    type: String,
    maxlength: 2000,
  },
  googleReviewLink: {
    type: String,
    trim: true,
  },
  // Set the first (and only) time a review-request WhatsApp flow is triggered for
  // this contact — the button is one-click-forever per contact.
  reviewRequestSentAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
ContactSchema.index({ doctorId: 1, phone: 1 });
ContactSchema.index({ doctorId: 1, status: 1 });
ContactSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
