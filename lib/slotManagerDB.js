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

// Initialize default consultation modes for a doctor
export const initializeDefaultModes = async (doctorId = null) => {
  await connectDB();

  const query = doctorId ? { doctorId } : { doctorId: { $exists: false } };
  const count = await ConsultationMode.countDocuments(query);

  if (count === 0 && doctorId) {
    const defaultModes = [
      {
        doctorId,
        name: 'online',
        displayName: 'Online Consultation',
        description: 'Video consultation from the comfort of your home',
        color: '#3B82F6',
        isActive: true,
        sortOrder: 1,
      },
      {
        doctorId,
        name: 'in-clinic',
        displayName: 'In-Clinic Visit',
        description: 'Visit the clinic for in-person consultation',
        color: '#10B981',
        isActive: true,
        sortOrder: 2,
      },
    ];

    for (const modeData of defaultModes) {
      const mode = await ConsultationMode.create(modeData);

      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        await WeeklySchedule.create({
          doctorId,
          modeId: mode._id,
          dayOfWeek,
          isEnabled: false,
          enabledSlots: [],
        });
      }
    }
    console.log('Default consultation modes initialized for doctor:', doctorId);
  }
};

// Initialize default time slots for a doctor
export const initializeDefaultTimeSlots = async (doctorId = null) => {
  await connectDB();

  if (doctorId) {
    await initializeDefaultModes(doctorId);
  }

  const query = doctorId ? { doctorId } : { doctorId: { $exists: false } };
  const count = await TimeSlot.countDocuments(query);

  if (count === 0 && doctorId) {
    const defaultTimes = [];
    for (let hour = 6; hour <= 22; hour++) {
      defaultTimes.push(`${hour.toString().padStart(2, '0')}:00`);
      defaultTimes.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    for (const time of defaultTimes) {
      const label = TimeSlot.timeToLabel(time);
      await TimeSlot.create({
        doctorId,
        time,
        label,
        isActive: true,
      });
    }
    console.log('Default time slots initialized for doctor:', doctorId);
  }
};

// Reset and recreate all time slots for a doctor
export const resetTimeSlots = async (doctorId = null) => {
  await connectDB();

  const query = doctorId ? { doctorId } : {};
  await TimeSlot.deleteMany(query);

  const defaultTimes = [];
  for (let hour = 0; hour < 24; hour++) {
    defaultTimes.push(`${hour.toString().padStart(2, '0')}:00`);
    defaultTimes.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  for (const time of defaultTimes) {
    const label = TimeSlot.timeToLabel(time);
    await TimeSlot.create({
      doctorId: doctorId || undefined,
      time,
      label,
      isActive: true,
    });
  }

  console.log('Time slots reset for doctor:', doctorId || 'global');
  return { success: true, count: defaultTimes.length };
};

// Get all active time slots for a doctor
export const getAllActiveTimeSlots = async (doctorId = null) => {
  await connectDB();

  if (doctorId) {
    await initializeDefaultTimeSlots(doctorId);
  }

  const query = doctorId ? { doctorId, isActive: true } : { isActive: true };
  const slots = await TimeSlot.find(query).sort({ time: 1 });
  return slots;
};

// Get effective slots for a date and mode
export const getEffectiveSlotsForDate = async (date, modeId, doctorId = null) => {
  await connectDB();

  const overrideQuery = doctorId ? { doctorId, date } : { date };
  const override = await DateOverride.findOne(overrideQuery);
  if (override && override.type === 'blocked') {
    return [];
  }

  const dayOfWeek = getDayOfWeek(date);
  const mode = await ConsultationMode.findById(modeId);
  if (!mode || !mode.isActive) {
    return [];
  }

  const scheduleQuery = doctorId
    ? { doctorId, modeId, dayOfWeek }
    : { modeId, dayOfWeek };
  const schedule = await WeeklySchedule.findOne(scheduleQuery);

  if (!schedule || !schedule.isEnabled) {
    return [];
  }

  const slotQuery = doctorId
    ? { doctorId, isActive: true }
    : { isActive: true };
  const allTimeSlots = await TimeSlot.find(slotQuery).sort({ time: 1 });

  const enabledSlots = allTimeSlots.filter(slot =>
    schedule.enabledSlots.includes(slot.time)
  );

  return enabledSlots.map(slot => ({
    time: slot.time,
    label: slot.label,
    isActive: true,
  }));
};

// Check if a slot is booked for ANY mode
export const isSlotBooked = async (date, time, doctorId = null) => {
  await connectDB();
  await releaseExpiredReservations(doctorId);

  const query = {
    date,
    time,
    status: { $in: ['confirmed', 'pending_payment'] },
  };
  if (doctorId) query.doctorId = doctorId;

  const booking = await Booking.findOne(query);
  return !!booking;
};

// Check if slot is available for booking
export const isSlotAvailable = async (date, time, modeId, doctorId = null) => {
  await connectDB();

  const dayOfWeek = getDayOfWeek(date);
  const scheduleQuery = doctorId
    ? { doctorId, modeId, dayOfWeek }
    : { modeId, dayOfWeek };
  const schedule = await WeeklySchedule.findOne(scheduleQuery);

  if (!schedule || !schedule.isEnabled || !schedule.enabledSlots.includes(time)) {
    return false;
  }

  const isBooked = await isSlotBooked(date, time, doctorId);
  return !isBooked;
};

// Create a reservation
export const createReservation = async (bookingData, doctorId = null) => {
  await connectDB();

  const query = {
    date: bookingData.date,
    time: bookingData.time,
    status: { $in: ['confirmed', 'pending_payment'] },
  };
  if (doctorId) query.doctorId = doctorId;

  const existing = await Booking.findOne(query);
  if (existing) {
    throw new Error('Slot is already booked or reserved');
  }

  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

  const booking = await Booking.create({
    doctorId: doctorId || undefined,
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
export const getReservationById = async (id, doctorId = null) => {
  await connectDB();

  const query = { _id: id };
  if (doctorId) query.doctorId = doctorId;

  const booking = await Booking.findOne(query).populate('modeId', 'name displayName color');
  return booking;
};

// Confirm reservation
export const confirmReservation = async (id, paymentData, doctorId = null) => {
  await connectDB();

  const query = { _id: id };
  if (doctorId) query.doctorId = doctorId;

  const booking = await Booking.findOne(query);

  if (!booking) {
    return { success: false, message: 'Reservation not found' };
  }

  if (booking.status !== 'pending_payment') {
    return { success: false, message: 'Reservation is not pending payment' };
  }

  if (booking.expiryTime && new Date() > booking.expiryTime) {
    booking.status = 'expired';
    await booking.save();
    return { success: false, message: 'Reservation has expired' };
  }

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
export const releaseExpiredReservations = async (doctorId = null) => {
  await connectDB();

  const now = new Date();
  const query = {
    status: 'pending_payment',
    expiryTime: { $lt: now },
  };
  if (doctorId) query.doctorId = doctorId;

  const result = await Booking.updateMany(query, {
    $set: { status: 'expired' },
  });

  return result.modifiedCount;
};

// Get all bookings for a doctor
export const getAllBookings = async (doctorId = null) => {
  await connectDB();

  const query = doctorId ? { doctorId } : {};
  const bookings = await Booking.find(query)
    .populate('modeId', 'name displayName color')
    .sort({ createdAt: -1 });
  return bookings;
};

// Get bookings by date
export const getBookingsByDate = async (date, doctorId = null) => {
  await connectDB();

  const query = { date };
  if (doctorId) query.doctorId = doctorId;

  const bookings = await Booking.find(query)
    .populate('modeId', 'name displayName color')
    .sort({ time: 1 });
  return bookings;
};

// Block a date
export const blockDate = async (date, reason = '', doctorId = null) => {
  await connectDB();

  const query = doctorId ? { doctorId, date } : { date };
  const update = { type: 'blocked', reason };
  if (doctorId) update.doctorId = doctorId;

  const override = await DateOverride.findOneAndUpdate(
    query,
    update,
    { upsert: true, new: true }
  );

  return override;
};

// Unblock a date
export const unblockDate = async (date, doctorId = null) => {
  await connectDB();

  const query = { date, type: 'blocked' };
  if (doctorId) query.doctorId = doctorId;

  const result = await DateOverride.findOneAndDelete(query);
  return !!result;
};

// Clear any date override
export const clearDateOverride = async (date, doctorId = null) => {
  await connectDB();

  const query = { date };
  if (doctorId) query.doctorId = doctorId;

  const result = await DateOverride.findOneAndDelete(query);
  return !!result;
};

// Get blocked dates
export const getBlockedDates = async (doctorId = null) => {
  await connectDB();

  const query = { type: 'blocked' };
  if (doctorId) query.doctorId = doctorId;

  const overrides = await DateOverride.find(query);
  return overrides;
};

// Get all date overrides
export const getAllDateOverrides = async (doctorId = null) => {
  await connectDB();

  const query = doctorId ? { doctorId } : {};
  const overrides = await DateOverride.find(query);
  return overrides;
};

// Cancel a booking
export const cancelBooking = async (date, time, doctorId = null) => {
  await connectDB();

  const query = {
    date,
    time,
    status: { $in: ['confirmed', 'pending_payment'] },
  };
  if (doctorId) query.doctorId = doctorId;

  const booking = await Booking.findOne(query);

  if (!booking) {
    return { success: false, message: 'No active booking found for this slot' };
  }

  booking.status = 'cancelled';
  await booking.save();

  return { success: true, booking };
};

// Get active consultation modes
export const getActiveConsultationModes = async (doctorId = null) => {
  await connectDB();

  const query = { isActive: true };
  if (doctorId) query.doctorId = doctorId;

  const modes = await ConsultationMode.find(query)
    .select('_id name displayName description color sortOrder')
    .sort({ sortOrder: 1, createdAt: 1 });

  return modes;
};

// Get mode by ID
export const getModeById = async (modeId, doctorId = null) => {
  await connectDB();

  const query = { _id: modeId };
  if (doctorId) query.doctorId = doctorId;

  const mode = await ConsultationMode.findOne(query);
  return mode;
};

// Get mode by name
export const getModeByName = async (name, doctorId = null) => {
  await connectDB();

  const query = { name, isActive: true };
  if (doctorId) query.doctorId = doctorId;

  const mode = await ConsultationMode.findOne(query);
  return mode;
};

// ============================================
// BACKWARD COMPATIBILITY FUNCTIONS
// ============================================

// Get all slots
export const getAllSlots = async (doctorId = null) => {
  await connectDB();

  if (doctorId) {
    await initializeDefaultTimeSlots(doctorId);
  }

  const query = doctorId ? { doctorId } : {};
  const slots = await TimeSlot.find(query).sort({ time: 1 });

  return slots.map(slot => ({
    _id: slot._id,
    time: slot.time,
    label: slot.label,
    active: slot.isActive,
    activeOnline: slot.isActive,
    activeInClinic: slot.isActive,
  }));
};

// Update slot status
export const updateSlotStatus = async (time, active, mode = null, doctorId = null) => {
  await connectDB();

  const query = { time };
  if (doctorId) query.doctorId = doctorId;

  const slot = await TimeSlot.findOneAndUpdate(
    query,
    { isActive: active },
    { new: true }
  );

  if (!slot) {
    throw new Error('Slot not found');
  }

  return slot;
};

// Add a new slot
export const addSlot = async (time, label, mode = null, doctorId = null) => {
  await connectDB();

  const query = { time };
  if (doctorId) query.doctorId = doctorId;

  const existing = await TimeSlot.findOne(query);
  if (existing) {
    throw new Error('Slot already exists');
  }

  const slot = await TimeSlot.create({
    doctorId: doctorId || undefined,
    time,
    label,
    isActive: true,
  });

  return slot;
};

// Remove a slot
export const removeSlot = async (time, doctorId = null) => {
  await connectDB();

  const query = { time };
  if (doctorId) query.doctorId = doctorId;

  const result = await TimeSlot.findOneAndDelete(query);

  if (!result) {
    throw new Error('Slot not found');
  }

  // Also remove from all weekly schedules
  const scheduleQuery = doctorId ? { doctorId, enabledSlots: time } : { enabledSlots: time };
  await WeeklySchedule.updateMany(
    scheduleQuery,
    { $pull: { enabledSlots: time } }
  );

  return { success: true };
};

// Set custom slots for a date
export const setDateSlotOverrides = async (date, customSlots, doctorId = null) => {
  await connectDB();

  const query = { date };
  if (doctorId) query.doctorId = doctorId;

  const update = {
    type: 'custom_slots',
    customSlots: new Map(Object.entries(customSlots)),
  };
  if (doctorId) update.doctorId = doctorId;

  const override = await DateOverride.findOneAndUpdate(
    query,
    update,
    { upsert: true, new: true }
  );

  return override;
};
