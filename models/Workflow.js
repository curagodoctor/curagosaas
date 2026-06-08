import mongoose from 'mongoose';

const WorkflowStepSchema = new mongoose.Schema({
  stepOrder: {
    type: Number,
    required: true,
  },
  delayDays: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 30,
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

// Static: create default review workflow for a doctor
WorkflowSchema.statics.createDefaultForDoctor = async function(doctorId, smsTemplateId, emailTemplateId) {
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
