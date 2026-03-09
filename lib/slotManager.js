import fs from "fs";
import path from "path";

// Detect if running in serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;

// Use /tmp directory in serverless, data directory locally
// WARNING: /tmp in serverless is ephemeral - data will be lost between deployments
// For production, consider using a database (MongoDB, PostgreSQL, Vercel KV, etc.)
const getDataDir = () => {
  if (isServerless) {
    return "/tmp";
  }
  return path.join(process.cwd(), "data");
};

const DATA_DIR = getDataDir();
const SLOTS_FILE = path.join(DATA_DIR, "slots.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const DATE_OVERRIDES_FILE = path.join(DATA_DIR, "date-overrides.json");

// Ensure data directory exists
const ensureDataDir = () => {
  if (!isServerless) {
    // Only create directory in local environment
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
  // In serverless, /tmp already exists, no need to create
};

// Initialize slots file if it doesn't exist
const initializeSlotsFile = () => {
  ensureDataDir();
  if (!fs.existsSync(SLOTS_FILE)) {
    const defaultSlots = {
      slots: [
        // Default time slots from 5 PM to 11 PM (30-minute intervals)
        { time: "17:00", label: "5:00 PM", active: true },
        { time: "17:30", label: "5:30 PM", active: true },
        { time: "18:00", label: "6:00 PM", active: true },
        { time: "18:30", label: "6:30 PM", active: true },
        { time: "19:00", label: "7:00 PM", active: true },
        { time: "19:30", label: "7:30 PM", active: true },
        { time: "20:00", label: "8:00 PM", active: true },
        { time: "20:30", label: "8:30 PM", active: true },
        { time: "21:00", label: "9:00 PM", active: true },
        { time: "21:30", label: "9:30 PM", active: true },
        { time: "22:00", label: "10:00 PM", active: true },
        { time: "22:30", label: "10:30 PM", active: true },
      ],
    };
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(defaultSlots, null, 2));
  }
};

// Initialize bookings file if it doesn't exist
const initializeBookingsFile = () => {
  ensureDataDir();
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings: [] }, null, 2));
  }
};

// Initialize date overrides file if it doesn't exist
const initializeDateOverridesFile = () => {
  ensureDataDir();
  if (!fs.existsSync(DATE_OVERRIDES_FILE)) {
    fs.writeFileSync(
      DATE_OVERRIDES_FILE,
      JSON.stringify({ blockedDates: [], dateSlots: {} }, null, 2)
    );
  }
};

// Get all slots
export const getAllSlots = () => {
  initializeSlotsFile();
  const data = fs.readFileSync(SLOTS_FILE, "utf8");
  return JSON.parse(data).slots;
};

// Get active slots only
export const getActiveSlots = () => {
  return getAllSlots().filter((slot) => slot.active);
};

// Update slot status
export const updateSlotStatus = (time, active) => {
  initializeSlotsFile();
  const data = JSON.parse(fs.readFileSync(SLOTS_FILE, "utf8"));
  const slot = data.slots.find((s) => s.time === time);
  if (slot) {
    slot.active = active;
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
    return true;
  }
  return false;
};

// Add new slot
export const addSlot = (time, label) => {
  initializeSlotsFile();
  const data = JSON.parse(fs.readFileSync(SLOTS_FILE, "utf8"));
  // Check if slot already exists
  if (data.slots.find((s) => s.time === time)) {
    return { success: false, message: "Slot already exists" };
  }
  data.slots.push({ time, label, active: true });
  // Sort by time
  data.slots.sort((a, b) => a.time.localeCompare(b.time));
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
  return { success: true, message: "Slot added successfully" };
};

// Remove slot
export const removeSlot = (time) => {
  initializeSlotsFile();
  const data = JSON.parse(fs.readFileSync(SLOTS_FILE, "utf8"));
  data.slots = data.slots.filter((s) => s.time !== time);
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
  return { success: true, message: "Slot removed successfully" };
};

// Get all bookings
export const getAllBookings = () => {
  initializeBookingsFile();
  const data = fs.readFileSync(BOOKINGS_FILE, "utf8");
  return JSON.parse(data).bookings;
};

// Check if slot is booked for a specific date (regardless of mode)
// Also checks for pending payment reservations that haven't expired
export const isSlotBooked = (date, time) => {
  const bookings = getAllBookings();
  const now = new Date();

  return bookings.some((booking) => {
    if (booking.date !== date || booking.time !== time) return false;
    if (booking.status === "cancelled" || booking.status === "expired") return false;

    // Check if pending payment reservation is still valid
    if (booking.status === "pending_payment") {
      const expiryTime = new Date(booking.expiryTime);
      return expiryTime > now; // Only block if not expired
    }

    return booking.status === "confirmed";
  });
};

// Add booking
export const addBooking = (bookingData) => {
  initializeBookingsFile();
  const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));
  const booking = {
    id: Date.now().toString(),
    ...bookingData,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  data.bookings.push(booking);
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
  return booking;
};

// Get bookings for a specific date (regardless of mode)
export const getBookingsForDate = (date) => {
  const bookings = getAllBookings();
  return bookings.filter(
    (booking) =>
      booking.date === date &&
      booking.status !== "cancelled"
  );
};

