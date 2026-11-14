const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
  {
    petCode: {
      type: String,
      unique: true,
      index: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Pet name is required'],
      trim: true,
      maxlength: 100,
    },
    species: {
      type: String,
      required: [true, 'Species is required'],
      enum: ['Dog', 'Cat', 'Rabbit', 'Bird', 'Other'],
      index: true,
    },
    breed: {
      type: String,
      required: [true, 'Breed is required'],
      trim: true,
      index: true,
    },
    age: {
      type: Number,
      required: [true, 'Age (in years) is required'],
      min: 0,
      max: 40,
      index: true,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female'],
      index: true,
    },
    weight: {
      type: Number,
      required: [true, 'Weight (in kg) is required'],
      min: 0.1,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2500,
    },
    personality: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      index: true,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: '' },
        },
      ],
      default: [],
    },
    medicalHistory: {
      type: String,
      required: [true, 'Medical history is required before publishing'],
      trim: true,
    },
    vaccinationRecords: {
      isVaccinated: { type: Boolean, default: false, index: true },
      vaccines: {
        type: [
          {
            name: { type: String, required: true },
            dateAdministered: { type: Date },
            nextDueDate: { type: Date },
          },
        ],
        default: [],
      },
      summary: { type: String, default: '' },
    },
    sterilizationStatus: {
      type: String,
      enum: ['Sterilized', 'Not Sterilized', 'Scheduled'],
      default: 'Not Sterilized',
    },
    healthStatus: {
      type: String,
      enum: ['Healthy', 'Special Needs', 'Recovering', 'Under Treatment'],
      default: 'Healthy',
      index: true,
    },
    veterinaryInfo: {
      vetName: { type: String, required: [true, 'Veterinarian name is required'], trim: true },
      clinicName: { type: String, trim: true, default: '' },
      clinicPhone: { type: String, trim: true, default: '' },
    },
    nextVaccinationDate: {
      type: Date,
    },
    adoptionStatus: {
      type: String,
      enum: ['Available', 'Pending', 'Adopted', 'Unavailable'],
      default: 'Available',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    adoptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adoptedAt: {
      type: Date,
      default: null,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

petSchema.pre('validate', function (next) {
  if (!this.petCode) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    this.petCode = `PET-${new Date().getFullYear()}-${rand}`;
  }
  next();
});

// Enforce medical and vaccination details before publishing
petSchema.pre('save', function (next) {
  if (this.isPublished) {
    const hasMedical = Boolean(this.medicalHistory && this.medicalHistory.trim().length > 0);
    const hasVet = Boolean(this.veterinaryInfo && this.veterinaryInfo.vetName);
    const hasVaccinationInfo = Boolean(
      this.vaccinationRecords &&
        (this.vaccinationRecords.isVaccinated ||
          (this.vaccinationRecords.vaccines && this.vaccinationRecords.vaccines.length > 0) ||
          (this.vaccinationRecords.summary && this.vaccinationRecords.summary.trim().length > 0))
    );
    if (!hasMedical || !hasVet || !hasVaccinationInfo) {
      return next(
        new Error('Pet listings must include medical history, veterinary information, and vaccination details before publishing.')
      );
    }
  }
  next();
});

// High-scale compound & text indexes
petSchema.index({ isPublished: 1, adoptionStatus: 1, species: 1, gender: 1, age: 1, createdAt: -1 });
petSchema.index({ isPublished: 1, adoptionStatus: 1, 'vaccinationRecords.isVaccinated': 1, createdAt: -1 });
petSchema.index({ name: 'text', breed: 'text', location: 'text', description: 'text' });

module.exports = mongoose.model('Pet', petSchema);
