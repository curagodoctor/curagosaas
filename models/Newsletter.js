import mongoose from 'mongoose';

// The 9 fixed template sections (the founder's Practice Builder newsletter format).
// heading = the section title shown in the email; body = the admin-written content.
// Only sections with a non-empty body render in the sent email.
export const NEWSLETTER_SECTIONS = [
  { key: 'observation',    label: 'The Observation',   hint: 'Something interesting.' },
  { key: 'problem',        label: 'The Problem',       hint: 'What doctors commonly get wrong.' },
  { key: 'insight',        label: 'The Insight',       hint: 'Why it happens.' },
  { key: 'framework',      label: 'The Framework',     hint: 'A simple mental model.' },
  { key: 'doThisToday',    label: 'Do This Today',     hint: 'One 10-minute action.' },
  { key: 'realWorld',      label: 'Real World',        hint: 'Example / teardown / case.' },
  { key: 'practiceSafety', label: 'Practice Safety',   hint: 'Compliance + credibility check.' },
  { key: 'yourNextMove',   label: 'Your Next Move',    hint: 'One CTA.' },
  { key: 'oneQuestion',    label: 'One Question',      hint: 'A thought-provoking closing question.' },
];

// Audience segments the newsletter may target. Patient contacts are intentionally
// excluded — they consented to their doctor, not to Curago.
export const NEWSLETTER_SEGMENTS = ['doctors', 'cohort', 'waitlist'];

const SectionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  heading: { type: String, default: '' },
  body: { type: String, default: '' },
  imageUrl: { type: String, default: '' },   // optional per-section image (public URL)
}, { _id: false });

const NewsletterSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  preheader: { type: String, default: '', trim: true },   // inbox preview text
  intro: { type: String, default: 'One idea to build a stronger clinical practice.', trim: true },

  // Optional CTA for the "Your Next Move" button.
  ctaLabel: { type: String, default: '', trim: true },
  ctaUrl: { type: String, default: '', trim: true },

  // Media
  heroImage: { type: String, default: '' },   // top banner (public URL)
  pdfUrl: { type: String, default: '' },       // attached/linked PDF (public URL)
  pdfLabel: { type: String, default: 'Download the guide' },

  sections: { type: [SectionSchema], default: [] },

  segments: { type: [String], default: ['doctors', 'cohort', 'waitlist'] },

  // Delivery options
  replyTo: { type: String, default: '' },      // where replies to "One Question" go
  showReadTime: { type: Boolean, default: true },
  scheduledFor: { type: Date },                // set → status 'scheduled'

  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'sent'], default: 'draft', index: true },

  // Send results (immediate-send model).
  stats: {
    recipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },   // suppressed / unsubscribed
  },

  createdBy: { type: String, default: '' },   // admin email
  sentAt: { type: Date },
}, { timestamps: true });

const Newsletter = mongoose.models.Newsletter || mongoose.model('Newsletter', NewsletterSchema);
export default Newsletter;
