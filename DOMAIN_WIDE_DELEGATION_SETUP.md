# 🔐 Domain-Wide Delegation Setup Guide

## Why This is Needed

Your service account needs **Domain-Wide Delegation** to:
- ✅ Add attendees to calendar events
- ✅ Send email invitations automatically
- ✅ Create Google Meet links
- ✅ Act on behalf of `team@curago.in`

---

## Step 1: Get Your Service Account's Client ID

Your service account email: `slotbooking@gtm-msml6cwc-ntk2y.iam.gserviceaccount.com`

**Find the Client ID:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `gtm-msml6cwc-ntk2y`
3. Go to **IAM & Admin** → **Service Accounts**
4. Click on your service account: `slotbooking@...`
5. Look for **"Unique ID"** or **"OAuth 2 Client ID"**
   - It's a long number like: `123456789012345678901`
   - **Copy this number** - you'll need it in the next step

**Alternative method:**
- Download the service account JSON key file
- Look for the `"client_id"` field in the JSON

---

## Step 2: Configure Domain-Wide Delegation in Workspace Admin

**Prerequisites:**
- You must be a **Google Workspace Super Admin**
- Your domain: `curago.in`

### Steps:

1. **Open Google Workspace Admin Console**
   - Go to: [admin.google.com](https://admin.google.com)
   - Sign in with your admin account

2. **Navigate to API Controls**
   - Click **Security** (left menu)
   - Click **Access and data control**
   - Click **API Controls**

3. **Manage Domain-Wide Delegation**
   - Scroll down to **Domain-wide delegation**
   - Click **MANAGE DOMAIN WIDE DELEGATION**

4. **Add New Client**
   - Click **Add new**
   - Enter the following:

   **Client ID:**
   ```
   [Paste the Client ID you copied from Step 1]
   ```

   **OAuth Scopes** (copy this exactly):
   ```
   https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events
   ```

5. **Authorize**
   - Click **Authorize**
   - Wait a few seconds for propagation

---

## Step 3: Verify Configuration

After setting up Domain-Wide Delegation, verify your `.env.local`:

```bash
# Workspace admin email (the user being impersonated)
DOCTOR_EMAIL=team@curago.in

# Service account credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=slotbooking@gtm-msml6cwc-ntk2y.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[your key]..."
GOOGLE_CALENDAR_ID=curagodoctor@gmail.com
```

---

## Step 4: Test the Integration

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Make a test booking:**
   - Go to `/book-consultation`
   - Fill in the form with a test email
   - Choose **"Online"** mode
   - Book a slot

3. **Expected Results:**
   - ✅ Calendar event created in `curagodoctor@gmail.com`
   - ✅ Google Meet link generated
   - ✅ Email invitation sent to patient
   - ✅ Email invitation sent to `team@curago.in`
   - ✅ Both can see the event in their calendars

---

## Troubleshooting

### Still Getting "Cannot Invite Attendees" Error?

**Wait 5-10 minutes** after setting up Domain-Wide Delegation. Changes can take time to propagate.

### Can't Find Client ID?

Run this command with your service account JSON file:
```bash
cat service-account-key.json | grep "client_id"
```

### Don't Have Workspace Admin Access?

Ask your Google Workspace administrator to:
1. Follow Step 2 above
2. Use the Client ID from your service account
3. Add the OAuth scopes for Calendar API

### Calendar ID vs Doctor Email

- **GOOGLE_CALENDAR_ID**: The calendar where events are stored (can be `curagodoctor@gmail.com` or `team@curago.in`)
- **DOCTOR_EMAIL**: The Workspace user being impersonated (must be `team@curago.in`)

---

## Production Checklist

Before going live:

- [ ] Domain-Wide Delegation configured in Workspace Admin
- [ ] Service account Client ID authorized with calendar scopes
- [ ] `DOCTOR_EMAIL` set to Workspace email (`team@curago.in`)
- [ ] Calendar ID points to correct calendar
- [ ] Test booking completes successfully
- [ ] Meet link generated for online consultations
- [ ] Email invitations received by both parties
- [ ] Webhook receives correct data

---

## Summary

**What Changed in Code:**
- Added `subject: process.env.DOCTOR_EMAIL` to GoogleAuth (lib/googleCalendar.js:15)
- This tells the service account to act as `team@curago.in`

**What You Need to Configure:**
1. Find service account's **Client ID** (Step 1)
2. Add it to **Domain-Wide Delegation** in Workspace Admin (Step 2)
3. Test the booking flow (Step 4)

**Once configured, you get full automation:**
- Automatic Meet links ✅
- Automatic email invitations ✅
- Professional production-grade integration ✅

---

Need help? Check that:
- You're using the Workspace admin account
- The Client ID is correct
- The OAuth scopes are exactly: `https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events`
- You've waited 5-10 minutes after setup
