import mongoose from 'mongoose';

const TimeSlotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false, // Optional for backward compatibility
    index: true,
  },
  time: {
    type: String,
    required: true,
    trim: true,
    // Format: "HH:MM" in 24-hour format, e.g., "17:00", "17:30"
  },
  label: {
    type: String,
    required: true,
    trim: true,
    // Display format, e.g., "5:00 PM", "5:30 PM"
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for active slots
TimeSlotSchema.index({ doctorId: 1, time: 1 }, { unique: true, sparse: true }); // Time unique per doctor
TimeSlotSchema.index({ doctorId: 1, isActive: 1, time: 1 });
TimeSlotSchema.index({ isActive: 1, time: 1 });

// Static method to convert 24h time to 12h label
TimeSlotSchema.statics.timeToLabel = function(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Static method to generate all possible 30-min slots
TimeSlotSchema.statics.generateAllPossibleSlots = function() {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const label = this.timeToLabel(time);
      slots.push({ time, label });
    }
  }
  return slots;
};

const TimeSlot = mongoose.models.TimeSlot || mongoose.model('TimeSlot', TimeSlotSchema);

export default TimeSlot;
