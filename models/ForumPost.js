import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  repliedBy: {
    type: String,
    default: 'Dr. Yuvaraj T',
  },
  repliedAt: {
    type: Date,
    default: Date.now,
  },
});

const ForumPostSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  query: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['general', 'symptoms', 'treatment', 'diet', 'lifestyle', 'other'],
    default: 'general',
  },
  status: {
    type: String,
    enum: ['pending', 'replied', 'closed'],
    default: 'pending',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  replies: [ReplySchema],
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
ForumPostSchema.index({ status: 1, createdAt: -1 });
ForumPostSchema.index({ email: 1 });
ForumPostSchema.index({ category: 1 });

const ForumPost = mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);

export default ForumPost;
