import mongoose from 'mongoose';

const WeeklyScheduleSchema = new mongoose.Schema({
  modeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsultationMode',
    required: true,
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0, // Sunday
    max: 6, // Saturday
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  enabledSlots: {
    type: [String], // Array of time strings like ["17:00", "17:30", "18:00"]
    default: [],
  },
}, {
  timestamps: true,
});

// Compound unique index: one entry per mode + day combination
WeeklyScheduleSchema.index({ modeId: 1, dayOfWeek: 1 }, { unique: true });

// Index for querying by day
WeeklyScheduleSchema.index({ dayOfWeek: 1, isEnabled: 1 });

// Helper to get day name
WeeklyScheduleSchema.statics.getDayName = function(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
};

// Helper to get short day name
WeeklyScheduleSchema.statics.getShortDayName = function(dayOfWeek) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek];
};

const WeeklySchedule = mongoose.models.WeeklySchedule || mongoose.model('WeeklySchedule', WeeklyScheduleSchema);

export default WeeklySchedule;
