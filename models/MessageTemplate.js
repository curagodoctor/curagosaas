import mongoose from 'mongoose';

const MessageTemplateSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  channel: {
    type: String,
    enum: ['sms', 'email'],
    required: true,
  },
  subject: {
    type: String,
    trim: true, // For email only
  },
  body: {
    type: String,
    required: true,
    maxlength: 2000,
    // Supports: {{name}}, {{phone}}, {{reviewLink}}, {{clinicName}}, {{doctorName}}
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
MessageTemplateSchema.index({ doctorId: 1, channel: 1, isActive: 1 });

// Static: seed defaults for a new doctor
MessageTemplateSchema.statics.createDefaultsForDoctor = async function(doctorId) {
  const defaults = [
    {
      doctorId,
      name: 'Review Request SMS',
      channel: 'sms',
      body: 'Hi {{name}}, thank you for visiting {{clinicName}}! We\'d love your feedback. Please leave a review: {{reviewLink}}',
      isActive: true,
    },
    {
      doctorId,
      name: 'Review Request Email',
      channel: 'email',
      subject: 'We\'d love your feedback!',
      body: 'Hi {{name}},\n\nThank you for visiting {{doctorName}} at {{clinicName}}. We hope you had a great experience!\n\nWe\'d really appreciate it if you could take a moment to share your feedback:\n{{reviewLink}}\n\nThank you!\n{{doctorName}}',
      isActive: true,
    },
  ];

  try {
    return await this.insertMany(defaults, { ordered: false });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

export default mongoose.models.MessageTemplate || mongoose.model('MessageTemplate', MessageTemplateSchema);
