import mongoose from 'mongoose';

const ExecutionLogSchema = new mongoose.Schema({
  stepIndex: Number,
  channel: String,
  status: {
    type: String,
    enum: ['sent', 'failed', 'skipped'],
  },
  sentAt: Date,
  error: String,
}, { _id: false });

const WorkflowExecutionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
  },
  currentStepIndex: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'active',
  },
  nextRunAt: {
    type: Date,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  logs: {
    type: [ExecutionLogSchema],
    default: [],
  },
}, {
  timestamps: true,
});

// Indexes
WorkflowExecutionSchema.index({ status: 1, nextRunAt: 1 }); // For cron processing
WorkflowExecutionSchema.index({ doctorId: 1, contactId: 1 });
WorkflowExecutionSchema.index({ doctorId: 1, status: 1 });

// Prevent duplicate active workflows per contact per doctor
WorkflowExecutionSchema.index(
  { doctorId: 1, contactId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

// Static: find executions ready to process
WorkflowExecutionSchema.statics.findReadyToProcess = function() {
  return this.find({
    status: 'active',
    nextRunAt: { $lte: new Date() },
  })
    .populate('workflowId')
    .populate('contactId')
    .populate('doctorId', 'name displayName');
};

// Static: get active execution for a contact
WorkflowExecutionSchema.statics.getActiveForContact = function(doctorId, contactId) {
  return this.findOne({ doctorId, contactId, status: 'active' });
};

export default mongoose.models.WorkflowExecution || mongoose.model('WorkflowExecution', WorkflowExecutionSchema);
