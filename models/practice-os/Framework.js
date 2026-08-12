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
}, { timestamps: true });

FrameworkSchema.index({ slug: 1 }, { unique: true });
FrameworkSchema.index({ isActive: 1, isPublished: 1, order: 1 });

export default mongoose.models.Framework || mongoose.model('Framework', FrameworkSchema);
