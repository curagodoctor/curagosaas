/**
 * Auto-generated page metadata + boilerplate pages for a doctor's website.
 * Everything is built from VERIFIED doctor/clinic data — never invented.
 */

const clean = (s) => String(s || '').trim();
const withDr = (name) => {
  const n = clean(name);
  if (!n) return '';
  return /^dr\.?\s/i.test(n) ? n : `Dr ${n}`;
};

// "Dr Yuvaraj | Gastrosurgery | Mumbai" — name + specialty + city, skipping blanks.
export function buildSiteTitle(name, specialty, city) {
  const parts = [withDr(name), clean(specialty), clean(city)].filter(Boolean);
  return parts.join(' | ') || withDr(name) || 'My Clinic';
}

// A concise, factual meta description (<=155 chars). Prefers a tagline, else a
// grounded default. Never makes claims.
export function buildMetaDescription({ name, specialty, city, tagline }) {
  const who = [withDr(name), clean(specialty) && clean(specialty), clean(city) && `in ${clean(city)}`].filter(Boolean).join(', ');
  const t = clean(tagline);
  const tail = t || 'View qualifications, services and clinic details, and book an appointment online.';
  return `${who}. ${tail}`.replace(/\s+/g, ' ').trim().slice(0, 155);
}

// Build the visible clinic card shape from a Clinic doc (for clinic_info sections).
export function clinicToCard(c) {
  const a = c.address || {};
  const address = [a.street, a.city, a.state, a.pincode].map((x) => clean(x)).filter(Boolean).join(', ');
  return { name: clean(c.name), address, phone: clean(c.phone), timings: clean(c.timings), locationLink: clean(c.mapUrl) };
}

// --- Boilerplate legal pages (standard, reviewed templates; only the clinic's
// own details are filled in — no invented clauses). Returned as plain text the
// page renders in a custom_text section.
export function buildPrivacyPolicy({ clinicName, doctorName, city, email, phone }) {
  const who = clinicName || withDr(doctorName) || 'this clinic';
  const contact = [email && `email ${email}`, phone && `phone ${phone}`].filter(Boolean).join(' or ') || 'the clinic';
  const year = '2026';
  return `Privacy Policy

Last updated: ${year}

${who}${city ? `, ${city}` : ''} ("we", "us") respects your privacy. This policy explains what information we collect through this website and how we use it.

Information we collect
When you submit an enquiry or booking request, we collect the details you provide — such as your name, phone number, email and the message or appointment preference you enter. We may also collect basic, non-identifying analytics about how the website is used.

How we use your information
We use your information only to respond to your enquiry, arrange appointments, and provide the care and communication you have asked for. We do not sell your personal information.

Sharing
We do not share your personal information with third parties except as needed to operate this website and our clinic services, or where required by law.

Data security & retention
We take reasonable measures to protect your information and retain it only as long as necessary for the purposes above or as required by law.

Your choices
You may contact us to ask what information we hold about you, to correct it, or to request its deletion, subject to any legal record-keeping obligations.

Contact
For any privacy question, contact us via ${contact}.`;
}

export function buildTerms({ clinicName, doctorName, city }) {
  const who = clinicName || withDr(doctorName) || 'this clinic';
  const year = '2026';
  return `Terms of Use

Last updated: ${year}

These terms apply to your use of this website operated by ${who}${city ? `, ${city}` : ''}.

Information, not medical advice
The content on this website is for general information only. It is not medical advice and is not a substitute for a consultation with a qualified doctor. Always seek professional advice for your specific situation. In an emergency, contact your nearest hospital.

Appointments & enquiries
Submitting an enquiry or booking request is a request for an appointment and does not by itself confirm one. We will contact you to confirm availability.

No guarantees
We make no guarantees about specific medical outcomes. Individual results depend on each patient's circumstances.

Intellectual property
The content on this website belongs to the clinic and may not be copied or reused without permission.

Changes
We may update these terms from time to time. Continued use of the website means you accept the current version.`;
}
