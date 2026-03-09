// ============================================================
// Google Apps Script Code for CuraGo - COMPLETE VERSION
// ============================================================
// Instructions:
// 1. Go to https://script.google.com
// 2. Create a new project or open your existing one
// 3. Replace ALL code with this file's contents
// 4. Update CONFIG.DRIVE_FOLDER_ID with your Google Drive folder ID
// 5. Save the project
// 6. Run initializeSlotBookingSheets() once to create slot booking sheets
// 7. Deploy → New deployment → Web app → "Who has access" = "Anyone"
// 8. Copy the deployment URL and update your frontend config
// ============================================================

const CONFIG = {
  // Assessment Sheets
  AURA_SHEET_NAME: 'AURA Results',
  ATM_SHEET_NAME: 'ATM Results',
  CALA_SHEET_NAME: 'CALA Results',
  GBSI_SHEET_NAME: 'GBSI Results',
  PRIORITY_CIRCLE_SHEET_NAME: 'Priority Circle 365',
  CONSULTATION_BOOKING_SHEET_NAME: 'Consultation Bookings',

  // Slot Booking Sheets (NEW)
  SLOT_BOOKING_SHEET_NAME: 'Slot Bookings',
  SLOT_PAYMENT_SHEET_NAME: 'Slot Booking Payments',

  // Email Subjects
  EMAIL_SUBJECT_AURA: 'Your AURA Index Results from CuraGo',
  EMAIL_SUBJECT_ATM: 'Your ATM Assessment Results from CuraGo',
  EMAIL_SUBJECT_CALA: 'Your CALA 1.0 Assessment Results from CuraGo',
  EMAIL_SUBJECT_GBSI: 'Your GBSI Assessment Results from CuraGo',
  EMAIL_SUBJECT_BOOKING: 'Booking Confirmed - Dr. Yuvaraj T Consultation',
  EMAIL_SUBJECT_PAYMENT: 'Payment Successful - Slot Booking Invoice',

  // Company Info
  FROM_NAME: 'CuraGo Team',
  COMPANY_WEBSITE: 'https://curago.in',
  SUPPORT_EMAIL: 'curagodoctor@gmail.com',
  WHATSAPP_NUMBER: '+917021227203',

  // Doctor & Clinic Info (NEW)
  DOCTOR_NAME: 'Dr. Yuvaraj T',
  DOCTOR_CREDENTIALS: 'MCh Surgical Gastroenterology (KEMH, Mumbai) | FMAS, FACRSI',
  CLINIC_NAME: 'SRV Hospital',
  CLINIC_ADDRESS: 'Tilak Nagar, Chembur, Mumbai',

  // Payment Info (NEW)
  SLOT_BOOKING_FEE: 150,
  CONSULTATION_FEE: 1000,
  COMPANY_GST: '', // Optional: Add your GST number
  INVOICE_PREFIX: 'INV-SB-',

  // Google Drive folder ID
  DRIVE_FOLDER_ID: '1ztLlzdZgZyJZR1BfICOHBPzbeNRDwTTx',
};

// ============================================================
// CORS HANDLER
// ============================================================
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'OK',
      message: 'Google Apps Script is deployed and working',
      timestamp: new Date().toISOString(),
      deployment: 'CORS enabled'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================
