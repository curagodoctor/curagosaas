import mongoose from 'mongoose';

const WorkflowStepSchema = new mongoose.Schema({
  stepOrder: {
    type: Number,
    required: true,
  },
  delayDays: {
    type: Number,
    default: 0,
    min: 0,
    max: 30,
  },
  delayHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 23,
  },
  channel: {
    type: String,
    enum: ['sms', 'email'],
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate',
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { _id: true });

const WorkflowSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  googleReviewLink: {
    type: String,
    trim: true,
  },
  steps: {
    type: [WorkflowStepSchema],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
WorkflowSchema.index({ doctorId: 1, isActive: 1 });
WorkflowSchema.index({ doctorId: 1, isDefault: 1 });

// Static: create all predefined workflows for a doctor
WorkflowSchema.statics.createDefaultsForDoctor = async function(doctorId, smsTemplateId, emailTemplateId) {
  const existing = await this.countDocuments({ doctorId });
  if (existing > 0) return;

  // All workflows are email-only — SMS is disabled platform-wide.
  const workflows = [
    {
      doctorId,
      name: 'Review Request Workflow',
      description: 'Day 0 → Day 3 → Day 5 via email. Best for collecting Google Reviews after a visit.',
      isDefault: true,
      isActive: true,
      steps: [
        { stepOrder: 0, delayDays: 0, channel: 'email', templateId: emailTemplateId, description: 'Initial review request email' },
        { stepOrder: 1, delayDays: 3, channel: 'email', templateId: emailTemplateId, description: 'Follow-up email reminder' },
        { stepOrder: 2, delayDays: 5, channel: 'email', templateId: emailTemplateId, description: 'Final email reminder' },
      ],
    },
    {
      doctorId,
      name: 'Quick Follow-up',
      description: 'Day 0 → Day 1 via email. Short 2-step follow-up for quick engagement.',
      isDefault: false,
      isActive: true,
      steps: [
        { stepOrder: 0, delayDays: 0, channel: 'email', templateId: emailTemplateId, description: 'Immediate email' },
        { stepOrder: 1, delayDays: 1, channel: 'email', templateId: emailTemplateId, description: 'Next day email follow-up' },
      ],
    },
    {
      doctorId,
      name: 'Gentle Reminder',
      description: 'Day 1 → Day 7 via email. Spaced out reminders for less urgent follow-ups.',
      isDefault: false,
      isActive: true,
      steps: [
        { stepOrder: 0, delayDays: 1, channel: 'email', templateId: emailTemplateId, description: 'Email after 1 day' },
        { stepOrder: 1, delayDays: 7, channel: 'email', templateId: emailTemplateId, description: 'Email after 1 week' },
      ],
    },
    {
      doctorId,
      name: 'Extended Campaign',
      description: 'Day 0 → Day 3 → Day 7 via email. A longer three-touch email sequence.',
      isDefault: false,
      isActive: true,
      steps: [
        { stepOrder: 0, delayDays: 0, channel: 'email', templateId: emailTemplateId, description: 'Initial email' },
        { stepOrder: 1, delayDays: 3, channel: 'email', templateId: emailTemplateId, description: 'Follow-up email' },
        { stepOrder: 2, delayDays: 7, channel: 'email', templateId: emailTemplateId, description: 'Final email reminder' },
      ],
    },
  ];

  return this.insertMany(workflows);
};

// Legacy alias
WorkflowSchema.statics.createDefaultForDoctor = async function(doctorId, smsTemplateId, emailTemplateId) {
  return this.createDefaultsForDoctor(doctorId, smsTemplateId, emailTemplateId);
};

// Keep old static for backward compat - unused but safe
WorkflowSchema.statics._createSingleDefault = async function(doctorId, smsTemplateId, emailTemplateId) {
  const existing = await this.findOne({ doctorId, isDefault: true });
  if (existing) return existing;

  const workflow = await this.create({
    doctorId,
    name: 'Review Request Workflow',
    description: 'Automated review request: Day 0 SMS, Day 3 SMS follow-up, Day 5 Email reminder',
    isDefault: true,
    isActive: true,
    steps: [
      {
        stepOrder: 0,
        delayDays: 0,
        channel: 'sms',
        templateId: smsTemplateId,
        description: 'Initial review request via SMS',
      },
      {
        stepOrder: 1,
        delayDays: 3,
        channel: 'sms',
        templateId: smsTemplateId,
        description: 'Follow-up SMS reminder',
      },
      {
        stepOrder: 2,
        delayDays: 5,
        channel: 'email',
        templateId: emailTemplateId,
        description: 'Final email reminder',
      },
    ],
  });

  return workflow;
};

export default mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);
