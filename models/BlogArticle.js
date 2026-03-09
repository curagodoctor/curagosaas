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

  // SEO & Meta
  metaDescription: {
    type: String,
    maxlength: 160,
  },
  featuredImage: {
    url: String,
    alt: String,
  },

  // Author Info
  author: {
    name: {
      type: String,
      default: 'Dr. Yuvaraj T',
    },
    designation: {
      type: String,
      default: 'Surgical Gastroenterologist & Gold Medalist',
    },
    image: String,
  },

  // Section 1: The Problem
  problemSection: {
    heading: {
      type: String,
      default: 'The Problem: Common Misconceptions & Symptoms',
    },
    content: {
      type: String,
      required: true,
    },
  },

  // Section 2: Clinical Deep Dive
  clinicalSection: {
    heading: {
      type: String,
      default: 'Clinical Deep Dive: Why This Condition Needs Attention',
    },
    content: {
      type: String,
      required: true,
    },
  },

  // Section 3: Specialist Advantage
  specialistSection: {
    heading: {
      type: String,
      default: 'The Specialist Advantage: My Clinical Approach',
    },
    content: {
      type: String,
      required: true,
    },
    stats: {
      surgeriesPerformed: {
        type: Number,
        default: 250,
      },
      proceduresSupervised: {
        type: Number,
        default: 300,
      },
    },
  },

  // Section 4: Complex Cases
  complexCasesSection: {
    heading: {
      type: String,
      default: 'Complex Cases: Managing High-Risk Scenarios',
    },
    content: {
      type: String,
      required: true,
    },
  },

  // Section 5: Surgical Audit
  surgicalAuditSection: {
    heading: {
      type: String,
      default: 'The Surgical Audit: What to Expect During Your Consultation',
    },
    content: {
      type: String,
      required: true,
    },
    auditSteps: [
      {
        step: String,
        description: String,
      }
    ],
    auditPrice: {
      type: Number,
      default: 150,
    },
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
          required: true,
        },
        answer: {
          type: String,
          required: true,
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

  // Local SEO
  location: {
    area: {
      type: String,
      default: 'Tilak Nagar',
    },
    city: {
      type: String,
      default: 'Mumbai',
    },
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
    enum: ['Gallstones', 'Pancreatitis', 'Liver Disease', 'IBS', 'GERD', 'Other'],
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
