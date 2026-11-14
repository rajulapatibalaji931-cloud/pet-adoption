const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 160,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, required: true },
      state: { type: String, trim: true, required: true },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    contactDetails: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      website: { type: String, trim: true, default: '' },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: '',
    },
    documentUrl: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'Requires Manual Review'],
      default: 'Pending',
      index: true,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

ngoSchema.index({ organizationName: 'text', 'address.city': 'text', 'address.state': 'text' });

module.exports = mongoose.model('NGO', ngoSchema);
