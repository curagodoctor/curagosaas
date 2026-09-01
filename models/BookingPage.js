import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'header',
      'hero_carousel',
      'banner_image',
      'benefits_list',
      'doctor_profile',
      'testimonials',
      'faqs',
      'faq_chatbot',
      'location_map',
      'disease_icons_scroll',
      'custom_text',
      'cta_button',
      'booking_form',
      'clinic_info',
      'professional_fees',
      'footer',
      'whatsapp_sticky',
      'book_now_sticky'
    ],
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  visible: {
    type: Boolean,
    default: true,
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: true });

const BookingPageSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false, // Optional for backward compatibility during migration
    index: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160,
  },
  metaKeywords: [{
    type: String,
    trim: true,
  }],
  // Display fields for navbar and homepage clinic cards
  category: {
    type: String,
    enum: ['myclinic', 'gbsi', 'other'],
    default: 'other',
  },
  displayName: {
    type: String,
    trim: true,
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  iconType: {
    type: String,
    enum: ['gallbladder', 'ibs', 'second-opinion', 'online', 'liver', 'pancreas', 'stomach', 'custom'],
    default: 'custom',
  },
  colorScheme: {
    type: String,
    enum: ['green', 'blue', 'purple', 'orange', 'red', 'teal', 'indigo'],
    default: 'green', // Changed from 'blue' - use 'theme' field instead
  },
  theme: {
    type: String,
    enum: ['forest', 'ocean', 'sunset', 'royal', 'teal', 'coral'],
    default: 'forest',
  },
  showInNavbar: {
    type: Boolean,
    default: true, // new pages appear in the site nav by default; toggle off to hide
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
  },
  sections: [SectionSchema],
  consultationFee: {
    type: Number,
    default: 1000,
    min: 0,
  },
  bookingFee: {
    type: Number,
    default: 150,
    min: 0,
  },
  paymentMode: {
    type: String,
    enum: ['payment', 'no_payment'],
    default: 'payment',
  },
  razorpayButtonId: {
    type: String,
    default: 'pl_S32iD93nAACoNH',
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  bookings: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdBy: {
    type: String,
    default: 'admin',
  },
  // True once the DOCTOR has edited this page's sections by hand (or applied an
  // AI chat edit). The AI "generate my website" flow must NOT overwrite a page
  // the doctor has customized — it only writes to a still-default page unless the
  // doctor explicitly forces a regenerate. AI generation itself does NOT set this.
  userEdited: {
    type: Boolean,
    default: false,
  },
  // When the AI last generated this page's copy (for reference / audit).
  aiGeneratedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for performance
BookingPageSchema.index({ doctorId: 1, slug: 1 }, { unique: true, sparse: true }); // Slug unique per doctor
BookingPageSchema.index({ slug: 1, status: 1 });
BookingPageSchema.index({ doctorId: 1, status: 1, publishedAt: -1 });
BookingPageSchema.index({ status: 1, publishedAt: -1 });
BookingPageSchema.index({ createdAt: -1 });
BookingPageSchema.index({ category: 1, status: 1, displayOrder: 1 });
BookingPageSchema.index({ showInNavbar: 1, status: 1, displayOrder: 1 });

// Pre-save middleware to set publishedAt when status changes to published
BookingPageSchema.pre('save', function() {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// Method to auto-order sections if order is missing
BookingPageSchema.methods.reorderSections = function() {
  this.sections.forEach((section, index) => {
    if (section.order === undefined || section.order === null) {
      section.order = index;
    }
  });
  this.sections.sort((a, b) => a.order - b.order);
};

// Export model - check if it exists first to avoid recompilation in dev mode
const BookingPage = mongoose.models.BookingPage || mongoose.model('BookingPage', BookingPageSchema);

export default BookingPage;
