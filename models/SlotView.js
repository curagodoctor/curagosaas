import mongoose from 'mongoose';

const SlotViewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'],
  },
  email: {
    type: String,
    required: true,
  },
  whatsapp: {
    type: String,
    required: true,
  },
  modeOfContact: {
    type: String,
    required: true,
    enum: ['online', 'in-clinic'],
  },
  // Tracking context
  pageName: {
    type: String,
  },
  pageSlug: {
    type: String,
  },
  referrer: {
    type: String,
  },
  // Additional metadata
  userAgent: {
    type: String,
  },
  // Track if they converted to a booking
  convertedToBooking: {
    type: Boolean,
    default: false,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
}, {
  timestamps: true,
});

// Indexes for analytics queries
SlotViewSchema.index({ createdAt: -1 });
SlotViewSchema.index({ email: 1 });
SlotViewSchema.index({ pageSlug: 1 });
SlotViewSchema.index({ modeOfContact: 1 });
SlotViewSchema.index({ convertedToBooking: 1 });

export default mongoose.models.SlotView || mongoose.model('SlotView', SlotViewSchema);
