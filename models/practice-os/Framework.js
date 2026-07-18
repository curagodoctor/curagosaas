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
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

FrameworkSchema.index({ slug: 1 }, { unique: true });
FrameworkSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.Framework || mongoose.model('Framework', FrameworkSchema);
