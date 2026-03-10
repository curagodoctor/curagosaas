import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false, // Optional for backward compatibility
    index: true,
  },
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
  mode: {
    type: String,
    required: true,
    // Dynamic modes - no enum restriction
  },
  modeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsultationMode',
    // Optional for backward compatibility with existing bookings
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending_payment', 'confirmed', 'expired', 'cancelled'],
    default: 'pending_payment',
  },
  expiryTime: {
    type: Date,
  },
  paymentId: {
    type: String,
  },
  paymentSignature: {
    type: String,
  },
  eventId: {
    type: String,
  },
  meetLink: {
    type: String,
  },
  calendarEventUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for faster queries
BookingSchema.index({ doctorId: 1, date: 1, time: 1 });
BookingSchema.index({ date: 1, time: 1 });
BookingSchema.index({ doctorId: 1, status: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ expiryTime: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
