import mongoose from 'mongoose';

/**
 * Review Request Template Model
 * Stores templates for review request messages
 */
const ReviewRequestTemplateSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },

  // Template Info
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
  },

  // Channel
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true,
  },

  // Template Content
  // Available variables: {{patientName}}, {{doctorName}}, {{clinicName}}, {{reviewLink}}, {{interceptorLink}}
  subject: {
    type: String, // For email only
    trim: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },

  // Timing
  delayHours: {
    type: Number,
    default: 24, // Send 24 hours after appointment
    min: 0,
    max: 168, // Max 1 week
  },

  // Settings
  isDefault: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // Usage stats
  timesUsed: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Indexes
ReviewRequestTemplateSchema.index({ doctorId: 1, channel: 1, isDefault: 1 });
ReviewRequestTemplateSchema.index({ doctorId: 1, isActive: 1 });

// Ensure only one default per channel per doctor
ReviewRequestTemplateSchema.pre('save', async function() {
  if (this.isDefault) {
    await this.constructor.updateMany(
      {
        doctorId: this.doctorId,
        channel: this.channel,
        _id: { $ne: this._id },
        isDefault: true,
      },
      { isDefault: false }
    );
  }
});

// Static method to get default template for a channel
ReviewRequestTemplateSchema.statics.getDefault = function(doctorId, channel) {
  return this.findOne({ doctorId, channel, isDefault: true, isActive: true });
};

// Static method to create default templates for new doctor
ReviewRequestTemplateSchema.statics.createDefaultsForDoctor = async function(doctorId, doctorName) {
  const defaults = [
    {
      doctorId,
      name: 'Standard WhatsApp Review Request',
      description: 'Default review request sent via WhatsApp',
      channel: 'whatsapp',
      message: `Hi {{patientName}}! 👋

Thank you for visiting {{doctorName}}. We hope you had a great experience!

Your feedback helps us serve you better. Would you mind taking a moment to share your experience?

{{interceptorLink}}

Thank you! 🙏`,
      delayHours: 24,
      isDefault: true,
      isActive: true,
    },
    {
      doctorId,
      name: 'Standard SMS Review Request',
      description: 'Default review request sent via SMS',
      channel: 'sms',
      message: `Hi {{patientName}}, Thank you for visiting {{doctorName}}. Please share your feedback: {{interceptorLink}}`,
      delayHours: 24,
      isDefault: true,
      isActive: true,
    },
  ];

  return this.insertMany(defaults);
};

export default mongoose.models.ReviewRequestTemplate || mongoose.model('ReviewRequestTemplate', ReviewRequestTemplateSchema);
