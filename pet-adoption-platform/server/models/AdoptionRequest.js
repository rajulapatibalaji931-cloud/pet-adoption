const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema(
  {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
      index: true,
    },
    adopterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO',
      required: true,
      index: true,
    },
    applicationDetails: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      residentialAddress: { type: String, required: true, trim: true },
      housingType: {
        type: String,
        enum: ['Apartment', 'Independent House', 'Farmhouse', 'Shared Accommodation', 'Other'],
        required: true,
      },
      petOwnershipExperience: { type: String, required: true, trim: true },
      reasonForAdoption: { type: String, required: true, trim: true },
      familyApproval: { type: Boolean, required: true },
      availabilityToCare: { type: String, required: true, trim: true },
      preferredContactMethod: {
        type: String,
        enum: ['Phone', 'Email', 'WhatsApp'],
        default: 'Phone',
      },
    },
    verificationStatus: {
      type: String,
      required: true,
    },
    applicationStatus: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
      default: 'Pending',
      index: true,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Partial unique index: prevents duplicate active adoption requests per adopter per pet,
// while allowing resubmission if an earlier request was Cancelled or Rejected.
adoptionRequestSchema.index(
  { petId: 1, adopterId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      applicationStatus: { $in: ['Pending', 'Under Review', 'Approved', 'Completed'] },
    },
  }
);

adoptionRequestSchema.index({ ngoId: 1, applicationStatus: 1, submittedAt: -1 });
adoptionRequestSchema.index({ adopterId: 1, submittedAt: -1 });

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);
