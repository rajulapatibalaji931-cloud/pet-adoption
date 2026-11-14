const mongoose = require('mongoose');

const careScheduleSchema = new mongoose.Schema(
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
      default: null,
    },
    careType: {
      type: String,
      enum: [
        'Feeding',
        'Vaccination',
        'Veterinary',
        'Grooming',
        'Deworming',
        'Exercise',
        'Health Check',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    reminderDate: {
      type: Date,
      required: true,
      index: true,
    },
    reminderTime: {
      type: String,
      default: '09:00',
    },
    recurrence: {
      type: String,
      enum: ['Once', 'Daily', 'Weekly', 'Monthly', 'Yearly'],
      default: 'Once',
    },
    completionStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Skipped'],
      default: 'Pending',
      index: true,
    },
    lastRemindedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completionHistory: {
      type: [
        {
          completedAt: { type: Date, default: Date.now },
          notes: { type: String, default: '' },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

careScheduleSchema.index({ adopterId: 1, completionStatus: 1, reminderDate: 1 });
careScheduleSchema.index({ completionStatus: 1, reminderDate: 1 });

module.exports = mongoose.model('CareSchedule', careScheduleSchema);