// WEB APP ENDPOINT
// ============================================================
function doPost(e) {
  try {
    Logger.log('Received POST request');
    const data = JSON.parse(e.postData.contents);
    Logger.log('Test type: ' + data.testType);

    let response;

    if (data.testType === 'aura_index') {
      response = handleAuraSubmission(data);
    } else if (data.testType === 'atm_tool') {
      response = handleAtmSubmission(data);
    } else if (data.testType === 'cala_tool') {
      response = handleCalaSubmission(data);
    } else if (data.testType === 'gbsi_tool') {
      response = handleGbsiSubmission(data);
    } else if (data.testType === 'priority_circle') {
      response = handlePriorityCircleSubmission(data);
    } else if (data.testType === 'consultation_booking') {
      response = handleConsultationBookingSubmission(data);
    } else if (data.testType === 'slot_booking') {
      response = handleSlotBookingSubmission(data); // NEW
    } else {
      throw new Error('Invalid test type: ' + data.testType);
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('ERROR: ' + error.toString());

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// SAVE PDF TO GOOGLE DRIVE
// ============================================================
function savePdfToDrive(blob, fileName) {
  const folder = CONFIG.DRIVE_FOLDER_ID
    ? DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID)
    : DriveApp.getRootFolder();

  const file = folder.createFile(blob);
  file.setName(fileName + '.pdf');
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file;
}

// ============================================================
// GENERATE INVOICE NUMBER (NEW)
// ============================================================
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return CONFIG.INVOICE_PREFIX + year + month + day + '-' + random;
}

// ============================================================
// GENERATE MEETING LINK (NEW)
// ============================================================
function generateMeetingLink(data) {
  const meetingId = 'meet-' + Date.now().toString(36);
  return 'https://meet.google.com/' + meetingId;
}

// ============================================================
// SLOT BOOKING SUBMISSION HANDLER (NEW)
// ============================================================
function handleSlotBookingSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingSheet = ss.getSheetByName(CONFIG.SLOT_BOOKING_SHEET_NAME);
  const paymentSheet = ss.getSheetByName(CONFIG.SLOT_PAYMENT_SHEET_NAME);

  if (!bookingSheet) {
    throw new Error('Sheet "' + CONFIG.SLOT_BOOKING_SHEET_NAME + '" not found. Please run initializeSlotBookingSheets() first.');
  }
  if (!paymentSheet) {
    throw new Error('Sheet "' + CONFIG.SLOT_PAYMENT_SHEET_NAME + '" not found. Please run initializeSlotBookingSheets() first.');
  }

  const timestamp = new Date();
  const invoiceNumber = generateInvoiceNumber();
  const meetLink = data.mode === 'online' ? generateMeetingLink(data) : 'N/A (In-Clinic)';

  // Save to Booking Sheet
  const bookingRowData = [
    timestamp,
    invoiceNumber,
    data.name,
    data.age,
    data.gender,
    data.email || '',
    data.whatsapp,
    data.mode,
    data.date,
    data.time,
    data.timeLabel || data.time,
    meetLink,
    data.paymentId || '',
    data.paymentSignature || '',
    CONFIG.SLOT_BOOKING_FEE,
    'Confirmed',
    data.eventId || '',
    data.calendarEventUrl || '',
    '', // Notes
    '' // Invoice URL (will be updated)
  ];

  bookingSheet.appendRow(bookingRowData);
  Logger.log('Booking saved to sheet: ' + invoiceNumber);

  // Save to Payment Sheet
  const paymentRowData = [
    timestamp,
    invoiceNumber,
    data.name,
    data.whatsapp,
    data.email || '',
    data.paymentId || '',
    CONFIG.SLOT_BOOKING_FEE,
    'Success',
    data.paymentMethod || 'Razorpay',
    data.date + ' ' + (data.timeLabel || data.time),
    data.mode,
    '' // Notes
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
    amountPaid: CONFIG.SLOT_BOOKING_FEE,
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
  bookingSheet.getRange(lastRow, 20).setValue(invoicePdfUrl);

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
// GENERATE INVOICE PDF (NEW)
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
        <strong>${CONFIG.CLINIC_NAME}</strong><br>
        ${CONFIG.CLINIC_ADDRESS}<br>
        Email: ${CONFIG.SUPPORT_EMAIL}<br>
        Phone: ${CONFIG.WHATSAPP_NUMBER}
        ${CONFIG.COMPANY_GST ? '<br>GSTIN: ' + CONFIG.COMPANY_GST : ''}
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
      <p><strong>${CONFIG.DOCTOR_NAME}</strong></p>
      <p style="font-size: 10px;">${CONFIG.DOCTOR_CREDENTIALS}</p>
      <p style="margin-top: 8px;"><strong>Clinic:</strong> ${CONFIG.CLINIC_NAME}</p>
    </div>
  </div>

  <div class="booking-details">
    <h2>Booking Details</h2>
    <div class="booking-grid">
      <div class="booking-item">
        <strong>Consultation Mode</strong>
        <span>${data.mode === 'online' ? 'Online Video Consult' : 'In-Clinic Consultation'}</span>
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
        <span>PAID</span>
      </div>
    </div>
  </div>

  ${data.mode === 'online' && data.meetLink !== 'N/A (In-Clinic)' ? `
  <div class="meet-link-box">
    <h3>Your Online Consultation Link</h3>
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
            This amount will be fully adjusted against your consultation fee of ₹${CONFIG.CONSULTATION_FEE}/-
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
      <li><strong>This is a non-refundable slot booking fee.</strong> The amount paid (₹${data.amountPaid}/-) will be fully adjusted against your final consultation fee of ₹${CONFIG.CONSULTATION_FEE}/- at the time of consultation.</li>
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
// SEND BOOKING CONFIRMATION EMAIL (NEW)
// ============================================================
function sendBookingConfirmationEmail(data, invoicePdfFile) {
  const plainBody = `
Hi ${data.name}!

Your consultation slot has been successfully booked!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice Number: ${data.invoiceNumber}
Payment Status: PAID

Appointment Details:
• Doctor: ${CONFIG.DOCTOR_NAME}
• Mode: ${data.mode === 'online' ? 'Online Video Consultation' : 'In-Clinic Consultation'}
• Date: ${new Date(data.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })}
• Time: ${data.time}
${data.mode === 'online' && data.meetLink !== 'N/A (In-Clinic)' ? '\n• Meeting Link: ' + data.meetLink : ''}

Amount Paid: ₹${data.amountPaid}/-
(This will be adjusted against your consultation fee of ₹${CONFIG.CONSULTATION_FEE}/-)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
${data.mode === 'online' ?
  '→ Join the meeting 5 minutes before your scheduled time\n→ Ensure you have a stable internet connection\n→ Keep your medical reports ready' :
  '→ Arrive 10 minutes early for registration\n→ Bring this invoice and any medical reports\n→ Visit: ' + CONFIG.CLINIC_ADDRESS
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
      <h1>Booking Confirmed!</h1>
      <p>Your consultation slot has been successfully reserved</p>
      <div class="success-badge">PAYMENT SUCCESSFUL</div>
    </div>

    <div class="content">
      <h2 style="color: #096b17;">Hi ${data.name}!</h2>
      <p>Great news! Your slot has been confirmed. Here are your booking details:</p>

      <div class="booking-box">
        <h2>Appointment Details</h2>
        <div class="detail-row">
          <strong>Doctor:</strong> ${CONFIG.DOCTOR_NAME}
        </div>
        <div class="detail-row">
          <strong>Mode:</strong> ${data.mode === 'online' ? 'Online Video Consult' : 'In-Clinic Consultation'}
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
        <h3>Your Online Consultation Link</h3>
        <p><a href="${data.meetLink}">${data.meetLink}</a></p>
        <p style="font-size: 13px; color: #666; margin-top: 10px;">
          Please join 5 minutes before your scheduled time
        </p>
      </div>
      ` : ''}

      <div class="info-box">
        <h3>Before Your Consultation</h3>
        <ul>
          ${data.mode === 'online' ?
            '<li>Ensure you have a stable internet connection</li><li>Join the meeting 5 minutes early</li><li>Keep your medical reports ready to share</li>' :
            '<li>Arrive 10 minutes early for registration</li><li>Bring this invoice and medical reports</li><li>Location: ' + CONFIG.CLINIC_ADDRESS + '</li>'
          }
          <li>The booking fee of ₹${data.amountPaid}/- will be adjusted against your consultation fee</li>
        </ul>
      </div>

      <p style="text-align: center; margin: 30px 0;">
        ${data.mode === 'online' ?
          '<a href="' + data.meetLink + '" class="cta-button">Join Meeting</a>' :
          '<a href="https://maps.google.com/?q=' + encodeURIComponent(CONFIG.CLINIC_NAME + ', ' + CONFIG.CLINIC_ADDRESS) + '" class="cta-button">View Location</a>'
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
    CONFIG.EMAIL_SUBJECT_BOOKING,
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
// INITIALIZE SLOT BOOKING SHEETS (NEW - Run once)
// ============================================================
function initializeSlotBookingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Booking Sheet
  let bookingSheet = ss.getSheetByName(CONFIG.SLOT_BOOKING_SHEET_NAME);
  if (!bookingSheet) {
    bookingSheet = ss.insertSheet(CONFIG.SLOT_BOOKING_SHEET_NAME);
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

    const headerRange = bookingSheet.getRange(1, 1, 1, 20);
    headerRange.setBackground('#096b17');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');

    Logger.log('Booking sheet created successfully');
  }

  // Create Payment Sheet
  let paymentSheet = ss.getSheetByName(CONFIG.SLOT_PAYMENT_SHEET_NAME);
  if (!paymentSheet) {
    paymentSheet = ss.insertSheet(CONFIG.SLOT_PAYMENT_SHEET_NAME);
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

    const headerRange = paymentSheet.getRange(1, 1, 1, 12);
    headerRange.setBackground('#096b17');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');

    Logger.log('Payment sheet created successfully');
  }

  return {
    success: true,
    message: 'Sheets initialized successfully',
    bookingSheet: CONFIG.SLOT_BOOKING_SHEET_NAME,
    paymentSheet: CONFIG.SLOT_PAYMENT_SHEET_NAME
  };
}

// ============================================================
// AURA SUBMISSION HANDLER
// ============================================================
function handleAuraSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.AURA_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.AURA_SHEET_NAME + '" not found. Please create it.');
  }

  // Generate PDF and save to Drive
  const pdfFile = savePdfToDrive(generateAuraPdf(data), 'AURA_Results_' + data.name.replace(/\s+/g, '_'));
  const pdfUrl = pdfFile.getUrl();

  // Save to Google Sheet with PDF link
  const rowData = [
    new Date(),
    data.name,
    data.email || '',
    data.phoneNumber,
    data.scores.overall,
    data.scores.awareness,
    data.scores.understanding,
    data.scores.regulation,
    data.scores.alignment,
    data.label,
    data.strengths.join(', '),
    data.growth.join(', '),
    data.riskFlags.join(', '),
    data.eventId,
    pdfUrl // PDF link in last column
  ];

  sheet.appendRow(rowData);
  Logger.log('Data saved to sheet with PDF link');

  // Send email with PDF
  if (data.email && data.email.trim() !== '') {
    sendAuraPdfEmail(data, pdfFile);
    Logger.log('Email sent to: ' + data.email);
  } else {
    Logger.log('No email provided, skipping email send');
  }

  return { success: true, message: 'AURA results saved and email sent', pdfUrl: pdfUrl };
}

// ============================================================
// ATM SUBMISSION HANDLER
// ============================================================
function handleAtmSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.ATM_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.ATM_SHEET_NAME + '" not found. Please create it.');
  }

  // Generate PDF and save to Drive
  const pdfFile = savePdfToDrive(generateAtmPdf(data), 'ATM_Results_' + data.name.replace(/\s+/g, '_'));
  const pdfUrl = pdfFile.getUrl();

  // Save to Google Sheet with PDF link
  const rowData = [
    new Date(),
    data.name,
    data.email || '',
    data.phoneNumber,
    data.pattern,
    data.confidence,
    data.explanation,
    data.neurological,
    data.impact.join(', '),
    data.microActionTitle,
    data.microActionDescription,
    data.eventId,
    pdfUrl // PDF link in last column
  ];

  sheet.appendRow(rowData);
  Logger.log('Data saved to sheet with PDF link');

  // Send email with PDF
  if (data.email && data.email.trim() !== '') {
    sendAtmPdfEmail(data, pdfFile);
    Logger.log('Email sent to: ' + data.email);
  } else {
    Logger.log('No email provided, skipping email send');
  }

  return { success: true, message: 'ATM results saved and email sent', pdfUrl: pdfUrl };
}

// ============================================================
// AURA PDF GENERATOR (Clean Design - No Emojis, No Gradients)
// ============================================================
function generateAuraPdf(data) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      background: #096b17;
      color: white;
      padding: 30px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: normal;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #096b17;
      font-weight: bold;
    }
    .score-section {
      background: #f8f9fa;
      padding: 25px;
      margin-bottom: 20px;
      border-left: 4px solid #096b17;
    }
    .score-section h2 {
      margin-top: 0;
      color: #096b17;
      font-size: 20px;
    }
    .overall-score {
      text-align: center;
      padding: 25px;
      background: white;
      margin: 15px 0;
      border: 1px solid #e0e0e0;
    }
    .overall-score .number {
      font-size: 48px;
      font-weight: bold;
      color: #096b17;
      line-height: 1;
    }
    .overall-score .label {
      font-size: 16px;
      color: #666;
      margin-top: 10px;
    }
    .pillar {
      background: white;
      padding: 12px;
      margin: 8px 0;
      border: 1px solid #e0e0e0;
      font-size: 14px;
    }
    .pillar-name {
      font-weight: bold;
      color: #096b17;
    }
    .insights-box {
      background: #f0f7f1;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #d0e5d3;
    }
    .insights-box h3 {
      margin-top: 0;
      color: #096b17;
      font-size: 16px;
    }
    .cta-box {
      background: #096b17;
      color: white;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
    }
    .cta-box h3 {
      margin-top: 0;
      font-size: 18px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your AURA Index Results</h1>
    <p>Personalized Emotional Fitness Assessment</p>
  </div>

  <p class="greeting">Hi ${data.name}!</p>
  <p>Thank you for completing the AURA Index assessment. Here are your comprehensive results:</p>

  <div class="score-section">
    <h2>Overall AURA Score</h2>
    <div class="overall-score">
      <div class="number">${Math.round(data.scores.overall)}/100</div>
      <div class="label">${data.label}</div>
    </div>
  </div>

  <div class="score-section">
    <h2>Your Pillar Scores</h2>
    <div class="pillar">
      <span class="pillar-name">Awareness:</span> ${Math.round(data.scores.awareness)}/100
    </div>
    <div class="pillar">
      <span class="pillar-name">Understanding:</span> ${Math.round(data.scores.understanding)}/100
    </div>
    <div class="pillar">
      <span class="pillar-name">Regulation:</span> ${Math.round(data.scores.regulation)}/100
    </div>
    <div class="pillar">
      <span class="pillar-name">Alignment:</span> ${Math.round(data.scores.alignment)}/100
    </div>
  </div>

  ${data.strengths.length > 0 ? `
  <div class="insights-box">
    <h3>Your Strengths</h3>
    <p>${data.strengths.join(', ')}</p>
  </div>
  ` : ''}

  ${data.growth.length > 0 ? `
  <div class="insights-box">
    <h3>Growth Areas</h3>
    <p>${data.growth.join(', ')}</p>
  </div>
  ` : ''}

  ${data.riskFlags.length > 0 ? `
  <div class="insights-box">
    <h3>Attention Areas</h3>
    <p>${data.riskFlags.join(', ')}</p>
  </div>
  ` : ''}

  <div class="cta-box">
    <h3>Ready to take your next step?</h3>
    <p>Book a free 15-minute clarity call with our mental health experts</p>
    <p><strong>Visit:</strong> ${CONFIG.COMPANY_WEBSITE}/contact</p>
    <p><strong>WhatsApp:</strong> ${CONFIG.WHATSAPP_NUMBER}</p>
  </div>

  <div class="footer">
    <strong>CuraGo - Your Partner in Emotional Wellness</strong>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.SUPPORT_EMAIL}</p>
    <p style="margin-top: 10px;">
      Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>
</body>
</html>
  `;

  return Utilities.newBlob(html, 'text/html', 'temp.html').getAs('application/pdf');
}

// ============================================================
// ATM PDF GENERATOR (Clean Design - No Emojis, No Gradients)
// ============================================================
function generateAtmPdf(data) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      background: #096b17;
      color: white;
      padding: 30px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: normal;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #096b17;
      font-weight: bold;
    }
    .pattern-box {
      background: #f8f9fa;
      padding: 25px;
      margin-bottom: 20px;
      border-left: 4px solid #096b17;
      text-align: center;
    }
    .pattern-name {
      font-size: 22px;
      font-weight: bold;
      color: #096b17;
      margin-bottom: 10px;
    }
    .confidence {
      font-size: 14px;
      color: #666;
    }
    .section {
      background: #ffffff;
      padding: 20px;
      margin-bottom: 15px;
      border: 1px solid #e0e0e0;
    }
    .section h2 {
      margin-top: 0;
      color: #096b17;
      font-size: 18px;
    }
    .micro-action-box {
      background: #f0f7f1;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #d0e5d3;
    }
    .micro-action-box h3 {
      margin-top: 0;
      color: #096b17;
      font-size: 16px;
    }
    .micro-action-box h4 {
      color: #096b17;
      margin: 10px 0;
      font-size: 15px;
    }
    .cta-box {
      background: #096b17;
      color: white;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
    }
    .cta-box h3 {
      margin-top: 0;
      font-size: 18px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your ATM Assessment Results</h1>
    <p>Anxiety Trigger Mapping</p>
  </div>

  <p class="greeting">Hi ${data.name}!</p>
  <p>Thank you for completing the ATM assessment. Here are your personalized results:</p>

  <div class="pattern-box">
    <div class="pattern-name">${data.pattern}</div>
    <div class="confidence">Confidence Level: ${Math.round(data.confidence * 100)}%</div>
  </div>

  <div class="section">
    <h2>What This Means</h2>
    <p>${data.explanation}</p>
  </div>

  <div class="section">
    <h2>Why It Happens</h2>
    <p>${data.neurological}</p>
  </div>

  <div class="micro-action-box">
    <h3>Your Personalized Micro-Action</h3>
    <h4>${data.microActionTitle}</h4>
    <p>${data.microActionDescription}</p>
  </div>

  <div class="cta-box">
    <h3>Ready to take your next step?</h3>
    <p>Book a free 15-minute clarity call with our mental health experts</p>
    <p><strong>Visit:</strong> ${CONFIG.COMPANY_WEBSITE}/contact</p>
    <p><strong>WhatsApp:</strong> ${CONFIG.WHATSAPP_NUMBER}</p>
  </div>

  <div class="footer">
    <strong>CuraGo - Your Partner in Emotional Wellness</strong>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.SUPPORT_EMAIL}</p>
    <p style="margin-top: 10px;">
      Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>
</body>
</html>
  `;

  return Utilities.newBlob(html, 'text/html', 'temp.html').getAs('application/pdf');
}

// ============================================================
// SEND AURA EMAIL WITH PDF
// ============================================================
function sendAuraPdfEmail(data, pdfFile) {
  const plainBody = `
Hi ${data.name}!

Thank you for completing the AURA Index assessment.

Your detailed results are attached as a PDF document.

QUICK SUMMARY:
Overall Score: ${Math.round(data.scores.overall)}/100 - ${data.label}

Pillar Scores:
- Awareness: ${Math.round(data.scores.awareness)}/100
- Understanding: ${Math.round(data.scores.understanding)}/100
- Regulation: ${Math.round(data.scores.regulation)}/100
- Alignment: ${Math.round(data.scores.alignment)}/100

${data.strengths.length > 0 ? 'Strengths: ' + data.strengths.join(', ') : ''}
${data.growth.length > 0 ? 'Growth Areas: ' + data.growth.join(', ') : ''}

Next Steps:
- Book a free clarity call: ${CONFIG.COMPANY_WEBSITE}/contact
- Chat with us on WhatsApp: ${CONFIG.WHATSAPP_NUMBER}

Best regards,
CuraGo Team
${CONFIG.COMPANY_WEBSITE}
  `;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .header { background: #096b17; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background: #f8f9fa; }
    .cta-button { background: #64CB81; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your AURA Index Results</h1>
  </div>
  <div class="content">
    <h2>Hi ${data.name}!</h2>
    <p>Thank you for completing the AURA Index assessment.</p>
    <p><strong>Your detailed results are attached as a PDF document.</strong></p>
    <p>Overall Score: <strong>${Math.round(data.scores.overall)}/100</strong> - ${data.label}</p>
    <p style="text-align: center;">
      <a href="${CONFIG.COMPANY_WEBSITE}/contact" class="cta-button">Book Free Clarity Call</a>
    </p>
  </div>
  <div class="footer">
    <p><strong>CuraGo Team</strong></p>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.WHATSAPP_NUMBER}</p>
  </div>
</body>
</html>
  `;

  GmailApp.sendEmail(
    data.email,
    CONFIG.EMAIL_SUBJECT_AURA,
    plainBody,
    {
      htmlBody: htmlBody,
      name: CONFIG.FROM_NAME,
      attachments: [pdfFile.getBlob()]
    }
  );

  Logger.log('AURA email with PDF sent to: ' + data.email);
}

