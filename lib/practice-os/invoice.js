import { Resend } from 'resend';
import Doctor from '@/models/Doctor';
import Framework from '@/models/practice-os/Framework';

/**
 * Practice OS — purchase invoice (emailed after a successful pack payment).
 *
 * Business/GST details come from env so the founder can fill them without a code
 * change: SELLER_NAME, SELLER_GSTIN, SELLER_ADDRESS, INVOICE_HSN (SAC code).
 */
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Curago <noreply@curago.in>';

const SELLER = {
  name: process.env.SELLER_NAME || 'CuraGo',
  gstin: process.env.SELLER_GSTIN || '33AAMCC4761F1ZP',
  address: process.env.SELLER_ADDRESS || '2/82 B, Thangavel Nagar, Alagapuram, Salem, Tamil Nadu 636016',
  sac: process.env.INVOICE_HSN || '',
};

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export function invoiceNumber(purchase) {
  return `CURAGO-POS-${String(purchase._id || purchase.paymentId).slice(-8).toUpperCase()}`;
}

export function buildInvoiceHtml({ doctor, packTitle, purchase }) {
  const invNo = invoiceNumber(purchase);
  const date = new Date(purchase.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const base = purchase.baseInInr || 0;
  const gst = purchase.gstInInr || 0;
  const pct = purchase.gstPercent || 0;
  const total = purchase.amountInInr || base + gst;

  return `<!doctype html><html><body style="margin:0;background:#F7F9F5;font-family:Arial,Helvetica,sans-serif;color:#101A13">
  <div style="max-width:640px;margin:0 auto;padding:28px">
    <div style="background:#fff;border:1px solid #DDE4D9;border-radius:14px;overflow:hidden">
      <div style="background:#096B17;color:#fff;padding:22px 26px;display:flex;justify-content:space-between">
        <div style="font-size:20px;font-weight:800">${SELLER.name}</div>
        <div style="text-align:right;font-size:12px;line-height:1.5;opacity:.9">TAX INVOICE<br>${invNo}<br>${date}</div>
      </div>
      <div style="padding:26px">
        <table style="width:100%;font-size:13px;color:#5E6B5F;margin-bottom:20px"><tr>
          <td style="vertical-align:top">
            <div style="font-weight:700;color:#101A13;margin-bottom:4px">Billed to</div>
            ${doctor?.displayName || doctor?.name || ''}<br>${doctor?.email || ''}
          </td>
          <td style="vertical-align:top;text-align:right">
            <div style="font-weight:700;color:#101A13;margin-bottom:4px">From</div>
            ${SELLER.name}<br>${SELLER.address ? SELLER.address + '<br>' : ''}${SELLER.gstin ? 'GSTIN: ' + SELLER.gstin : ''}
          </td>
        </tr></table>

        <table style="width:100%;border-collapse:collapse;font-size:13.5px">
          <thead><tr style="background:#EDF1EB;color:#5E6B5F;text-align:left">
            <th style="padding:10px 12px;border-radius:8px 0 0 8px">Description${SELLER.sac ? ` (SAC ${SELLER.sac})` : ''}</th>
            <th style="padding:10px 12px;text-align:right;border-radius:0 8px 8px 0">Amount</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:12px">${packTitle} — Practice OS builder pack</td><td style="padding:12px;text-align:right">${inr(base)}</td></tr>
            <tr><td style="padding:12px;color:#5E6B5F">GST @ ${pct}%</td><td style="padding:12px;text-align:right">${inr(gst)}</td></tr>
            <tr style="border-top:2px solid #DDE4D9"><td style="padding:12px;font-weight:800">Total paid</td><td style="padding:12px;text-align:right;font-weight:800;font-size:16px;color:#096B17">${inr(total)}</td></tr>
          </tbody>
        </table>

        <div style="margin-top:20px;font-size:12px;color:#5E6B5F;line-height:1.6">
          Payment ID: ${purchase.paymentId || '—'}${purchase.orderId ? `<br>Order ID: ${purchase.orderId}` : ''}<br>
          Paid via Razorpay · Status: Paid
        </div>
        <p style="margin-top:20px;font-size:11.5px;color:#8a8a8a">This is a computer-generated invoice. Thank you for your purchase.</p>
      </div>
    </div>
  </div></body></html>`;
}

/**
 * Email the invoice for a completed purchase. Returns true if sent.
 * Fetches the doctor + pack from the purchase.
 */
export async function sendInvoiceEmail(purchase) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Practice OS invoice] RESEND_API_KEY not set — skipping invoice email');
    return false;
  }
  const [doctor, framework] = await Promise.all([
    Doctor.findById(purchase.doctorId).select('name displayName email').lean(),
    Framework.findById(purchase.frameworkId).select('title').lean(),
  ]);
  if (!doctor?.email) return false;

  const html = buildInvoiceHtml({ doctor, packTitle: framework?.title || 'Practice OS', purchase });
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: doctor.email,
    subject: `Your CuraGo invoice · ${invoiceNumber(purchase)}`,
    html,
  });
  if (error) { console.error('[Practice OS invoice] send failed:', error); return false; }
  return true;
}
