import { google } from "googleapis";

// Initialize Google Calendar API with Domain-Wide Delegation using JWT
const getCalendarClient = () => {
  let privateKey;

  // Try base64 encoded key first (recommended for Vercel)
  if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
    } catch (error) {
      throw new Error('Failed to decode GOOGLE_PRIVATE_KEY_BASE64: ' + error.message);
    }
  }
  // Fallback to regular key with newline handling
  else if (process.env.GOOGLE_PRIVATE_KEY) {
    privateKey = process.env.GOOGLE_PRIVATE_KEY
      .replace(/\\n/g, '\n')  // Convert escaped newlines
      .trim();
  } else {
    throw new Error('Neither GOOGLE_PRIVATE_KEY_BASE64 nor GOOGLE_PRIVATE_KEY environment variable is set');
  }

  // Validate PEM format
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing BEGIN marker');
  }
  if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing END marker');
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    subject: process.env.DOCTOR_EMAIL, // Domain-Wide Delegation: Impersonate this user
  });

  return google.calendar({ version: "v3", auth });
};

/**
 * Create a calendar event
 * @param {Object} eventData - Event details
 * @param {string} eventData.date - Date in YYYY-MM-DD format
 * @param {string} eventData.time - Time in HH:MM format
 * @param {string} eventData.name - Patient name
 * @param {string} eventData.email - Patient email
 * @param {string} eventData.whatsapp - Patient WhatsApp number
 * @param {string} eventData.mode - "online" or "in-clinic"
 * @returns {Promise<Object>} Created event data
 */
export const createCalendarEvent = async (eventData) => {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set');
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('GOOGLE_PRIVATE_KEY is not set');
    }
    if (!process.env.DOCTOR_EMAIL) {
      throw new Error('DOCTOR_EMAIL is not set');
    }
    if (!process.env.GOOGLE_CALENDAR_ID) {
      throw new Error('GOOGLE_CALENDAR_ID is not set');
    }

    const calendar = getCalendarClient();
    const { date, time, name, email, whatsapp, mode } = eventData;

    // Create datetime strings (IST timezone)
    const startDateTime = `${date}T${time}:00+05:30`;
    // Add 30 minutes for end time
    const [hours, minutes] = time.split(":").map(Number);
    const endMinutes = minutes + 30;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(
      finalMinutes
    ).padStart(2, "0")}`;
    const endDateTime = `${date}T${endTime}:00+05:30`;

    // Event details
    const event = {
      summary: `Consultation - ${name}`,
      description: `
Patient Name: ${name}
WhatsApp: ${whatsapp}
Email: ${email}
Mode: ${mode === "online" ? "Online Consultation" : "In-Clinic Consultation"}
      `.trim(),
      start: {
        dateTime: startDateTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Asia/Kolkata",
      },
      attendees: [
        { email: process.env.DOCTOR_EMAIL },
        { email: email },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 }, // 30 minutes before
        ],
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
    };

    // Add Google Meet link for online consultations
    if (mode === "online") {
      event.conferenceData = {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    // Create the event and send invitations (Domain-Wide Delegation is working!)
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
      conferenceDataVersion: mode === "online" ? 1 : 0, // Required for Meet link creation
      sendUpdates: "all", // Send email invitations to all attendees
    });

    return {
      success: true,
      eventId: response.data.id,
      meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || null,
      htmlLink: response.data.htmlLink,
      calendarEventUrl: response.data.htmlLink,
    };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
};

/**
 * Get busy times for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of busy time slots
 */
export const getBusyTimes = async (date) => {
  try {
    const calendar = getCalendarClient();

    // Set time range for the entire day (IST)
    const timeMin = `${date}T00:00:00+05:30`;
    const timeMax = `${date}T23:59:59+05:30`;

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];
    const busyTimes = events.map((event) => {
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);
      return {
        start: start.toTimeString().substring(0, 5), // HH:MM format
        end: end.toTimeString().substring(0, 5),
      };
    });

    return busyTimes;
  } catch (error) {
    console.error("Error fetching busy times:", error);
    return [];
  }
};

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteCalendarEvent = async (eventId) => {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
      sendUpdates: "all",
    });
    return true;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
};
