const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['adopter', 'ngo', 'admin'],
      default: 'adopter',
      index: true,
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    dateOfBirth: {
      type: Date,
    },
    verificationStatus: {
      type: String,
      enum: ['Unverified', 'Pending', 'Verified', 'Rejected', 'Requires Manual Review'],
      default: 'Unverified',
      index: true,
    },
    verificationProviderReference: {
      type: String,
      default: null,
      index: true,
    },
    verificationMetadata: {
      idType: { type: String, default: '' },
      maskedIdLast4: { type: String, default: '' },
      addressProofUrl: { type: String, default: '' },
      provider: { type: String, default: '' },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      notes: { type: String, default: '' },
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspensionReason: {
      type: String,
      default: '',
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
