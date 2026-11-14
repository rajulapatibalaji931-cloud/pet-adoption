const CareSchedule = require('../models/CareSchedule');
const Pet = require('../models/Pet');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { computeNextReminderDate } = require('../services/careService');
const { logAudit } = require('../utils/auditLogger');

exports.createCareSchedule = asyncHandler(async (req, res) => {
  const { petId, adopterId, careType, title, description, reminderDate, reminderTime, recurrence } = req.body;

  const pet = await Pet.findById(petId);
  if (!pet) {
    throw new ApiError(404, 'Pet not found.');
  }

  let targetAdopterId = req.user._id;
  if (req.user.role === 'ngo') {
    if (!req.ngo || String(pet.ngoId) !== String(req.ngo._id)) {
      throw new ApiError(403, 'You can only create care schedules for pets managed by your NGO.');
    }
    targetAdopterId = adopterId || pet.adoptedBy;
    if (!targetAdopterId) {
      throw new ApiError(400, 'Adopter ID is required for creating a post-adoption care schedule.');
    }
  } else if (req.user.role === 'adopter') {
    if (!pet.adoptedBy || String(pet.adoptedBy) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only create care schedules for pets you have adopted.');
    }
  }

  const schedule = await CareSchedule.create({
    petId: pet._id,
    adopterId: targetAdopterId,
    ngoId: pet.ngoId,
    careType,
    title: title || `${careType} for ${pet.name}`,
    description,
    reminderDate: new Date(reminderDate),
    reminderTime: reminderTime || '09:00',
    recurrence: recurrence || 'Once',
  });

  await logAudit({
    userId: req.user._id,
    action: 'CARE_SCHEDULE_CREATED',
    resourceType: 'CareSchedule',
    resourceId: schedule._id,
    metadata: { petId: pet._id, careType },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Care schedule created successfully.',
    schedule,
  });
});

exports.getMyCareSchedules = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'adopter') {
    filter.adopterId = req.user._id;
  } else if (req.user.role === 'ngo' && req.ngo) {
    filter.ngoId = req.ngo._id;
  }

  if (req.query.petId) filter.petId = req.query.petId;
  if (req.query.careType && req.query.careType !== 'All') filter.careType = req.query.careType;
  if (req.query.completionStatus && req.query.completionStatus !== 'All') {
    filter.completionStatus = req.query.completionStatus;
  }

  const schedules = await CareSchedule.find(filter)
    .populate('petId', 'name species breed images petCode nextVaccinationDate')
    .populate('adopterId', 'fullName email')
    .sort({ reminderDate: 1 })
    .lean();

  // Also fetch adopted pets for this adopter so UI always has pet list
  let adoptedPets = [];
  if (req.user.role === 'adopter') {
    adoptedPets = await Pet.find({ adoptedBy: req.user._id })
      .select('name species breed images petCode adoptedAt nextVaccinationDate veterinaryInfo')
      .lean();
  } else if (req.user.role === 'ngo' && req.ngo) {
    adoptedPets = await Pet.find({ ngoId: req.ngo._id, adoptionStatus: 'Adopted' })
      .populate('adoptedBy', 'fullName email')
      .select('name species breed images petCode adoptedAt adoptedBy')
      .lean();
  }

  res.json({
    success: true,
    data: schedules,
    adoptedPets,
  });
});

exports.updateCareSchedule = asyncHandler(async (req, res) => {
  const schedule = await CareSchedule.findById(req.params.id);
  if (!schedule) {
    throw new ApiError(404, 'Care schedule not found.');
  }

  const isAdopterOwner = String(schedule.adopterId) === String(req.user._id);
  const isNgoOwner = req.ngo && schedule.ngoId && String(schedule.ngoId) === String(req.ngo._id);
  if (req.user.role !== 'admin' && !isAdopterOwner && !isNgoOwner) {
    throw new ApiError(403, 'Not authorized to update this care schedule.');
  }

  const fields = ['careType', 'title', 'description', 'reminderTime', 'recurrence', 'completionStatus'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) schedule[f] = req.body[f];
  });
  if (req.body.reminderDate) schedule.reminderDate = new Date(req.body.reminderDate);

  await schedule.save();

  res.json({
    success: true,
    message: 'Care schedule updated.',
    schedule,
  });
});

exports.deleteCareSchedule = asyncHandler(async (req, res) => {
  const schedule = await CareSchedule.findById(req.params.id);
  if (!schedule) {
    throw new ApiError(404, 'Care schedule not found.');
  }

  const isAdopterOwner = String(schedule.adopterId) === String(req.user._id);
  const isNgoOwner = req.ngo && schedule.ngoId && String(schedule.ngoId) === String(req.ngo._id);
  if (req.user.role !== 'admin' && !isAdopterOwner && !isNgoOwner) {
    throw new ApiError(403, 'Not authorized to delete this care schedule.');
  }

  await schedule.deleteOne();
  res.json({ success: true, message: 'Care schedule deleted.' });
});

exports.completeCareSchedule = asyncHandler(async (req, res) => {
  const schedule = await CareSchedule.findById(req.params.id);
  if (!schedule) {
    throw new ApiError(404, 'Care schedule not found.');
  }

  const isAdopterOwner = String(schedule.adopterId) === String(req.user._id);
  const isNgoOwner = req.ngo && schedule.ngoId && String(schedule.ngoId) === String(req.ngo._id);
  if (req.user.role !== 'admin' && !isAdopterOwner && !isNgoOwner) {
    throw new ApiError(403, 'Not authorized to complete this care task.');
  }

  const now = new Date();
  schedule.completionHistory.push({
    completedAt: now,
    notes: req.body.notes || '',
  });
  schedule.completedAt = now;

  if (schedule.recurrence !== 'Once') {
    const nextDate = computeNextReminderDate(schedule.reminderDate, schedule.recurrence);
    if (nextDate) {
      schedule.reminderDate = nextDate;
      schedule.completionStatus = 'Pending';
    }
  } else {
    schedule.completionStatus = 'Completed';
  }

  await schedule.save();

  res.json({
    success: true,
    message:
      schedule.recurrence !== 'Once'
        ? `Task logged as completed! Next ${schedule.recurrence.toLowerCase()} reminder scheduled for ${schedule.reminderDate.toDateString()}.`
        : 'Care task marked as completed!',
    schedule,
  });
});
