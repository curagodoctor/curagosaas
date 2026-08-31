import mongoose from 'mongoose';

/**
 * Practice OS — Framework
 *
 * The top of the content hierarchy: Framework → Module → (Mission with week/day).
 * Global content authored by the platform admin, shared to all doctors.
 */
const FrameworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Framework title is required'],
    trim: true,
    maxlength: 150,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    trim: true,
    default: '',
  },
  coverImage: {
    type: String,
    trim: true,
    default: '',
  },
  // Short one-line pitch for the pack card ("Get found on Google in 30 days").
  tagline: {
    type: String,
    trim: true,
    default: '',
  },
  // A slightly longer summary of what the pack is, shown on the catalog card.
  summary: {
    type: String,
    trim: true,
    default: '',
  },
  // The concrete outcomes a doctor walks away with (bullet list on the card).
  outcomes: {
    type: [String],
    default: [],
  },
  // Per-pack price, in rupees. 0 = free pack (no payment gate). Each pack is a
  // separate Razorpay purchase — there is no single global Practice OS price.
  priceInInr: {
    type: Number,
    default: 0,
    min: 0,
  },
  // How the pack is structured/presented:
  //  'mission' — day-wise missions, each with modules (the original flow).
  //  'task'    — a flat list of individual tasks (each stored as a single-module
  //              mission); the doctor completes one task and moves to the next.
  mode: {
    type: String,
    enum: ['mission', 'task'],
    default: 'mission',
  },
  order: {
    type: Number,
    default: 0,
  },
  // Only published packs appear in the doctor-facing catalog and can be bought.
  // (isActive is the soft-delete flag; a pack can be active but not yet published.)
  isPublished: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Soft delete: when set, the pack is hidden from doctors and the reminder cron
  // but kept (with its missions/modules/enrollments) so it can be restored. (#26)
  deletedAt: {
    type: Date,
    default: null,
  },
  // Rich, admin-editable public sales page for /packs/[slug]. Fixed named
  // sections rendered in a set order; each has an `enabled` toggle. Empty text
  // fields fall back to the flat pack fields (title/tagline/summary/outcomes) or
  // hide entirely. Price/CTA amounts are NEVER stored here — always derived from
  // priceInInr via computeGst so there's one source of truth.
  salesPage: {
    hero: {
      enabled: { type: Boolean, default: true },
      badges: { type: [String], default: [] },
      title: { type: String, trim: true, default: '' },
      subtitle: { type: String, trim: true, default: '' },
      description: { type: String, trim: true, default: '' },
      supportingLine: { type: String, trim: true, default: '' },
      specs: { type: [{ value: String, label: String, _id: false }], default: [] },
      images: { type: [String], default: [] },
      ticker: { type: [String], default: [] },
    },
    problem: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      subtitle: { type: String, trim: true, default: '' },
      bullets: { type: [String], default: [] },
      conclusion: { type: String, trim: true, default: '' },
    },
    bigIdea: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      subtitle1: { type: String, trim: true, default: '' },
      subtitle2: { type: String, trim: true, default: '' },
      loop: { type: [String], default: [] },
      bullets: { type: [{ title: String, desc: String, _id: false }], default: [] },
      conclusion: { type: String, trim: true, default: '' },
      image: { type: String, trim: true, default: '' },
    },
    videoDemo: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      videoUrl: { type: String, trim: true, default: '' },
      caption: { type: String, trim: true, default: '' },
      description: { type: String, trim: true, default: '' },
      flow: { type: [String], default: [] },
    },
    honestPromise: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      intro: { type: String, trim: true, default: '' },
      negatives: { type: [String], default: [] },
      highlight: { type: String, trim: true, default: '' },
      conclusion: { type: String, trim: true, default: '' },
    },
    curriculum: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      previewCount: { type: Number, default: 5, min: 1, max: 50 },
    },
    offer: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      benefits: { type: [String], default: [] },
      ctaLabel: { type: String, trim: true, default: '' },
      supportingLine: { type: String, trim: true, default: '' },
    },
    faq: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      items: { type: [{ q: String, a: String, _id: false }], default: [] },
    },
    finalCta: {
      enabled: { type: Boolean, default: true },
      title: { type: String, trim: true, default: '' },
      subtitle: { type: String, trim: true, default: '' },
      ctaLabel: { type: String, trim: true, default: '' },
      supportingLine: { type: String, trim: true, default: '' },
    },
    founder: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: '' },
      intro: { type: String, trim: true, default: '' },
      body: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      credential: { type: String, trim: true, default: '' },
      photo: { type: String, trim: true, default: '' },
    },
  },
}, { timestamps: true });

FrameworkSchema.index({ slug: 1 }, { unique: true });
FrameworkSchema.index({ isActive: 1, isPublished: 1, order: 1 });

export default mongoose.models.Framework || mongoose.model('Framework', FrameworkSchema);
