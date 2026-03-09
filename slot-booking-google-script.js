// ============================================================
// SLOT BOOKING & PAYMENT TRACKING - Google Apps Script
// ============================================================
// Add this to your existing Google Apps Script project
// This handles slot bookings, payment tracking, invoice generation
// and sends confirmation emails
// ============================================================

// ADD TO CONFIG at the top of your main script:
const SLOT_BOOKING_CONFIG = {
  BOOKING_SHEET_NAME: 'Slot Bookings',
  PAYMENT_SHEET_NAME: 'Slot Booking Payments',
  EMAIL_SUBJECT_BOOKING: 'Booking Confirmed - Dr. Yuvaraj T Consultation',
  EMAIL_SUBJECT_PAYMENT: 'Payment Successful - Slot Booking Invoice',
  SLOT_BOOKING_FEE: 150,
  CONSULTATION_FEE: 1000,
  DOCTOR_NAME: 'Dr. Yuvaraj T',
  DOCTOR_CREDENTIALS: 'MCh Surgical Gastroenterology (KEMH, Mumbai) | FMAS, FACRSI',
  CLINIC_NAME: 'SRV Hospital',
  CLINIC_ADDRESS: 'Tilak Nagar, Chembur, Mumbai',
  COMPANY_GST: 'YOUR_GST_NUMBER', // Optional: Add your GST number
  INVOICE_PREFIX: 'INV-SB-', // Invoice number prefix
};

// ============================================================
// SLOT BOOKING SUBMISSION HANDLER
// ============================================================
// Add this to your doPost function's switch statement:
// else if (data.testType === 'slot_booking') {
//   response = handleSlotBookingSubmission(data);
// }

function handleSlotBookingSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingSheet = ss.getSheetByName(SLOT_BOOKING_CONFIG.BOOKING_SHEET_NAME);
  const paymentSheet = ss.getSheetByName(SLOT_BOOKING_CONFIG.PAYMENT_SHEET_NAME);

  if (!bookingSheet) {
    throw new Error('Sheet "' + SLOT_BOOKING_CONFIG.BOOKING_SHEET_NAME + '" not found. Please create it.');
  }
  if (!paymentSheet) {
    throw new Error('Sheet "' + SLOT_BOOKING_CONFIG.PAYMENT_SHEET_NAME + '" not found. Please create it.');
  }

  const timestamp = new Date();
  const invoiceNumber = generateInvoiceNumber();

  // Generate meeting link (if online consultation)
  const meetLink = data.mode === 'online' ? generateMeetingLink(data) : 'N/A (In-Clinic)';

  // Save to Booking Sheet
  const bookingRowData = [
    timestamp, // A: Timestamp
    invoiceNumber, // B: Invoice Number
    data.name, // C: Name
    data.age, // D: Age
    data.gender, // E: Gender
    data.email || '', // F: Email
    data.whatsapp, // G: WhatsApp Number
    data.mode, // H: Consultation Mode (online/in-clinic)
    data.date, // I: Appointment Date
    data.time, // J: Appointment Time
    data.timeLabel || data.time, // K: Time Label (e.g., "5:00 PM")
    meetLink, // L: Meeting Link
    data.paymentId || '', // M: Razorpay Payment ID
    data.paymentSignature || '', // N: Payment Signature
    SLOT_BOOKING_CONFIG.SLOT_BOOKING_FEE, // O: Amount Paid (₹150)
    'Confirmed', // P: Booking Status
    data.eventId || '', // Q: Calendar Event ID
    data.calendarEventUrl || '', // R: Calendar Event URL
    '' // S: Notes
  ];

  bookingSheet.appendRow(bookingRowData);
  Logger.log('Booking saved to sheet: ' + invoiceNumber);

  // Save to Payment Sheet
  const paymentRowData = [
    timestamp, // A: Payment Timestamp
    invoiceNumber, // B: Invoice Number
    data.name, // C: Customer Name
    data.whatsapp, // D: WhatsApp Number
    data.email || '', // E: Email
    data.paymentId || '', // F: Razorpay Payment ID
    SLOT_BOOKING_CONFIG.SLOT_BOOKING_FEE, // G: Amount (₹150)
    'Success', // H: Payment Status
    data.paymentMethod || 'Razorpay', // I: Payment Method
    data.date + ' ' + data.timeLabel, // J: Booking Details
    data.mode, // K: Consultation Mode
    '' // L: Notes
  ];

  paymentSheet.appendRow(paymentRowData);
  Logger.log('Payment recorded: ' + data.paymentId);

  // Generate Invoice PDF
  const invoiceData = {
    invoiceNumber: invoiceNumber,
    invoiceDate: timestamp,
    name: data.name,
    age: data.age,
    gender: data.gender,
    email: data.email || '',
    whatsapp: data.whatsapp,
    mode: data.mode,
    date: data.date,
    time: data.timeLabel || data.time,
    meetLink: meetLink,
    amountPaid: SLOT_BOOKING_CONFIG.SLOT_BOOKING_FEE,
    paymentId: data.paymentId || '',
    eventId: data.eventId || ''
  };

  const invoicePdfFile = savePdfToDrive(
    generateInvoicePdf(invoiceData),
    'Invoice_' + invoiceNumber + '_' + data.name.replace(/\s+/g, '_')
  );
  const invoicePdfUrl = invoicePdfFile.getUrl();

  // Update booking sheet with invoice URL
  const lastRow = bookingSheet.getLastRow();
  bookingSheet.getRange(lastRow, 20).setValue(invoicePdfUrl); // Column T: Invoice URL

  // Send confirmation email with invoice
  if (data.email && data.email.trim() !== '') {
    sendBookingConfirmationEmail(invoiceData, invoicePdfFile);
    Logger.log('Confirmation email sent to: ' + data.email);
  } else {
    Logger.log('No email provided, skipping email send');
  }

  return {
    success: true,
    message: 'Slot booking confirmed and invoice generated',
    invoiceNumber: invoiceNumber,
    invoiceUrl: invoicePdfUrl,
    meetLink: meetLink
  };
}

