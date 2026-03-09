import connectDB from './mongodb';
import Booking from '../models/Booking';
import TimeSlot from '../models/TimeSlot';
import WeeklySchedule from '../models/WeeklySchedule';
import ConsultationMode from '../models/ConsultationMode';
import DateOverride from '../models/DateOverride';

// Get day of week from date string (0=Sunday, 6=Saturday)
const getDayOfWeek = (dateString) => {
  const date = new Date(dateString + 'T00:00:00');
  return date.getDay();
};

// Initialize default consultation modes if database is empty
export const initializeDefaultModes = async () => {
  await connectDB();

  const count = await ConsultationMode.countDocuments();
  if (count === 0) {
    const defaultModes = [
      {
        name: 'online',
        displayName: 'Online Consultation',
        description: 'Video consultation from the comfort of your home',
        color: '#3B82F6', // Blue
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'in-clinic',
        displayName: 'In-Clinic Visit',
        description: 'Visit the clinic for in-person consultation',
        color: '#10B981', // Green
        isActive: true,
        sortOrder: 2,
      },
    ];

    for (const modeData of defaultModes) {
      const mode = await ConsultationMode.create(modeData);

      // Initialize weekly schedule for all days (disabled by default)
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        await WeeklySchedule.create({
          modeId: mode._id,
          dayOfWeek,
          isEnabled: false,
          enabledSlots: [],
        });
      }
    }
    console.log('Default consultation modes initialized');
  }
};

