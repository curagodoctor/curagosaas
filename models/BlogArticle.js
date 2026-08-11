import mongoose from 'mongoose';

const blogArticleSchema = new mongoose.Schema({
  // Basic Article Info
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // Owner — scopes the article to a doctor (per-doctor blogs + the site's
  // Resources library). Without this field the doctorId was silently dropped.
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true,
  },

  // SEO & Meta
  metaDescription: {
    type: String,
    maxlength: 160,
  },
  featuredImage: {
    url: String,
    alt: String,
  },

  // Author Info — filled from the doctor's real profile, no hardcoded defaults.
  author: {
    name: { type: String },
    designation: { type: String },
    image: String,
  },

  // Structured sections. All optional now — CuraGo is multi-specialty, so a
  // simple post shouldn't be forced to fill surgical sections to save. Empty
  // sections simply don't render.
  // Section 1: The Problem
  problemSection: {
    heading: {
      type: String,
      default: 'The Problem: Common Misconceptions & Symptoms',
    },
    content: { type: String },
  },

  // Section 2: Clinical Deep Dive
  clinicalSection: {
    heading: {
      type: String,
      default: 'Clinical Deep Dive: Why This Condition Needs Attention',
    },
    content: { type: String },
  },

  // Section 3: Specialist Advantage
  specialistSection: {
    heading: {
      type: String,
      default: 'The Specialist Advantage: My Clinical Approach',
    },
    content: { type: String },
    // Optional stats — only meaningful for procedural/surgical specialties; no
    // defaults, so non-surgical doctors don't get invented "surgeries performed".
    stats: {
      surgeriesPerformed: { type: Number },
      proceduresSupervised: { type: Number },
    },
  },

  // Section 4: Complex Cases (optional)
  complexCasesSection: {
    heading: {
      type: String,
      default: 'Complex Cases & When to Seek Specialist Care',
    },
    content: { type: String },
  },

  // Section 5: What to Expect (optional; formerly "Surgical Audit")
  surgicalAuditSection: {
    heading: {
      type: String,
      default: 'What to Expect During Your Consultation',
    },
    content: { type: String },
    auditSteps: [
      {
        step: String,
        description: String,
      }
    ],
    auditPrice: { type: Number },
  },

  // Section 6: FAQs
  faqSection: {
    heading: {
      type: String,
      default: 'FAQs: Clear Answers for Patients',
    },
    faqs: [
      {
        question: {
          type: String,
        },
        answer: {
          type: String,
        },
      }
    ],
  },

  // Publishing & Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: Date,

  // Local SEO — from the doctor's own location, no hardcoded defaults.
  location: {
    area: { type: String },
    city: { type: String },
  },

  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0,
    },
    reads: {
      type: Number,
      default: 0,
    },
    averageTimeOnPage: {
      type: Number,
      default: 0,
    },
  },

  // Tags & Categories
  tags: [String],
  category: {
    type: String,
    trim: true,
    // Free-form: CuraGo is a multi-specialty builder, so any category is allowed.
    set: (v) => v === '' ? undefined : v,  // Convert empty string to undefined
  },

}, {
  timestamps: true,
});

// Indexes for better query performance
blogArticleSchema.index({ slug: 1 }, { unique: true });
blogArticleSchema.index({ status: 1, publishedAt: -1 });
blogArticleSchema.index({ category: 1 });

// Pre-save hook to set publishedAt
blogArticleSchema.pre('save', async function() {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

const BlogArticle = mongoose.models.BlogArticle || mongoose.model('BlogArticle', blogArticleSchema);

export default BlogArticle;
