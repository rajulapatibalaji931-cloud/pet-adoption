const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
      index: true,
    },
    veterinarianName: {
      type: String,
      required: [true, 'Veterinarian name is required'],
      trim: true,
    },
    clinicName: {
      type: String,
      trim: true,
      default: '',
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis or checkup summary is required'],
      trim: true,
    },
    treatment: {
      type: String,
      trim: true,
      default: '',
    },
    vaccinationDetails: {
      vaccineName: { type: String, trim: true, default: '' },
      dateAdministered: { type: Date },
      batchNumber: { type: String, trim: true, default: '' },
      nextDueDate: { type: Date },
    },
    documentUrl: {
      type: String,
      default: '',
    },
    documentPublicId: {
      type: String,
      default: '',
    },
    recordDate: {
      type: Date,
      default: Date.now,
    },
    nextVisitDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ petId: 1, recordDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