// ============================================================
// SEND ATM EMAIL WITH PDF
// ============================================================
function sendAtmPdfEmail(data, pdfFile) {
  const plainBody = `
Hi ${data.name}!

Thank you for completing the ATM assessment.

Your detailed results are attached as a PDF document.

QUICK SUMMARY:
Anxiety Pattern: ${data.pattern}
Confidence: ${Math.round(data.confidence * 100)}%

${data.explanation}

Your Micro-Action:
${data.microActionTitle}
${data.microActionDescription}

Next Steps:
- Book a free clarity call: ${CONFIG.COMPANY_WEBSITE}/contact
- Chat with us on WhatsApp: ${CONFIG.WHATSAPP_NUMBER}

Best regards,
CuraGo Team
${CONFIG.COMPANY_WEBSITE}
  `;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .header { background: #096b17; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background: #f8f9fa; }
    .cta-button { background: #64CB81; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your ATM Assessment Results</h1>
  </div>
  <div class="content">
    <h2>Hi ${data.name}!</h2>
    <p>Thank you for completing the ATM assessment.</p>
    <p><strong>Your detailed results are attached as a PDF document.</strong></p>
    <p>Pattern: <strong>${data.pattern}</strong></p>
    <p style="text-align: center;">
      <a href="${CONFIG.COMPANY_WEBSITE}/contact" class="cta-button">Book Free Clarity Call</a>
    </p>
  </div>
  <div class="footer">
    <p><strong>CuraGo Team</strong></p>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.WHATSAPP_NUMBER}</p>
  </div>
</body>
</html>
  `;

  GmailApp.sendEmail(
    data.email,
    CONFIG.EMAIL_SUBJECT_ATM,
    plainBody,
    {
      htmlBody: htmlBody,
      name: CONFIG.FROM_NAME,
      attachments: [pdfFile.getBlob()]
    }
  );

  Logger.log('ATM email with PDF sent to: ' + data.email);
}

// ============================================================
// REMAINING HANDLERS: CALA, GBSI, PRIORITY CIRCLE, CONSULTATION BOOKING
// Note: Due to file size, the complete CALA and GBSI generators are in the backup file
// Copy handleCalaSubmission, generateCalaPdf, sendCalaPdfEmail from lines 710-1267
// Copy handleGbsiSubmission, generateGbsiPdf, sendGbsiPdfEmail from lines 1269-1918
// Copy handlePriorityCircleSubmission from lines 1920-1958
// Copy handleConsultationBookingSubmission from lines 1960-1994
// ============================================================

// ============================================================
// CALA SUBMISSION HANDLER
// ============================================================
function handleCalaSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.CALA_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.CALA_SHEET_NAME + '" not found. Please create it.');
  }

  // Generate PDF and save to Drive
  const pdfFile = savePdfToDrive(generateCalaPdf(data), 'CALA_Results_' + data.name.replace(/\s+/g, '_'));
  const pdfUrl = pdfFile.getUrl();

  // Save to Google Sheet with PDF link
  const rowData = [
    new Date(),
    data.name,
    data.email || '',
    data.phoneNumber,
    data.primaryLoop,
    data.secondaryLoop || 'None',
    data.triggerType,
    data.reinforcement,
    data.loadCapacityBand,
    data.stability,
    data.loopScores.anticipatory,
    data.loopScores.control,
    data.loopScores.reassurance,
    data.loopScores.avoidance,
    data.loopScores.somatic,
    data.loopScores.cognitiveOverload,
    data.eventId,
    pdfUrl // PDF link in last column
  ];

  sheet.appendRow(rowData);
  Logger.log('Data saved to sheet with PDF link');

  // Send email with PDF
  if (data.email && data.email.trim() !== '') {
    sendCalaPdfEmail(data, pdfFile);
    Logger.log('Email sent to: ' + data.email);
  } else {
    Logger.log('No email provided, skipping email send');
  }

  return { success: true, message: 'CALA results saved and email sent', pdfUrl: pdfUrl };
}

// ============================================================
// CALA PDF GENERATOR - WITH COMPLETE CONTENT
// ============================================================
function generateCalaPdf(data) {
  // Get loop descriptions
  const getLoopDescription = function(loopName) {
    const descriptions = {
      'Anticipatory Loop': 'Your anxiety is driven by future-oriented thinking. You tend to mentally rehearse possible outcomes in advance, which creates a sense of preparedness but also keeps anxiety active.',
      'Control-Seeking Loop': 'Your anxiety is shaped by a need to stabilise or control uncertainty. Attempts to manage or neutralise discomfort provide short-term relief but keep attention fixed on the problem.',
      'Reassurance Loop': 'Your anxiety is reinforced through reassurance-seeking. External validation eases anxiety briefly, but over time increases dependence and sensitivity to doubt.',
      'Avoidance Loop': 'Your anxiety persists through avoidance patterns. Avoiding discomfort reduces anxiety momentarily, but teaches the system that anxiety requires withdrawal.',
      'Somatic Sensitivity Loop': 'Your anxiety is strongly influenced by bodily sensations. Physical signals become interpreted as threats, which amplifies awareness and fear.',
      'Cognitive Overload Loop': 'Your anxiety emerges from sustained mental load. Prolonged thinking without recovery reduces cognitive buffer, allowing anxiety to surface during routine stress.'
    };
    return descriptions[loopName] || '';
  };

  // Get trigger content
  const getTriggerContent = function(triggerType) {
    const content = {
      'Internal': {
        description: 'Your anxiety is mostly triggered internally — through thoughts, mental scenarios, or subtle body signals. This explains why anxiety can appear even on days that look calm from the outside.',
        points: [
          'You may have noticed anxiety arriving without a clear external reason.',
          'This can make it harder to explain to others — or even to yourself — why you feel anxious.'
        ]
      },
      'External': {
        description: 'Your anxiety is mainly triggered by situations or environments, with internal reactions following. This means anxiety usually makes sense in context, even if the reaction feels stronger than expected.',
        points: [
          'You may find that anxiety eases once the situation passes.',
          'Certain environments or demands may consistently stand out as difficult for you.'
        ]
      },
      'Mixed': {
        description: 'Your anxiety shifts between internal and situational triggers. Some days, external stressors play a bigger role. On other days, anxiety seems to arise internally.',
        points: [
          'This can make anxiety feel inconsistent or hard to predict.',
          'You may notice that your experience changes depending on context rather than one fixed cause.'
        ]
      }
    };
    return content[triggerType] || content['Mixed'];
  };

  // Get reinforcement content
  const getReinforcementContent = function(reinforcement) {
    const content = {
      'Control': {
        description: 'When anxiety appears, you tend to respond by trying to manage or stabilise it. This usually brings short-term relief, but keeps attention focused on the problem.',
        points: [
          'You may feel more alert or "on guard" even after anxiety settles.',
          'It can feel like you\'re always one step away from needing to intervene again.'
        ]
      },
      'Reassurance': {
        description: 'Reassurance reduces anxiety briefly, but over time increases dependence on external confirmation. This explains why reassurance often needs repeating.',
        points: [
          'You may notice relief fading faster than it used to.',
          'Anxiety can feel quieter when someone else confirms things — but louder when you\'re alone.'
        ]
      },
      'Avoidance': {
        description: 'Avoiding discomfort reduces anxiety in the moment, but teaches the system to withdraw. Over time, this can reduce tolerance.',
        points: [
          'You may feel immediate relief after stepping away from a situation.',
          'Later, similar situations may start to feel harder than before.'
        ]
      },
      'Neutral': {
        description: 'Your coping responses reduce anxiety without strongly reinforcing it. This suggests your system is managing stress without locking into a repeating loop.',
        points: [
          'You may recognise anxiety without feeling overtaken by it.',
          'Anxiety tends to pass without leaving a strong after-effect.'
        ]
      }
    };
    return content[reinforcement] || content['Neutral'];
  };

  // Get load capacity content
  const getLoadContent = function(loadCapacity) {
    const content = {
      'Overloaded': {
        description: 'Your current mental and physical demands exceed your recovery capacity. This reduces buffer, making anxiety more likely during routine stress.',
        points: [
          'You may feel that even small demands take more effort than before.',
          'Anxiety may show up more often when rest has been inconsistent.'
        ]
      },
      'Strained': {
        description: 'You are functioning, but with limited margin. Anxiety increases when stress accumulates or recovery is delayed.',
        points: [
          'You may feel "mostly okay" until several things pile up at once.',
          'There may be less room for error or unexpected demands.'
        ]
      },
      'Balanced': {
        description: 'Your load and recovery are reasonably matched. Anxiety is more likely linked to specific situations than exhaustion.',
        points: [
          'You may notice anxiety comes and goes without lingering.',
          'Recovery generally restores your baseline.'
        ]
      }
    };
    return content[loadCapacity] || content['Balanced'];
  };

  // Get stability content
  const getStabilityContent = function(stability) {
    const content = {
      'Stable': {
        description: 'Anxiety appears, but settles when conditions improve. Your system returns to baseline without much carry-over.',
        points: [
          'Anxiety feels contained rather than spreading.',
          'Stressful periods don\'t permanently shift how you feel.'
        ]
      },
      'Fluctuating': {
        description: 'Anxiety varies with stress and recovery balance. It\'s not fixed, but it can feel unpredictable.',
        points: [
          'Some weeks feel manageable, others feel unexpectedly harder.',
          'Changes in routine or rest may strongly influence how you feel.'
        ]
      },
      'Escalation-Prone': {
        description: 'Anxiety intensifies when recovery remains insufficient over time. This reflects narrowing capacity, not worsening anxiety itself.',
        points: [
          'You may notice anxiety lingering longer than it used to.',
          'Stress seems to accumulate rather than reset fully.'
        ]
      }
    };
    return content[stability] || content['Stable'];
  };

  const trigger = getTriggerContent(data.triggerType);
  const reinforcement = getReinforcementContent(data.reinforcement);
  const load = getLoadContent(data.loadCapacityBand);
  const stability = getStabilityContent(data.stability);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
      font-size: 11pt;
    }
    .header {
      background: #096b17;
      color: white;
      padding: 25px;
      text-align: center;
      margin-bottom: 25px;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24pt;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 12pt;
      opacity: 0.95;
    }
    .greeting {
      font-size: 14pt;
      margin-bottom: 15px;
      color: #096b17;
      font-weight: bold;
    }
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-header {
      background: #f8f9fa;
      padding: 12px 15px;
      margin-bottom: 12px;
      border-left: 4px solid #096b17;
    }
    .section-header h2 {
      margin: 0;
      color: #096b17;
      font-size: 14pt;
      font-weight: bold;
    }
    .loop-box {
      background: #096b17;
      color: white;
      padding: 18px;
      margin: 12px 0;
    }
    .loop-box h3 {
      margin: 0 0 10px 0;
      font-size: 13pt;
      font-weight: bold;
    }
    .loop-box p {
      margin: 8px 0;
      font-size: 10.5pt;
      line-height: 1.5;
    }
    .loop-box ul {
      margin: 8px 0 0 18px;
      padding: 0;
    }
    .loop-box li {
      margin: 5px 0;
      font-size: 10pt;
    }
    .content-box {
      background: white;
      padding: 15px;
      margin: 12px 0;
      border: 1px solid #e0e0e0;
    }
    .content-box h3 {
      margin: 0 0 10px 0;
      color: #096b17;
      font-size: 12pt;
      font-weight: bold;
    }
    .content-box p {
      margin: 8px 0;
      font-size: 10.5pt;
      line-height: 1.5;
    }
    .content-box ul {
      margin: 8px 0 0 18px;
      padding: 0;
    }
    .content-box li {
      margin: 5px 0;
      font-size: 10pt;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 12px;
    }
    .score-item {
      background: white;
      padding: 10px;
      border: 1px solid #e0e0e0;
      font-size: 10pt;
    }
    .score-label {
      font-weight: bold;
      color: #096b17;
    }
    .cta-box {
      background: #096b17;
      color: white;
      padding: 18px;
      text-align: center;
      margin: 20px 0;
    }
    .cta-box h3 {
      margin: 0 0 10px 0;
      font-size: 13pt;
    }
    .cta-box p {
      margin: 6px 0;
      font-size: 10.5pt;
    }
    .footer {
      text-align: center;
      margin-top: 25px;
      padding-top: 18px;
      border-top: 2px solid #e0e0e0;
      color: #666;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your CALA 1.0 Report</h1>
    <p>Personalized Clinical Assessment for ${data.name}</p>
  </div>

  <p class="greeting">Thank you for completing the CALA 1.0 Assessment</p>

  <!-- SECTION 1: ANXIETY LOOP MAP -->
  <div class="section">
    <div class="section-header">
      <h2>Section 1: YOUR ANXIETY LOOP MAP</h2>
    </div>

    <div class="loop-box">
      <h3>${data.secondaryLoop ? 'Dual Loop' : 'Single Loop'}</h3>

      ${!data.secondaryLoop ? `
      <p><strong>Your anxiety follows a ${data.primaryLoop} pattern.</strong></p>
      <p>${getLoopDescription(data.primaryLoop)}</p>
      <p>This means anxiety tends to repeat through a familiar pathway rather than appearing randomly.</p>
      <p>Over time, it's the repetition of this pattern, not intensity, that keeps anxiety present.</p>
      <ul>
        <li>You may notice that anxiety feels predictable in hindsight, even if it feels sudden in the moment.</li>
        <li>This pattern often gives the impression that anxiety has a "mind of its own," when it is actually following the same route each time.</li>
      </ul>
      ` : `
      <p><strong>Your anxiety follows a ${data.primaryLoop} pattern, with a ${data.secondaryLoop} influence.</strong></p>
      <p>${getLoopDescription(data.primaryLoop)}</p>
      <p>${getLoopDescription(data.secondaryLoop)}</p>
      <p>The primary loop explains how anxiety usually begins for you.</p>
      <p>The secondary loop explains why it tends to continue or return.</p>
      <ul>
        <li>This can feel like anxiety starts for one reason, but stays for another.</li>
        <li>You may recognise that even when the original trigger settles, anxiety doesn't fully switch off.</li>
      </ul>
      `}
    </div>
  </div>

  <!-- SECTION 2: TRIGGER ARCHITECTURE -->
  <div class="section">
    <div class="section-header">
      <h2>Section 2: TRIGGER ARCHITECTURE</h2>
    </div>

    <div class="content-box">
      <h3>${data.triggerType} Trigger Pattern</h3>
      <p>${trigger.description}</p>
      <ul>
        ${trigger.points.map(point => '<li>' + point + '</li>').join('')}
      </ul>
    </div>
  </div>

  <!-- SECTION 3: WHAT KEEPS THE LOOP GOING -->
  <div class="section">
    <div class="section-header">
      <h2>Section 3: WHAT KEEPS THE LOOP GOING</h2>
    </div>

    <div class="content-box">
      <h3>${data.reinforcement} Pattern</h3>
      <p>${reinforcement.description}</p>
      <ul>
        ${reinforcement.points.map(point => '<li>' + point + '</li>').join('')}
      </ul>
    </div>
  </div>

  <!-- SECTION 4: LOAD VS RECOVERY CAPACITY -->
  <div class="section">
    <div class="section-header">
      <h2>Section 4: LOAD VS RECOVERY CAPACITY</h2>
    </div>

    <div class="content-box">
      <h3>${data.loadCapacityBand}</h3>
      <p>${load.description}</p>
      <ul>
        ${load.points.map(point => '<li>' + point + '</li>').join('')}
      </ul>
    </div>
  </div>

  <!-- SECTION 5: STABILITY & ESCALATION RISK -->
  <div class="section">
    <div class="section-header">
      <h2>Section 5: STABILITY & ESCALATION RISK</h2>
    </div>

    <div class="content-box">
      <h3>${data.stability}</h3>
      <p>${stability.description}</p>
      <ul>
        ${stability.points.map(point => '<li>' + point + '</li>').join('')}
      </ul>
    </div>
  </div>

  <!-- LOOP INTENSITY SCORES -->
  <div class="section">
    <div class="section-header">
      <h2>Your Loop Intensity Scores</h2>
    </div>

    <div class="score-grid">
      <div class="score-item">
        <span class="score-label">Anticipatory:</span> ${data.loopScores.anticipatory}
      </div>
      <div class="score-item">
        <span class="score-label">Control:</span> ${data.loopScores.control}
      </div>
      <div class="score-item">
        <span class="score-label">Reassurance:</span> ${data.loopScores.reassurance}
      </div>
      <div class="score-item">
        <span class="score-label">Avoidance:</span> ${data.loopScores.avoidance}
      </div>
      <div class="score-item">
        <span class="score-label">Somatic:</span> ${data.loopScores.somatic}
      </div>
      <div class="score-item">
        <span class="score-label">Cognitive Overload:</span> ${data.loopScores.cognitiveOverload}
      </div>
    </div>
  </div>

  <!-- CTA BOX -->
  <div class="cta-box">
    <h3>Ready to Take the Next Step?</h3>
    <p>Book a consultation with our clinical team to discuss your CALA results</p>
    <p><strong>Visit:</strong> ${CONFIG.COMPANY_WEBSITE}/contact</p>
    <p><strong>WhatsApp:</strong> ${CONFIG.WHATSAPP_NUMBER}</p>
  </div>

  <div class="footer">
    <strong>CuraGo - Your Partner in Emotional Wellness</strong>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.SUPPORT_EMAIL}</p>
    <p style="margin-top: 8px;">
      Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>
</body>
</html>
  `;

  return Utilities.newBlob(html, 'text/html', 'temp.html').getAs('application/pdf');
}

// ============================================================
// SEND CALA EMAIL WITH PDF
// ============================================================
function sendCalaPdfEmail(data, pdfFile) {
  const plainBody = `
Hi ${data.name}!

Thank you for completing the CALA 1.0 assessment.

Your detailed results are attached as a PDF document.

QUICK SUMMARY:
Primary Loop: ${data.primaryLoop}
${data.secondaryLoop ? 'Secondary Loop: ' + data.secondaryLoop : ''}
Trigger Pattern: ${data.triggerType}
Reinforcement: ${data.reinforcement}
Load vs Recovery: ${data.loadCapacityBand}
Stability: ${data.stability}

Next Steps:
- Book a consultation: ${CONFIG.COMPANY_WEBSITE}/contact
- Chat with us on WhatsApp: ${CONFIG.WHATSAPP_NUMBER}

Best regards,
CuraGo Team
${CONFIG.COMPANY_WEBSITE}
  `;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .header { background: #096b17; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background: #f8f9fa; }
    .cta-button { background: #64CB81; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your CALA 1.0 Results</h1>
  </div>
  <div class="content">
    <h2>Hi ${data.name}!</h2>
    <p>Thank you for completing the CALA 1.0 assessment.</p>
    <p><strong>Your detailed results are attached as a PDF document.</strong></p>
    <p>Primary Loop: <strong>${data.primaryLoop}</strong></p>
    <p style="text-align: center;">
      <a href="${CONFIG.COMPANY_WEBSITE}/contact" class="cta-button">Book Consultation</a>
    </p>
  </div>
  <div class="footer">
    <p><strong>CuraGo Team</strong></p>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.WHATSAPP_NUMBER}</p>
  </div>
</body>
</html>
  `;

  GmailApp.sendEmail(
    data.email,
    CONFIG.EMAIL_SUBJECT_CALA,
    plainBody,
    {
      htmlBody: htmlBody,
      name: CONFIG.FROM_NAME,
      attachments: [pdfFile.getBlob()]
    }
  );

  Logger.log('CALA email with PDF sent to: ' + data.email);
}

// ============================================================
// GBSI SUBMISSION HANDLER
// ============================================================
function handleGbsiSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.GBSI_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.GBSI_SHEET_NAME + '" not found. Please create it.');
  }

  // Generate PDF and save to Drive
  const pdfFile = savePdfToDrive(generateGbsiPdf(data), 'GBSI_Results_' + data.name.replace(/\s+/g, '_'));
  const pdfUrl = pdfFile.getUrl();

  // Save to Google Sheet with PDF link
  const rowData = [
    new Date(),
    data.name,
    data.email || '',
    data.phoneNumber,
    data.age,
    data.alarmingSigns.join(', '),
    data.familyHistory.join(', '),
    data.painFrequency,
    data.reliefFactor,
    data.bristolType,
    data.refluxFrequency,
    data.fullnessFactor,
    data.fattyLiver,
    data.stressLevel,
    data.brainFog,
    data.dietaryHabits.lateNightDinners ? 'Yes' : 'No',
    data.dietaryHabits.highCaffeine ? 'Yes' : 'No',
    data.dietaryHabits.frequentJunk ? 'Yes' : 'No',
    data.dietaryHabits.skipBreakfast ? 'Yes' : 'No',
    data.resultType,
    data.ibsType || 'N/A',
    data.hasRedFlags ? 'Yes' : 'No',
    data.brainGutSensitivity,
    data.axisScore,
    data.eventId,
    pdfUrl // PDF link in last column
  ];

  sheet.appendRow(rowData);
  Logger.log('Data saved to sheet with PDF link');

  // Send email with PDF
  if (data.email && data.email.trim() !== '') {
    sendGbsiPdfEmail(data, pdfFile);
    Logger.log('Email sent to: ' + data.email);
  } else {
    Logger.log('No email provided, skipping email send');
  }

  return { success: true, message: 'GBSI results saved and email sent', pdfUrl: pdfUrl };
}

// ============================================================
// GBSI PDF GENERATOR - COMPREHENSIVE VERSION WITH ALL DETAILS
// ============================================================
function generateGbsiPdf(data) {
  // Helper function to get alarming signs as readable text
  const getAlarmingSignsText = function(signs) {
    const mapping = {
      'weightLoss': 'Unintended weight loss (>5kg in 6 months)',
      'bloodInStool': 'Blood in stool or black/tarry stool',
      'difficultySwallowing': 'Difficulty swallowing or feeling food "stuck"',
      'persistentVomiting': 'Persistent vomiting',
      'nightSymptoms': 'Symptoms that wake you up from deep sleep'
    };

    return signs
      .filter(function(sign) { return sign !== 'none'; })
      .map(function(sign) { return mapping[sign] || sign; })
      .join(', ');
  };

  // Get comprehensive result content based on result type
  const getResultContent = function() {
    switch(data.resultType) {
      case 'clinicalPriority':
        var alarmingSigns = getAlarmingSignsText(data.alarmingSigns);
        var reasons = [];
        if (alarmingSigns) reasons.push(alarmingSigns);
        if (data.age === 'over50') reasons.push('your age');
        if (data.familyHistory.includes('colorectalCancer')) reasons.push('your family history of colorectal cancer');

        return {
          title: 'Urgent Surgical Evaluation Recommended',
          color: '#dc2626',
          mainText: 'Based on your reports of <strong>' + reasons.join(', ') + '</strong>, we cannot categorize this as simple IBS.',
          detailText: 'As a Surgical Gastroenterologist, I recommend a physical examination and likely an Endoscopy/Colonoscopy to rule out structural issues immediately.',
          warning: 'This assessment does not replace professional medical advice. Please seek immediate medical attention.',
          recommendations: [
            'Book an urgent consultation with a gastroenterologist',
            'Get a physical examination as soon as possible',
            'Discuss Endoscopy/Colonoscopy with your doctor',
            'Bring this report to your consultation'
          ]
        };

      case 'brainGutOverdrive':
        var symptoms = [];
        if (data.brainFog === 'yesFrequently') symptoms.push('"Brain Fog"');
        if (data.stressLevel > 7) symptoms.push('high stress levels');

        return {
          title: 'Your Axis is Hypersensitive',
          subtitle: data.ibsType && data.ibsType !== 'none' ? 'IBS Type: ' + data.ibsType : '',
          color: '#7c3aed',
          mainText: 'You meet the Rome IV criteria for IBS. ' + (symptoms.length > 0 ? 'Your ' + symptoms.join(' and ') + ' suggest ' : '') + 'your Vagus nerve is in a state of hyper-vigilance.',
          detailText: 'Your reports are likely "Normal" because the issue is <strong>communication, not anatomy</strong>.',
          brainGutInfo: 'Your Brain-Gut Axis Score: ' + data.axisScore + '/3<br>Brain-Gut Sensitivity: <strong>' + data.brainGutSensitivity.toUpperCase() + '</strong>',
          recommendations: [
            'Start the 12-Month Gut-Brain Recalibration Program',
            'Learn vagus nerve regulation techniques',
            'Personalized dietary modifications based on your triggers',
            'Consider consultation for a comprehensive treatment plan'
          ]
        };

      case 'mechanicalMetabolic':
        var issues = [];
        if (data.refluxFrequency === 'dailyNightly') issues.push('Daily/Nightly Reflux or Acidity');
        if (data.fullnessFactor === 'yes') issues.push('Early Satiety (Uncomfortable Fullness)');
        if (data.fattyLiver === 'yes') issues.push('Fatty Liver Disease');

        var detailParts = [];
        if (data.fattyLiver === 'yes') detailParts.push('Your liver is struggling to process the metabolic load, which is why you may feel sluggish.');
        if (data.refluxFrequency === 'dailyNightly') detailParts.push('Your frequent reflux needs to be addressed to prevent complications.');
        if (data.fullnessFactor === 'yes') detailParts.push('The early fullness suggests your digestive motility may be affected.');

        return {
          title: 'Upper GI Dysfunction & Metabolic Load',
          color: '#ea580c',
          mainText: 'Your symptoms point toward <strong>Functional Dyspepsia or GERD</strong>' + (data.fattyLiver === 'yes' ? ', complicated by Fatty Liver' : '') + '.',
          detailText: detailParts.join(' '),
          issuesList: issues,
          recommendations: [
            'Custom Diet & Lifestyle Protocol for upper GI health',
            'Metabolic load management strategies',
            data.fattyLiver === 'yes' ? 'Liver health optimization program' : 'Digestive health monitoring',
            'Book consultation for personalized treatment plan'
          ]
        };

      case 'allClear':
        var habits = [];
        if (data.dietaryHabits.lateNightDinners) habits.push('Late night dinners');
        if (data.dietaryHabits.highCaffeine) habits.push('High caffeine intake');
        if (data.dietaryHabits.frequentJunk) habits.push('Frequent junk/processed food');
        if (data.dietaryHabits.skipBreakfast) habits.push('Skipping breakfast');

        return {
          title: "You're Doing Great!",
          subtitle: 'But Watch the Habits',
          color: '#16a34a',
          mainText: 'You don\'t meet the criteria for IBS or serious pathology. Your symptoms are likely <strong>"Lifestyle Gastritis"</strong>.',
          habits: habits,
          recommendations: [
            'Reduce late-night meals (eat at least 3 hours before bed)',
            'Limit caffeine intake, especially on an empty stomach',
            'Minimize processed and junk food consumption',
            'Maintain regular meal times and don\'t skip breakfast',
            'Stay hydrated and manage stress levels'
          ]
        };

      default:
        return {
          title: 'Assessment Complete',
          color: '#096b17',
          mainText: 'Your GBSI assessment has been completed.',
          detailText: ''
        };
    }
  };

  const resultContent = getResultContent();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
      font-size: 11pt;
    }
    .header {
      background: #096b17;
      color: white;
      padding: 25px;
      text-align: center;
      margin-bottom: 25px;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24pt;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 12pt;
      opacity: 0.95;
    }
    .greeting {
      font-size: 14pt;
      margin-bottom: 15px;
      color: #096b17;
      font-weight: bold;
    }
    .result-box {
      background: ${resultContent.color};
      color: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .result-title {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: ${resultContent.subtitle ? '8px' : '12px'};
    }
    .result-subtitle {
      font-size: 14pt;
      margin-bottom: 12px;
      opacity: 0.95;
    }
    .result-text {
      font-size: 11pt;
      line-height: 1.6;
      margin: 10px 0;
    }
    .section {
      background: #ffffff;
      padding: 18px;
      margin-bottom: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .section h2 {
      margin: 0 0 12px 0;
      color: #096b17;
      font-size: 14pt;
      font-weight: bold;
    }
    .section h3 {
      margin: 12px 0 8px 0;
      color: #096b17;
      font-size: 12pt;
      font-weight: bold;
    }
    .info-box {
      background: #f0f7f1;
      padding: 15px;
      margin: 12px 0;
      border-left: 4px solid #096b17;
      border-radius: 4px;
    }
    .info-box h4 {
      margin: 0 0 8px 0;
      color: #096b17;
      font-size: 11pt;
      font-weight: bold;
    }
    .info-box ul {
      margin: 8px 0 0 18px;
      padding: 0;
    }
    .info-box li {
      margin: 4px 0;
      font-size: 10.5pt;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 12px;
    }
    .score-item {
      background: #f8f9fa;
      padding: 12px;
      border-left: 3px solid #096b17;
      border-radius: 4px;
    }
    .score-label {
      font-weight: bold;
      color: #096b17;
      font-size: 10pt;
    }
    .score-value {
      font-size: 11pt;
      margin-top: 5px;
      color: #333;
    }
    .recommendations {
      background: #f8f9fa;
      padding: 18px;
      margin: 15px 0;
      border-radius: 6px;
    }
    .recommendations h3 {
      margin: 0 0 12px 0;
      color: #096b17;
      font-size: 13pt;
      font-weight: bold;
    }
    .recommendations ul {
      margin: 0;
      padding-left: 20px;
    }
    .recommendations li {
      margin: 8px 0;
      font-size: 10.5pt;
      line-height: 1.5;
    }
    .warning-box {
      background: #fef2f2;
      border: 2px solid #fca5a5;
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
      color: #991b1b;
      font-weight: 500;
      page-break-inside: avoid;
    }
    .cta-box {
      background: #096b17;
      color: white;
      padding: 18px;
      text-align: center;
      margin: 20px 0;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .cta-box h3 {
      margin: 0 0 10px 0;
      font-size: 13pt;
    }
    .cta-box p {
      margin: 6px 0;
      font-size: 10.5pt;
    }
    .footer {
      text-align: center;
      margin-top: 25px;
      padding-top: 18px;
      border-top: 2px solid #e0e0e0;
      color: #666;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your GBSI Assessment Results</h1>
    <p>Gut-Brain Sensitivity Index - Comprehensive Report</p>
  </div>

  <p class="greeting">Hi ${data.name}!</p>
  <p style="margin-bottom: 20px;">Thank you for completing the GBSI assessment. Here is your comprehensive personalized report:</p>

  <!-- Main Result Box -->
  <div class="result-box">
    <div class="result-title">${resultContent.title}</div>
    ${resultContent.subtitle ? '<div class="result-subtitle">' + resultContent.subtitle + '</div>' : ''}
    <div class="result-text">${resultContent.mainText}</div>
    ${resultContent.detailText ? '<div class="result-text" style="margin-top: 12px;">' + resultContent.detailText + '</div>' : ''}
    ${resultContent.brainGutInfo ? '<div class="result-text" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">' + resultContent.brainGutInfo + '</div>' : ''}
  </div>

  <!-- Warning Box (if applicable) -->
  ${resultContent.warning ? `
  <div class="warning-box">
    <strong>⚠️ IMPORTANT:</strong> ${resultContent.warning}
  </div>
  ` : ''}

  <!-- Key Issues Identified (for Mechanical/Metabolic) -->
  ${resultContent.issuesList && resultContent.issuesList.length > 0 ? `
  <div class="info-box">
    <h4>Key Issues Identified:</h4>
    <ul>
      ${resultContent.issuesList.map(function(issue) { return '<li>' + issue + '</li>'; }).join('')}
    </ul>
  </div>
  ` : ''}

  <!-- Dietary Habits (for All Clear) -->
  ${resultContent.habits && resultContent.habits.length > 0 ? `
  <div class="info-box">
    <h4>Habits to Watch Out For:</h4>
    <ul>
      ${resultContent.habits.map(function(habit) { return '<li>' + habit + '</li>'; }).join('')}
    </ul>
  </div>
  ` : ''}

  <!-- Brain-Gut Axis Assessment -->
  <div class="section">
    <h2>Brain-Gut Axis Assessment</h2>
    <div class="score-grid">
      <div class="score-item">
        <div class="score-label">Axis Score</div>
        <div class="score-value">${data.axisScore}/3</div>
      </div>
      <div class="score-item">
        <div class="score-label">Brain-Gut Sensitivity</div>
        <div class="score-value">${data.brainGutSensitivity.toUpperCase()}</div>
      </div>
      ${data.ibsType && data.ibsType !== 'none' ? `
      <div class="score-item">
        <div class="score-label">IBS Classification</div>
        <div class="score-value">${data.ibsType}</div>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- Detailed Assessment Data -->
  <div class="section">
    <h2>Your Assessment Details</h2>
    <div class="score-grid">
      <div class="score-item">
        <div class="score-label">Age Range</div>
        <div class="score-value">${data.age}</div>
      </div>
      <div class="score-item">
        <div class="score-label">Pain Frequency</div>
        <div class="score-value">${data.painFrequency}</div>
      </div>
      <div class="score-item">
        <div class="score-label">Pain Relief Factor</div>
        <div class="score-value">${data.reliefFactor === 'yes' ? 'Related to Stool' : 'No Relation'}</div>
      </div>
      <div class="score-item">
        <div class="score-label">Stool Type (Bristol)</div>
        <div class="score-value">${data.bristolType.replace('type', 'Type ')}</div>
      </div>
      <div class="score-item">
        <div class="score-label">Reflux/Acidity</div>
        <div class="score-value">${data.refluxFrequency}</div>
      </div>
      <div class="score-item">
        <div class="score-label">Early Fullness</div>
        <div class="score-value">${data.fullnessFactor === 'yes' ? 'Yes' : 'No'}</div>
      </div>
      <div class="score-item">
        <div class="score-label">Fatty Liver</div>
        <div class="score-value">${data.fattyLiver === 'yes' ? 'Yes' : data.fattyLiver === 'no' ? 'No' : "Don't Know"}</div>
      </div>
      <div class="score-item">
        <div class="score-label">Stress Level</div>
        <div class="score-value">${data.stressLevel}/10</div>
      </div>
      <div class="score-item">
        <div class="score-label">Brain Fog</div>
        <div class="score-value">${data.brainFog === 'yesFrequently' ? 'Yes, Frequently' : 'No'}</div>
      </div>
    </div>

    <!-- Family History -->
    <h3 style="margin-top: 15px;">Family History</h3>
    <p style="font-size: 10.5pt; margin: 5px 0;">${data.familyHistory.filter(function(h) { return h !== 'none'; }).length > 0 ? data.familyHistory.filter(function(h) { return h !== 'none'; }).map(function(h) { return h === 'colorectalCancer' ? 'Colorectal Cancer' : h === 'ibd' ? 'IBD (Ulcerative Colitis/Crohn\'s)' : h === 'celiac' ? 'Celiac Disease' : h; }).join(', ') : 'None reported'}</p>

    <!-- Dietary Habits -->
    <h3 style="margin-top: 15px;">Dietary Habits</h3>
    <p style="font-size: 10.5pt; margin: 5px 0;">
      ${data.dietaryHabits.lateNightDinners ? 'Late Night Dinners, ' : ''}${data.dietaryHabits.highCaffeine ? 'High Caffeine, ' : ''}${data.dietaryHabits.frequentJunk ? 'Frequent Junk Food, ' : ''}${data.dietaryHabits.skipBreakfast ? 'Skip Breakfast' : ''}${(!data.dietaryHabits.lateNightDinners && !data.dietaryHabits.highCaffeine && !data.dietaryHabits.frequentJunk && !data.dietaryHabits.skipBreakfast) ? 'No concerning habits reported' : ''}
    </p>
  </div>

  <!-- Recommendations -->
  ${resultContent.recommendations && resultContent.recommendations.length > 0 ? `
  <div class="recommendations">
    <h3>Recommended Next Steps</h3>
    <ul>
      ${resultContent.recommendations.map(function(rec) { return '<li>' + rec + '</li>'; }).join('')}
    </ul>
  </div>
  ` : ''}

  <!-- CTA Box -->
  <div class="cta-box">
    <h3>Ready to Take Your Next Step?</h3>
    <p>Book a consultation with our gastroenterology experts</p>
    <p><strong>Visit:</strong> ${CONFIG.COMPANY_WEBSITE}/contact</p>
    <p><strong>WhatsApp:</strong> ${CONFIG.WHATSAPP_NUMBER}</p>
  </div>

  <div class="footer">
    <strong>CuraGo - Your Partner in Gut Health</strong>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.SUPPORT_EMAIL}</p>
    <p style="margin-top: 8px;">
      Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
    <p style="margin-top: 8px; font-size: 8pt; font-style: italic;">
      This assessment provides educational insights and does not replace professional medical advice.
    </p>
  </div>
</body>
</html>
  `;

  return Utilities.newBlob(html, 'text/html', 'temp.html').getAs('application/pdf');
}

// ============================================================
// SEND GBSI EMAIL WITH PDF
// ============================================================
function sendGbsiPdfEmail(data, pdfFile) {
  // Get result type text
  const getResultText = function() {
    switch(data.resultType) {
      case 'clinicalPriority':
        return 'Urgent Surgical Evaluation Recommended';
      case 'brainGutOverdrive':
        return 'Your Axis is Hypersensitive';
      case 'mechanicalMetabolic':
        return 'Upper GI Dysfunction & Metabolic Load';
      case 'allClear':
        return "You're Doing Great!";
      default:
        return 'Assessment Complete';
    }
  };

  const plainBody = `
Hi ${data.name}!

Thank you for completing the GBSI (Gut-Brain Sensitivity Index) Assessment.

Your comprehensive results report is attached as a PDF document.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Result: ${getResultText()}
${data.ibsType && data.ibsType !== 'none' ? 'IBS Classification: ' + data.ibsType : ''}
Brain-Gut Sensitivity: ${data.brainGutSensitivity.toUpperCase()}
Axis Score: ${data.axisScore}/3

Assessment Details:
• Pain Frequency: ${data.painFrequency}
• Stool Type: ${data.bristolType}
• Stress Level: ${data.stressLevel}/10
• Brain Fog: ${data.brainFog === 'yesFrequently' ? 'Yes, Frequently' : 'No'}
${data.refluxFrequency === 'dailyNightly' ? '• Reflux: Daily/Nightly' : ''}
${data.fattyLiver === 'yes' ? '• Fatty Liver: Yes' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review the attached PDF for your complete personalized report including detailed explanations and recommended next steps.

NEXT STEPS:
→ Book a consultation: ${CONFIG.COMPANY_WEBSITE}/contact
→ WhatsApp us: ${CONFIG.WHATSAPP_NUMBER}
→ Visit our website: ${CONFIG.COMPANY_WEBSITE}

Best regards,
CuraGo Team
Your Partner in Gut Health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.hasRedFlags ? '⚠️ IMPORTANT: Your results indicate red flags that require professional medical evaluation. Please seek immediate medical attention.' : ''}
  `;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .header { background: #096b17; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background-color: white; max-width: 600px; margin: 0 auto; }
    .summary-box { background: #f8f9fa; border-left: 4px solid #096b17; padding: 20px; margin: 20px 0; }
    .summary-box h3 { margin-top: 0; color: #096b17; }
    .summary-item { margin: 8px 0; }
    .summary-item strong { color: #096b17; }
    ${data.hasRedFlags ? '.warning-box { background: #fef2f2; border: 2px solid #fca5a5; padding: 15px; margin: 15px 0; color: #991b1b; border-radius: 5px; }' : ''}
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background: #f8f9fa; }
    .cta-button { background: #096b17; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 5px; }
    .cta-button:hover { background: #075110; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your GBSI Assessment Results</h1>
    <p>Gut-Brain Sensitivity Index</p>
  </div>
  <div class="content">
    <h2>Hi ${data.name}!</h2>
    <p>Thank you for completing the GBSI assessment.</p>
    <p><strong>Your comprehensive results report is attached as a PDF document.</strong></p>

    <div class="summary-box">
      <h3>Quick Summary</h3>
      <div class="summary-item"><strong>Result:</strong> ${getResultText()}</div>
      ${data.ibsType && data.ibsType !== 'none' ? '<div class="summary-item"><strong>IBS Type:</strong> ' + data.ibsType + '</div>' : ''}
      <div class="summary-item"><strong>Brain-Gut Sensitivity:</strong> ${data.brainGutSensitivity.toUpperCase()}</div>
      <div class="summary-item"><strong>Axis Score:</strong> ${data.axisScore}/3</div>
      <div class="summary-item"><strong>Stress Level:</strong> ${data.stressLevel}/10</div>
    </div>

    ${data.hasRedFlags ? `
    <div class="warning-box">
      <strong>⚠️ IMPORTANT:</strong> Your results indicate red flags that require professional medical evaluation. Please seek immediate medical attention.
    </div>
    ` : ''}

    <p style="text-align: center; margin-top: 30px;">
      <a href="${CONFIG.COMPANY_WEBSITE}/contact" class="cta-button">Book Consultation</a>
      <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}" class="cta-button">WhatsApp Us</a>
    </p>
  </div>
  <div class="footer">
    <p><strong>CuraGo - Your Partner in Gut Health</strong></p>
    <p>${CONFIG.COMPANY_WEBSITE} | ${CONFIG.WHATSAPP_NUMBER}</p>
    <p style="margin-top: 10px; font-size: 12px; color: #999;">
      This assessment provides educational insights and does not replace professional medical advice.
    </p>
  </div>
</body>
</html>
  `;

  GmailApp.sendEmail(
    data.email,
    CONFIG.EMAIL_SUBJECT_GBSI,
    plainBody,
    {
      htmlBody: htmlBody,
      name: CONFIG.FROM_NAME,
      attachments: [pdfFile.getBlob()]
    }
  );

  Logger.log('GBSI email with PDF sent to: ' + data.email);
}

// ============================================================
// PRIORITY CIRCLE 365 SUBMISSION HANDLER
// ============================================================
function handlePriorityCircleSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.PRIORITY_CIRCLE_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.PRIORITY_CIRCLE_SHEET_NAME + '" not found. Please create it.');
  }

  const timestamp = new Date();
  const rowData = [
    timestamp,
    data.name || '',
    data.phoneNumber || '',
    data.email || '',
    data.age || '',
    data.city || '',
    data.area || '',
    data.hasGutBrainProblem || '',
    data.problemDescription || '',
    data.preferredOption || '',
    'Pending Review',
    ''
  ];

  sheet.appendRow(rowData);
  Logger.log('Priority Circle 365 application saved to sheet');

  return {
    success: true,
    message: 'Priority Circle 365 application submitted successfully',
    timestamp: timestamp.toISOString()
  };
}

// ============================================================
// CONSULTATION BOOKING SUBMISSION HANDLER
// ============================================================
function handleConsultationBookingSubmission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.CONSULTATION_BOOKING_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.CONSULTATION_BOOKING_SHEET_NAME + '" not found. Please create it.');
  }

  const timestamp = new Date();
  const rowData = [
    timestamp,
    data.name || '',
    data.phoneNumber || '',
    data.email || '',
    data.consultationType || '',
    data.preferredDate || '',
    data.preferredTime || '',
    'Pending Confirmation',
    ''
  ];

  sheet.appendRow(rowData);
  Logger.log('Consultation booking saved to sheet');

  return {
    success: true,
    message: 'Consultation booking submitted successfully',
    timestamp: timestamp.toISOString()
  };
}