// Initialize default time slots if database is empty
export const initializeDefaultTimeSlots = async () => {
  await connectDB();

  // Also initialize default modes
  await initializeDefaultModes();

  const count = await TimeSlot.countDocuments();
  if (count === 0) {
    // Create full day slots from 6 AM to 10 PM (common working hours)
    const defaultTimes = [];
    for (let hour = 6; hour <= 22; hour++) {
      defaultTimes.push(`${hour.toString().padStart(2, '0')}:00`);
      defaultTimes.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    for (const time of defaultTimes) {
      const label = TimeSlot.timeToLabel(time);
      await TimeSlot.create({
        time,
        label,
        isActive: true,
      });
    }
    console.log('Default time slots initialized (6 AM - 10 PM)');
  }
};

// Reset and recreate all time slots (for fixing existing data)
export const resetTimeSlots = async () => {
  await connectDB();

  // Delete all existing time slots
  await TimeSlot.deleteMany({});

  // Create full 24-hour slots (every 30 minutes)
  const defaultTimes = [];
  for (let hour = 0; hour < 24; hour++) {
    defaultTimes.push(`${hour.toString().padStart(2, '0')}:00`);
    defaultTimes.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  for (const time of defaultTimes) {
    const label = TimeSlot.timeToLabel(time);
    await TimeSlot.create({
      time,
      label,
      isActive: true,
    });
  }

  console.log('Time slots reset (Full 24 hours)');
  return { success: true, count: defaultTimes.length };
};

// Get all active time slots
export const getAllActiveTimeSlots = async () => {
  await connectDB();
  await initializeDefaultTimeSlots();

  const slots = await TimeSlot.find({ isActive: true }).sort({ time: 1 });
  return slots;
};

// Get effective slots for a date and mode (using WeeklySchedule)
export const getEffectiveSlotsForDate = async (date, modeId) => {
  await connectDB();
  await initializeDefaultTimeSlots();

  // Check if date is blocked
  const override = await DateOverride.findOne({ date });
  if (override && override.type === 'blocked') {
    return [];
  }

  // Get day of week from date
  const dayOfWeek = getDayOfWeek(date);

  // Get mode details
  const mode = await ConsultationMode.findById(modeId);
  if (!mode || !mode.isActive) {
    return [];
  }

  // Get weekly schedule for this mode and day
  const schedule = await WeeklySchedule.findOne({ modeId, dayOfWeek });

  if (!schedule || !schedule.isEnabled) {
    return [];
  }

  // Get all active time slots
  const allTimeSlots = await TimeSlot.find({ isActive: true }).sort({ time: 1 });

  // Filter to only enabled slots for this day
  const enabledSlots = allTimeSlots.filter(slot =>
    schedule.enabledSlots.includes(slot.time)
  );

  return enabledSlots.map(slot => ({
    time: slot.time,
    label: slot.label,
    isActive: true,
  }));
};

// EXCLUSIVE BOOKING: Check if a slot is booked for ANY mode
export const isSlotBooked = async (date, time) => {
  await connectDB();

  // Release expired reservations first
  await releaseExpiredReservations();

  // Check for booking at this date/time for ANY mode (exclusive booking)
  const booking = await Booking.findOne({
    date,
    time,
    status: { $in: ['confirmed', 'pending_payment'] },
  });

  return !!booking;
};

// Check if slot is available for booking (exclusive across all modes)
export const isSlotAvailable = async (date, time, modeId) => {
  await connectDB();

  // First check if slot is enabled for this mode on this day
  const dayOfWeek = getDayOfWeek(date);
  const schedule = await WeeklySchedule.findOne({ modeId, dayOfWeek });

  if (!schedule || !schedule.isEnabled || !schedule.enabledSlots.includes(time)) {
    return false;
  }

  // Then check if slot is already booked (for any mode - exclusive)
  const isBooked = await isSlotBooked(date, time);
  return !isBooked;
};

// Create a reservation
export const createReservation = async (bookingData) => {
  await connectDB();

  // Check if slot is already booked (exclusive booking)
  const existing = await Booking.findOne({
    date: bookingData.date,
    time: bookingData.time,
    status: { $in: ['confirmed', 'pending_payment'] },
  });

  if (existing) {
    throw new Error('Slot is already booked or reserved');
  }

  // Create reservation with 10-minute expiry
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

  const booking = await Booking.create({
    name: bookingData.name,
    age: bookingData.age,
    gender: bookingData.gender,
    email: bookingData.email,
    whatsapp: bookingData.whatsapp,
    mode: bookingData.mode,
    modeId: bookingData.modeId,
    date: bookingData.date,
    time: bookingData.time,
    status: 'pending_payment',
    expiryTime,
  });

  return booking;
};

// Get reservation by ID
export const getReservationById = async (id) => {
  await connectDB();

  const booking = await Booking.findById(id).populate('modeId', 'name displayName color');
  return booking;
};

// Confirm reservation (after payment)
export const confirmReservation = async (id, paymentData) => {
  await connectDB();

  const booking = await Booking.findById(id);

  if (!booking) {
    return { success: false, message: 'Reservation not found' };
  }

  if (booking.status !== 'pending_payment') {
    return { success: false, message: 'Reservation is not pending payment' };
  }

  // Check if expired
  if (booking.expiryTime && new Date() > booking.expiryTime) {
    booking.status = 'expired';
    await booking.save();
    return { success: false, message: 'Reservation has expired' };
  }

  // Update booking with payment details
  booking.status = 'confirmed';
  booking.paymentId = paymentData.paymentId;
  booking.paymentSignature = paymentData.paymentSignature;
  booking.eventId = paymentData.eventId;
  booking.meetLink = paymentData.meetLink;
  booking.calendarEventUrl = paymentData.calendarEventUrl;
  booking.expiryTime = null;

  await booking.save();

  return { success: true, booking };
};

// Release expired reservations
export const releaseExpiredReservations = async () => {
  await connectDB();

  const now = new Date();

  const result = await Booking.updateMany(
    {
      status: 'pending_payment',
      expiryTime: { $lt: now },
    },
    {
      $set: { status: 'expired' },
    }
  );

  return result.modifiedCount;
};

// Get all bookings
export const getAllBookings = async () => {
  await connectDB();

  const bookings = await Booking.find()
    .populate('modeId', 'name displayName color')
    .sort({ createdAt: -1 });
  return bookings;
};

// Get bookings by date
export const getBookingsByDate = async (date) => {
  await connectDB();

  const bookings = await Booking.find({ date })
    .populate('modeId', 'name displayName color')
    .sort({ time: 1 });
  return bookings;
};

// Block a date
export const blockDate = async (date, reason = '') => {
  await connectDB();

  const override = await DateOverride.findOneAndUpdate(
    { date },
    { type: 'blocked', reason },
    { upsert: true, new: true }
  );

  return override;
};

// Unblock a date
export const unblockDate = async (date) => {
  await connectDB();

  const result = await DateOverride.findOneAndDelete({ date, type: 'blocked' });
  return !!result;
};

// Clear any date override
export const clearDateOverride = async (date) => {
  await connectDB();

  const result = await DateOverride.findOneAndDelete({ date });
  return !!result;
};

// Get blocked dates
export const getBlockedDates = async () => {
  await connectDB();

  const overrides = await DateOverride.find({ type: 'blocked' });
  return overrides;
};

// Get all date overrides
export const getAllDateOverrides = async () => {
  await connectDB();

  const overrides = await DateOverride.find();
  return overrides;
};

// Cancel a booking
export const cancelBooking = async (date, time) => {
  await connectDB();

  const booking = await Booking.findOne({
    date,
    time,
    status: { $in: ['confirmed', 'pending_payment'] },
  });

  if (!booking) {
    return { success: false, message: 'No active booking found for this slot' };
  }

  booking.status = 'cancelled';
  await booking.save();

  return { success: true, booking };
};

// Get active consultation modes
export const getActiveConsultationModes = async () => {
  await connectDB();

  const modes = await ConsultationMode.find({ isActive: true })
    .select('_id name displayName description color sortOrder')
    .sort({ sortOrder: 1, createdAt: 1 });

  return modes;
};

// Get mode by ID
export const getModeById = async (modeId) => {
  await connectDB();

  const mode = await ConsultationMode.findById(modeId);
  return mode;
};

// Get mode by name (slug)
export const getModeByName = async (name) => {
  await connectDB();

  const mode = await ConsultationMode.findOne({ name, isActive: true });
  return mode;
};

// ============================================
// BACKWARD COMPATIBILITY FUNCTIONS
// These are kept for old admin APIs that haven't been migrated yet
// ============================================

// Get all slots (old Slot model - now uses TimeSlot)
export const getAllSlots = async () => {
  await connectDB();
  await initializeDefaultTimeSlots();

  const slots = await TimeSlot.find().sort({ time: 1 });
  // Map to old format for backward compatibility
  return slots.map(slot => ({
    _id: slot._id,
    time: slot.time,
    label: slot.label,
    active: slot.isActive,
    activeOnline: slot.isActive,
    activeInClinic: slot.isActive,
  }));
};

// Update slot status (old format - now uses TimeSlot)
export const updateSlotStatus = async (time, active, mode = null) => {
  await connectDB();

  const slot = await TimeSlot.findOneAndUpdate(
    { time },
    { isActive: active },
    { new: true }
  );

  if (!slot) {
    throw new Error('Slot not found');
  }

  return slot;
};

// Add a new slot (old format - now uses TimeSlot)
export const addSlot = async (time, label, mode = null) => {
  await connectDB();

  const existing = await TimeSlot.findOne({ time });
  if (existing) {
    throw new Error('Slot already exists');
  }

  const slot = await TimeSlot.create({
    time,
    label,
    isActive: true,
  });

  return slot;
};

// Remove a slot (old format - now uses TimeSlot)
export const removeSlot = async (time) => {
  await connectDB();

  const result = await TimeSlot.findOneAndDelete({ time });

  if (!result) {
    throw new Error('Slot not found');
  }

  // Also remove from all weekly schedules
  await WeeklySchedule.updateMany(
    { enabledSlots: time },
    { $pull: { enabledSlots: time } }
  );

  return { success: true };
};

// Set custom slots for a date (old format - still uses DateOverride)
export const setDateSlotOverrides = async (date, customSlots) => {
  await connectDB();

  const override = await DateOverride.findOneAndUpdate(
    { date },
    {
      type: 'custom_slots',
      customSlots: new Map(Object.entries(customSlots))
    },
    { upsert: true, new: true }
  );

  return override;
};