// ============ RESERVATION MANAGEMENT (Payment Flow) ============

// Create a temporary reservation (pre-payment)
export const createReservation = (bookingData) => {
  initializeBookingsFile();
  const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));

  // Calculate expiry time (10 minutes from now)
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);

  const reservation = {
    id: Date.now().toString(),
    ...bookingData,
    status: "pending_payment",
    expiryTime: expiryTime.toISOString(),
    createdAt: new Date().toISOString(),
  };

  data.bookings.push(reservation);
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
  return reservation;
};

// Confirm a reservation (after payment)
export const confirmReservation = (reservationId, paymentData) => {
  initializeBookingsFile();
  const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));

  const reservation = data.bookings.find((b) => b.id === reservationId);

  if (!reservation) {
    return { success: false, message: "Reservation not found" };
  }

  if (reservation.status !== "pending_payment") {
    return { success: false, message: "Reservation already processed" };
  }

  // Check if reservation has expired
  const expiryTime = new Date(reservation.expiryTime);
  const now = new Date();
  if (expiryTime < now) {
    reservation.status = "expired";
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
    return { success: false, message: "Reservation has expired" };
  }

  // Update reservation to confirmed
  reservation.status = "confirmed";
  reservation.confirmedAt = new Date().toISOString();
  reservation.paymentId = paymentData.paymentId;
  reservation.paymentSignature = paymentData.paymentSignature;
  reservation.eventId = paymentData.eventId;
  reservation.meetLink = paymentData.meetLink;
  reservation.calendarEventUrl = paymentData.calendarEventUrl;

  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
  return { success: true, booking: reservation };
};

// Get a reservation by ID
export const getReservationById = (reservationId) => {
  const bookings = getAllBookings();
  return bookings.find((b) => b.id === reservationId);
};

// Release expired reservations (cleanup function)
export const releaseExpiredReservations = () => {
  initializeBookingsFile();
  const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));
  const now = new Date();
  let expiredCount = 0;

  data.bookings = data.bookings.map((booking) => {
    if (booking.status === "pending_payment") {
      const expiryTime = new Date(booking.expiryTime);
      if (expiryTime < now) {
        booking.status = "expired";
        expiredCount++;
      }
    }
    return booking;
  });

  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
  return { success: true, expiredCount };
};

// ============ DATE-SPECIFIC SLOT MANAGEMENT ============

// Block a specific date
export const blockDate = (date, reason = "Unavailable") => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));

  // Check if date is already blocked
  if (data.blockedDates.some((d) => d.date === date)) {
    return { success: false, message: "Date already blocked" };
  }

  data.blockedDates.push({ date, reason, blockedAt: new Date().toISOString() });
  fs.writeFileSync(DATE_OVERRIDES_FILE, JSON.stringify(data, null, 2));
  return { success: true, message: "Date blocked successfully" };
};

// Unblock a specific date
export const unblockDate = (date) => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));

  data.blockedDates = data.blockedDates.filter((d) => d.date !== date);
  fs.writeFileSync(DATE_OVERRIDES_FILE, JSON.stringify(data, null, 2));
  return { success: true, message: "Date unblocked successfully" };
};

// Check if a date is blocked
export const isDateBlocked = (date) => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));
  return data.blockedDates.some((d) => d.date === date);
};

// Get all blocked dates
export const getBlockedDates = () => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));
  return data.blockedDates;
};

// Set date-specific slot overrides
export const setDateSlotOverrides = (date, slotOverrides) => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));

  // slotOverrides is an object: { "17:00": true, "17:30": false, ... }
  data.dateSlots[date] = slotOverrides;
  fs.writeFileSync(DATE_OVERRIDES_FILE, JSON.stringify(data, null, 2));
  return { success: true, message: "Date-specific slots updated" };
};

// Get date-specific slot overrides
export const getDateSlotOverrides = (date) => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));
  return data.dateSlots[date] || null;
};

// Clear date-specific slot overrides
export const clearDateSlotOverrides = (date) => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));

  delete data.dateSlots[date];
  fs.writeFileSync(DATE_OVERRIDES_FILE, JSON.stringify(data, null, 2));
  return { success: true, message: "Date-specific slots cleared" };
};

// Get effective slots for a specific date (considering overrides)
export const getEffectiveSlotsForDate = (date) => {
  // Check if date is blocked
  if (isDateBlocked(date)) {
    return [];
  }

  const defaultSlots = getActiveSlots();
  const dateOverrides = getDateSlotOverrides(date);

  // If no date-specific overrides, return default active slots
  if (!dateOverrides) {
    return defaultSlots;
  }

  // Apply date-specific overrides
  return defaultSlots.filter((slot) => {
    // If override exists for this slot, use it; otherwise use default active status
    if (dateOverrides.hasOwnProperty(slot.time)) {
      return dateOverrides[slot.time] === true;
    }
    return true; // Use default if no override
  });
};

// Get all date overrides (for admin panel)
export const getAllDateOverrides = () => {
  initializeDateOverridesFile();
  const data = JSON.parse(fs.readFileSync(DATE_OVERRIDES_FILE, "utf8"));
  return data;
};
