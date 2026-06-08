import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  amount: Number, // INR
  tokens: Number,
  razorpayPaymentId: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const UsageSchema = new mongoose.Schema({
  action: { type: String, enum: ['generate', 'edit', 'blog'] },
  tokensUsed: Number,
  description: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const AITokenSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  purchases: {
    type: [PurchaseSchema],
    default: [],
  },
  usage: {
    type: [UsageSchema],
    default: [],
  },
}, {
  timestamps: true,
});

// Static: get or create token record
AITokenSchema.statics.getOrCreate = async function(doctorId) {
  let record = await this.findOne({ doctorId });
  if (!record) {
    record = await this.create({ doctorId });
  }
  return record;
};

// Static: get balance
AITokenSchema.statics.getBalance = async function(doctorId) {
  const record = await this.getOrCreate(doctorId);
  return record.balance;
};

// Static: add tokens after purchase
AITokenSchema.statics.addTokens = async function(doctorId, tokens, paymentId, amount) {
  return this.findOneAndUpdate(
    { doctorId },
    {
      $inc: { balance: tokens },
      $push: { purchases: { amount, tokens, razorpayPaymentId: paymentId } },
    },
    { new: true, upsert: true }
  );
};

// Static: deduct tokens for usage
AITokenSchema.statics.deductTokens = async function(doctorId, tokensUsed, action, description) {
  const record = await this.getOrCreate(doctorId);
  if (record.balance < tokensUsed) {
    return { success: false, error: 'Insufficient tokens' };
  }

  record.balance -= tokensUsed;
  record.usage.push({ action, tokensUsed, description });
  await record.save();
  return { success: true, balance: record.balance };
};

export default mongoose.models.AIToken || mongoose.model('AIToken', AITokenSchema);
