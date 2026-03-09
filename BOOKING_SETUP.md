# Book Consultation Setup Guide

This guide will help you complete the setup of the consultation booking system with Google Calendar integration.

## ✅ What's Been Implemented

1. **Complete booking system** with Google Calendar integration
2. **Admin panel** for managing slots
3. **7-day date picker** for users
4. **Slot availability tracking** (30-minute slots from 5 PM to 11 PM)
5. **Online/In-Clinic modes** with Google Meet integration for online consultations
6. **Email invitations** sent automatically to both doctor and patient

## 🔧 Required Configuration Steps

### 1. Update Environment Variables

Open `.env.local` and update these values:

```env
# Google Calendar ID (IMPORTANT!)
GOOGLE_CALENDAR_ID=your-actual-calendar-id@gmail.com

# Doctor Contact Info
DOCTOR_EMAIL=your-actual-email@example.com
DOCTOR_NAME=Dr. Yuvaraj T

# Admin Credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123

# Session Secret (CHANGE THIS!)
SESSION_SECRET=generate-a-random-secure-string-here
```

**How to find your Google Calendar ID:**
1. Go to [Google Calendar](https://calendar.google.com)
2. Click on the calendar you want to use (left sidebar)
3. Click the three dots → "Settings and sharing"
4. Scroll down to "Integrate calendar"
5. Copy the "Calendar ID" (looks like `abc123@group.calendar.google.com` or your email)

### 2. Grant Calendar Access to Service Account

**CRITICAL STEP:** The service account needs access to your calendar:

1. Go to [Google Calendar](https://calendar.google.com)
2. Find the calendar you want to use
3. Click the three dots → "Settings and sharing"
4. Scroll to "Share with specific people or groups"
5. Click "+ Add people and groups"
6. Enter this email: `slotbooking@gtm-msml6cwc-ntk2y.iam.gserviceaccount.com`
7. Set permission to **"Make changes to events"**
8. Click "Send"

### 3. Update WhatsApp Number

In `/app/book-consultation/page.js`, update the WhatsApp link (line 419):

```javascript
href="https://wa.me/919876543210"  // Change this number
```

## 🚀 Testing the System

### Test User Booking Flow:
1. Navigate to `/book-consultation`
2. Fill in the form
3. Select a date and time slot
4. Submit the booking
5. Check your calendar - event should appear
6. Check your email - you should receive an invitation

### Test Admin Panel:
1. Navigate to `/admin`
2. Login with credentials from `.env.local`
3. Try adding/removing slots
4. Try activating/deactivating slots
5. View recent bookings

## 📂 File Structure

```
/app
  /admin
    page.js                          # Admin login page
    /dashboard
      page.js                        # Slot management dashboard (with date-specific tabs)
  /book-consultation
    page.js                          # User booking page
  /api
    /admin
      /login/route.js                # Admin authentication
      /slots/route.js                # Slot CRUD operations
      /date-overrides/route.js       # Date blocking & custom slots API
    /available-slots/route.js        # Get available slots for users
    /book-consultation/route.js      # Handle booking submissions

/lib
  slotManager.js                     # Slot & booking database + date management
  googleCalendar.js                  # Google Calendar API integration
  auth.js                            # Admin authentication utilities

/data                                # Auto-generated (in .gitignore)
  slots.json                         # Slot configuration
  bookings.json                      # Booking records
  date-overrides.json                # Blocked dates & date-specific slots
```

## 🎯 Features Overview

### User Features:
- ✅ Select consultation mode (Online/In-Clinic)
- ✅ View next 7 days
- ✅ See available time slots
- ✅ Real-time slot availability
- ✅ Google Meet link for online consultations
- ✅ Email confirmations

### Admin Features:
- ✅ Secure login
- ✅ Add/remove time slots
- ✅ Activate/deactivate slots globally
- ✅ **Block entire dates** (holidays, vacations)
- ✅ **Date-specific slot overrides** (custom hours for specific dates)
- ✅ View all bookings
- ✅ Manage slot availability (global and per-date)
- ✅ Two-tab dashboard: Default Slots & Date-Specific Management

### Technical Features:
- ✅ Google Calendar API integration
- ✅ Service account authentication
- ✅ 30-minute slot intervals
- ✅ Duplicate booking prevention
- ✅ Timezone handling (IST)
- ✅ Email invitations with Google Meet links

## 🔒 Security Notes

1. **Change default admin credentials** in `.env.local`
2. **Generate a secure SESSION_SECRET** (use random string generator)
3. **Never commit `.env.local`** to version control (already in .gitignore)
4. **Data folder** is in .gitignore to prevent exposing booking data

## 🐛 Troubleshooting

### "Failed to create calendar event"
- Verify service account has access to your calendar
- Check GOOGLE_CALENDAR_ID is correct
- Ensure private key is properly formatted in .env.local

### "Unauthorized" in admin panel
- Clear localStorage and login again
- Check admin credentials in .env.local
- Verify SESSION_SECRET is set

### Slots not showing
- Check if admin has activated slots in dashboard
- Verify API endpoints are accessible
- Check browser console for errors

### No email invitations
- Verify DOCTOR_EMAIL is correct
- Check Google Calendar settings allow sending invitations
- Service account needs calendar permissions

## 📞 Support

For issues:
1. Check browser console for errors
2. Check server logs (terminal running `npm run dev`)
3. Verify all environment variables are set correctly

## 📅 Date-Specific Management (NEW!)

The admin panel now has **two tabs**:

### Tab 1: Default Slots
- Manage your standard time slots (5 PM - 10:30 PM by default)
- Add/remove/activate/deactivate slots
- These apply to all dates unless overridden

### Tab 2: Date-Specific Management

#### **Block Entire Dates:**
1. Select a date from the date picker
2. Add optional reason (e.g., "Holiday", "Vacation")
3. Click "Block Entire Date"
4. Users won't see this date as available

**Use Cases:**
- Public holidays
- Personal time off
- Clinic closed days
- Special events

#### **Custom Slots for Specific Dates:**
1. Select a date
2. Click on time slots to toggle custom settings
3. Slots show:
   - **Highlighted with ring:** Custom override active
   - **Faded:** Using default settings
4. Click "Save Date-Specific Slots"

**Use Cases:**
- Extended hours on Tuesdays (add 11 PM - 1 AM slots for that date)
- Shorter hours on Fridays (disable 9-11 PM for that date only)
- Special consultation hours for specific dates

**Visual Indicators:**
- Green ring = Custom Active for this date
- Red ring = Custom Disabled for this date
- Faded = Using default settings

#### **Management Sidebar:**
- **Blocked Dates:** See all blocked dates, unblock with one click
- **Custom Slot Dates:** See all dates with custom hours, click "Edit" to modify

**Priority Order:**
1. If date is **blocked** → No slots available
2. If date has **custom slots** → Use custom settings
3. Otherwise → Use default slot settings

## 🎨 Customization

### Change slot times:
Edit `/lib/slotManager.js` - modify the `defaultSlots` array

### Change slot duration:
Update `/lib/googleCalendar.js` - modify the endTime calculation (currently +30 minutes)

### Change number of days shown:
Update `/app/api/available-slots/route.js` - modify the `Array.from({ length: 7 })` line

### Change theme colors:
All styling uses Tailwind CSS classes - colors are defined in `/app/globals.css`

---

## ✅ Final Checklist

- [ ] Update GOOGLE_CALENDAR_ID in .env.local
- [ ] Grant calendar access to service account
- [ ] Update DOCTOR_EMAIL in .env.local
- [ ] Change ADMIN_USERNAME and ADMIN_PASSWORD
- [ ] Generate and set SESSION_SECRET
- [ ] Update WhatsApp number in book-consultation page
- [ ] Test booking flow (user side)
- [ ] Test admin panel
- [ ] Verify calendar events are created
- [ ] Verify email invitations are sent
- [ ] Test Google Meet links (for online consultations)

**Once complete, your booking system is ready to go! 🚀**