// ============================================================
// GENERATE INVOICE NUMBER
// ============================================================
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return SLOT_BOOKING_CONFIG.INVOICE_PREFIX + year + month + day + '-' + random;
}

// ============================================================
// GENERATE MEETING LINK (PLACEHOLDER - Customize as needed)
// ============================================================
function generateMeetingLink(data) {
  // OPTION 1: If you're using Google Meet (requires Calendar API)
  // This is a placeholder - you'll need to integrate with Google Calendar API
  // to create actual meeting links

  // OPTION 2: Use a fixed Google Meet link or Zoom link
  // return 'https://meet.google.com/your-meeting-room';

  // OPTION 3: Generate unique link (placeholder)
  const meetingId = 'meet-' + Date.now().toString(36);
  return 'https://meet.google.com/' + meetingId;

  // NOTE: To create actual Google Meet links, you need to:
  // 1. Enable Google Calendar API in Apps Script
  // 2. Create a calendar event with conferenceData
  // Example code is in the next function
}

// ============================================================
// GENERATE INVOICE PDF
// ============================================================
function generateInvoicePdf(data) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      color: #333;
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #096b17;
    }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #096b17;
      margin-bottom: 5px;
    }
    .company-details {
      font-size: 11px;
      color: #666;
      line-height: 1.6;
    }
    .invoice-title {
      text-align: right;
      flex: 1;
    }
    .invoice-title h1 {
      font-size: 28px;
      color: #096b17;
      margin-bottom: 5px;
    }
    .invoice-title p {
      font-size: 12px;
      color: #666;
    }
    .invoice-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .meta-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #096b17;
    }
    .meta-box h3 {
      font-size: 13px;
      color: #096b17;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .meta-box p {
      font-size: 11px;
      margin: 3px 0;
      color: #555;
    }
    .meta-box strong {
      color: #333;
    }
    .booking-details {
      background: #096b17;
      color: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .booking-details h2 {
      font-size: 18px;
      margin-bottom: 15px;
    }
    .booking-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .booking-item {
      font-size: 12px;
    }
    .booking-item strong {
      display: block;
      opacity: 0.9;
      margin-bottom: 3px;
    }
    .booking-item span {
      display: block;
      font-size: 14px;
      font-weight: bold;
    }
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .payment-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      color: #096b17;
      border-bottom: 2px solid #096b17;
    }
    .payment-table td {
      padding: 12px;
      font-size: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .total-row td {
      font-weight: bold;
      font-size: 14px;
      background: #f8f9fa;
      border-top: 2px solid #096b17;
      border-bottom: 2px solid #096b17;
    }
    .meet-link-box {
      background: #e7f5ff;
      border: 2px solid #339af0;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: center;
    }
    .meet-link-box h3 {
      color: #1864ab;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .meet-link-box a {
      color: #1864ab;
      font-size: 12px;
      word-break: break-all;
    }
    .footer-notes {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
    }
    .footer-notes h3 {
      font-size: 13px;
      color: #096b17;
      margin-bottom: 10px;
    }
    .footer-notes ul {
      padding-left: 20px;
      font-size: 11px;
      color: #666;
      line-height: 1.8;
    }
    .footer-notes li {
      margin: 5px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
      font-size: 10px;
      color: #999;
    }
    .stamp {
      text-align: right;
      margin-top: 40px;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="company-info">
      <div class="company-name">CuraGo</div>
      <div class="company-details">
        <strong>${SLOT_BOOKING_CONFIG.CLINIC_NAME}</strong><br>
        ${SLOT_BOOKING_CONFIG.CLINIC_ADDRESS}<br>
        Email: ${CONFIG.SUPPORT_EMAIL}<br>
        Phone: ${CONFIG.WHATSAPP_NUMBER}
        ${SLOT_BOOKING_CONFIG.COMPANY_GST ? '<br>GSTIN: ' + SLOT_BOOKING_CONFIG.COMPANY_GST : ''}
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
      <p><strong>Date:</strong> ${new Date(data.invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}</p>
    </div>
  </div>

  <div class="invoice-meta">
    <div class="meta-box">
      <h3>Billed To</h3>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Age:</strong> ${data.age} | <strong>Gender:</strong> ${data.gender}</p>
      <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>
      ${data.email ? '<p><strong>Email:</strong> ' + data.email + '</p>' : ''}
    </div>
    <div class="meta-box">
      <h3>Consultation With</h3>
      <p><strong>${SLOT_BOOKING_CONFIG.DOCTOR_NAME}</strong></p>
      <p style="font-size: 10px;">${SLOT_BOOKING_CONFIG.DOCTOR_CREDENTIALS}</p>
      <p style="margin-top: 8px;"><strong>Clinic:</strong> ${SLOT_BOOKING_CONFIG.CLINIC_NAME}</p>
    </div>
  </div>

  <div class="booking-details">
    <h2>Booking Details</h2>
    <div class="booking-grid">
      <div class="booking-item">
        <strong>Consultation Mode</strong>
        <span>${data.mode === 'online' ? '🌐 Online Video Consult' : '🏥 In-Clinic Consultation'}</span>
      </div>
      <div class="booking-item">
        <strong>Appointment Date & Time</strong>
        <span>${new Date(data.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })} at ${data.time}</span>
      </div>
      ${data.paymentId ? `
      <div class="booking-item">
        <strong>Payment ID</strong>
        <span style="font-size: 11px;">${data.paymentId}</span>
      </div>
      ` : ''}
      <div class="booking-item">
        <strong>Payment Status</strong>
        <span style="color: #4ade80;">✓ PAID</span>
      </div>
    </div>
  </div>

  ${data.mode === 'online' && data.meetLink !== 'N/A (In-Clinic)' ? `
  <div class="meet-link-box">
    <h3>🎥 Your Online Consultation Link</h3>
    <p><a href="${data.meetLink}">${data.meetLink}</a></p>
    <p style="font-size: 10px; color: #666; margin-top: 8px;">
      Please join 5 minutes before your scheduled time
    </p>
  </div>
  ` : ''}

  <table class="payment-table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="width: 120px; text-align: right;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Slot Booking Fee</strong><br>
          <span style="font-size: 10px; color: #666;">
            This amount will be fully adjusted against your consultation fee of ₹${SLOT_BOOKING_CONFIG.CONSULTATION_FEE}/-
          </span>
        </td>
        <td style="text-align: right;">₹${data.amountPaid.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td>Total Amount Paid</td>
        <td style="text-align: right;">₹${data.amountPaid.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-notes">
    <h3>Important Notes:</h3>
    <ul>
      <li><strong>This is a non-refundable slot booking fee.</strong> The amount paid (₹${data.amountPaid}/-) will be fully adjusted against your final consultation fee of ₹${SLOT_BOOKING_CONFIG.CONSULTATION_FEE}/- at the time of consultation.</li>
      <li><strong>Rescheduling:</strong> You can request a reschedule via WhatsApp at <strong>${CONFIG.WHATSAPP_NUMBER}</strong> at least 2 hours before your scheduled slot.</li>
      ${data.mode === 'online' ? '<li><strong>Online Consultation:</strong> Please ensure you have a stable internet connection and join the meeting 5 minutes before your scheduled time.</li>' : '<li><strong>In-Clinic Consultation:</strong> Please arrive 10 minutes early for registration and paperwork.</li>'}
      <li>Please bring any relevant medical reports and this invoice for reference.</li>
      <li>For any queries, contact us on WhatsApp: ${CONFIG.WHATSAPP_NUMBER}</li>
    </ul>
  </div>

  <div class="stamp">
    <p style="margin-bottom: 50px;">Authorized Signature</p>
    <p style="border-top: 1px solid #999; display: inline-block; padding-top: 5px;">
      CuraGo Team
    </p>
  </div>

  <div class="footer">
    <p><strong>CuraGo - Your Partner in Health</strong></p>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.SUPPORT_EMAIL} | ${CONFIG.WHATSAPP_NUMBER}</p>
    <p style="margin-top: 8px;">
      This is a computer-generated invoice and does not require a physical signature.
    </p>
  </div>
</body>
</html>
  `;

  return Utilities.newBlob(html, 'text/html', 'temp.html').getAs('application/pdf');
}

// ============================================================
// SEND BOOKING CONFIRMATION EMAIL
// ============================================================
function sendBookingConfirmationEmail(data, invoicePdfFile) {
  const plainBody = `
Hi ${data.name}!

Your consultation slot has been successfully booked! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice Number: ${data.invoiceNumber}
Payment Status: ✓ PAID

Appointment Details:
• Doctor: ${SLOT_BOOKING_CONFIG.DOCTOR_NAME}
• Mode: ${data.mode === 'online' ? 'Online Video Consultation' : 'In-Clinic Consultation'}
• Date: ${new Date(data.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })}
• Time: ${data.time}
${data.mode === 'online' && data.meetLink !== 'N/A (In-Clinic)' ? '\n• Meeting Link: ' + data.meetLink : ''}

Amount Paid: ₹${data.amountPaid}/-
(This will be adjusted against your consultation fee of ₹${SLOT_BOOKING_CONFIG.CONSULTATION_FEE}/-)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
${data.mode === 'online' ?
  '→ Join the meeting 5 minutes before your scheduled time\n→ Ensure you have a stable internet connection\n→ Keep your medical reports ready' :
  '→ Arrive 10 minutes early for registration\n→ Bring this invoice and any medical reports\n→ Visit: ' + SLOT_BOOKING_CONFIG.CLINIC_ADDRESS
}

NEED TO RESCHEDULE?
→ WhatsApp us at ${CONFIG.WHATSAPP_NUMBER} (at least 2 hours before your slot)

Your detailed invoice is attached to this email.

For any queries, feel free to reach out to us on WhatsApp.

Best regards,
CuraGo Team
${CONFIG.COMPANY_WEBSITE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
    }
    .header {
      background: linear-gradient(135deg, #096b17 0%, #0a8a1f 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .success-badge {
      background: #4ade80;
      color: #064e3b;
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      font-size: 14px;
      font-weight: bold;
      margin-top: 15px;
    }
    .content {
      padding: 30px;
    }
    .booking-box {
      background: #f0f7f1;
      border-left: 4px solid #096b17;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .booking-box h2 {
      margin: 0 0 15px 0;
      color: #096b17;
      font-size: 20px;
    }
    .detail-row {
      margin: 10px 0;
      font-size: 15px;
    }
    .detail-row strong {
      color: #096b17;
      display: inline-block;
      min-width: 120px;
    }
    .meet-link {
      background: #e7f5ff;
      border: 2px solid #339af0;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: center;
    }
    .meet-link h3 {
      color: #1864ab;
      margin: 0 0 10px 0;
    }
    .meet-link a {
      color: #1864ab;
      word-break: break-all;
      font-weight: bold;
    }
    .info-box {
      background: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .info-box h3 {
      margin: 0 0 10px 0;
      color: #9a3412;
      font-size: 16px;
    }
    .info-box ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .info-box li {
      margin: 5px 0;
      color: #9a3412;
    }
    .cta-button {
      background: #096b17;
      color: white;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
      margin: 10px 5px;
      font-weight: bold;
    }
    .cta-button:hover {
      background: #075110;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      background: #f8f9fa;
      border-top: 3px solid #096b17;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
      <p>Your consultation slot has been successfully reserved</p>
      <div class="success-badge">✓ PAYMENT SUCCESSFUL</div>
    </div>

    <div class="content">
      <h2 style="color: #096b17;">Hi ${data.name}!</h2>
      <p>Great news! Your slot has been confirmed. Here are your booking details:</p>

      <div class="booking-box">
        <h2>Appointment Details</h2>
        <div class="detail-row">
          <strong>Doctor:</strong> ${SLOT_BOOKING_CONFIG.DOCTOR_NAME}
        </div>
        <div class="detail-row">
          <strong>Mode:</strong> ${data.mode === 'online' ? '🌐 Online Video Consult' : '🏥 In-Clinic Consultation'}
        </div>
        <div class="detail-row">
          <strong>Date:</strong> ${new Date(data.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </div>
        <div class="detail-row">
          <strong>Time:</strong> ${data.time}
        </div>
        <div class="detail-row">
          <strong>Invoice No:</strong> ${data.invoiceNumber}
        </div>
        <div class="detail-row">
          <strong>Amount Paid:</strong> ₹${data.amountPaid}/-
        </div>
      </div>

      ${data.mode === 'online' && data.meetLink !== 'N/A (In-Clinic)' ? `
      <div class="meet-link">
        <h3>🎥 Your Online Consultation Link</h3>
        <p><a href="${data.meetLink}">${data.meetLink}</a></p>
        <p style="font-size: 13px; color: #666; margin-top: 10px;">
          Please join 5 minutes before your scheduled time
        </p>
      </div>
      ` : ''}

      <div class="info-box">
        <h3>📋 Before Your Consultation</h3>
        <ul>
          ${data.mode === 'online' ?
            '<li>Ensure you have a stable internet connection</li><li>Join the meeting 5 minutes early</li><li>Keep your medical reports ready to share</li>' :
            '<li>Arrive 10 minutes early for registration</li><li>Bring this invoice and medical reports</li><li>Location: ' + SLOT_BOOKING_CONFIG.CLINIC_ADDRESS + '</li>'
          }
          <li>The booking fee of ₹${data.amountPaid}/- will be adjusted against your consultation fee</li>
        </ul>
      </div>

      <p style="text-align: center; margin: 30px 0;">
        ${data.mode === 'online' ?
          '<a href="' + data.meetLink + '" class="cta-button">Join Meeting</a>' :
          '<a href="https://maps.google.com/?q=' + encodeURIComponent(SLOT_BOOKING_CONFIG.CLINIC_NAME + ', ' + SLOT_BOOKING_CONFIG.CLINIC_ADDRESS) + '" class="cta-button">View Location</a>'
        }
        <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}" class="cta-button" style="background: #25D366;">WhatsApp Us</a>
      </p>

      <p style="background: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
        <strong>Need to Reschedule?</strong><br>
        Contact us on WhatsApp at ${CONFIG.WHATSAPP_NUMBER} at least 2 hours before your scheduled slot.
      </p>
    </div>

    <div class="footer">
      <p><strong>CuraGo - Your Partner in Health</strong></p>
      <p style="margin: 5px 0;">${CONFIG.COMPANY_WEBSITE} | ${CONFIG.SUPPORT_EMAIL}</p>
      <p style="margin-top: 10px; font-size: 12px; color: #999;">
        Your detailed invoice is attached to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  GmailApp.sendEmail(
    data.email,
    SLOT_BOOKING_CONFIG.EMAIL_SUBJECT_BOOKING,
    plainBody,
    {
      htmlBody: htmlBody,
      name: CONFIG.FROM_NAME,
      attachments: [invoicePdfFile.getBlob()]
    }
  );

  Logger.log('Booking confirmation email sent to: ' + data.email);
}

// ============================================================
// INITIALIZE SHEETS (Run this once to create sheets)
// ============================================================
function initializeSlotBookingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Booking Sheet
  let bookingSheet = ss.getSheetByName(SLOT_BOOKING_CONFIG.BOOKING_SHEET_NAME);
  if (!bookingSheet) {
    bookingSheet = ss.insertSheet(SLOT_BOOKING_CONFIG.BOOKING_SHEET_NAME);
    bookingSheet.appendRow([
      'Timestamp',
      'Invoice Number',
      'Name',
      'Age',
      'Gender',
      'Email',
      'WhatsApp Number',
      'Mode',
      'Appointment Date',
      'Appointment Time',
      'Time Label',
      'Meeting Link',
      'Payment ID',
      'Payment Signature',
      'Amount Paid',
      'Booking Status',
      'Calendar Event ID',
      'Calendar Event URL',
      'Notes',
      'Invoice URL'
    ]);

    // Format header row
    const headerRange = bookingSheet.getRange(1, 1, 1, 20);
    headerRange.setBackground('#096b17');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');

    Logger.log('Booking sheet created successfully');
  }

  // Create Payment Sheet
  let paymentSheet = ss.getSheetByName(SLOT_BOOKING_CONFIG.PAYMENT_SHEET_NAME);
  if (!paymentSheet) {
    paymentSheet = ss.insertSheet(SLOT_BOOKING_CONFIG.PAYMENT_SHEET_NAME);
    paymentSheet.appendRow([
      'Payment Timestamp',
      'Invoice Number',
      'Customer Name',
      'WhatsApp Number',
      'Email',
      'Payment ID',
      'Amount',
      'Payment Status',
      'Payment Method',
      'Booking Details',
      'Consultation Mode',
      'Notes'
    ]);

    // Format header row
    const headerRange = paymentSheet.getRange(1, 1, 1, 12);
    headerRange.setBackground('#096b17');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');

    Logger.log('Payment sheet created successfully');
  }

  return {
    success: true,
    message: 'Sheets initialized successfully',
    bookingSheet: SLOT_BOOKING_CONFIG.BOOKING_SHEET_NAME,
    paymentSheet: SLOT_BOOKING_CONFIG.PAYMENT_SHEET_NAME
  };
}
