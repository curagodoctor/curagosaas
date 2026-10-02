import mongoose from 'mongoose';

const MeetingLinkSchema = new mongoose.Schema({
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
  },
  description: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['zoom', 'google-meet', 'teams', 'other'],
    default: 'other',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
MeetingLinkSchema.index({ doctorId: 1, isActive: 1 });

// Ensure only one default meeting link per doctor
// async middleware must NOT call next() in Mongoose 7+ (throws "next is not a function").
MeetingLinkSchema.pre('save', async function() {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { doctorId: this.doctorId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

const MeetingLink = mongoose.models.MeetingLink || mongoose.model('MeetingLink', MeetingLinkSchema);

export default MeetingLink;
