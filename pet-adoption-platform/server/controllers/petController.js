const Pet = require('../models/Pet');
const NGO = require('../models/NGO');
const MedicalRecord = require('../models/MedicalRecord');
const Report = require('../models/Report');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const cache = require('../utils/cache');
const { uploadFile, deleteFile } = require('../services/storageService');
const { logAudit } = require('../utils/auditLogger');

const buildPetFilter = (query) => {
  const filter = { isPublished: true };

  if (query.species && query.species !== 'All') {
    filter.species = query.species;
  }
  if (query.breed) {
    filter.breed = { $regex: query.breed.trim(), $options: 'i' };
  }
  if (query.gender && query.gender !== 'All') {
    filter.gender = query.gender;
  }
  if (query.location) {
    filter.location = { $regex: query.location.trim(), $options: 'i' };
  }
  if (query.vaccinated === 'true') {
    filter['vaccinationRecords.isVaccinated'] = true;
  } else if (query.vaccinated === 'false') {
    filter['vaccinationRecords.isVaccinated'] = false;
  }

  if (query.adoptionStatus && query.adoptionStatus !== 'All') {
    filter.adoptionStatus = query.adoptionStatus;
  } else if (!query.includeAdopted) {
    // By default show Available or Pending unless requested otherwise
    if (query.adoptionStatus !== 'All') {
      filter.adoptionStatus = { $in: ['Available', 'Pending'] };
    }
  }

  if (query.minAge !== undefined && query.minAge !== '') {
    filter.age = { ...(filter.age || {}), $gte: Number(query.minAge) };
  }
  if (query.maxAge !== undefined && query.maxAge !== '') {
    filter.age = { ...(filter.age || {}), $lte: Number(query.maxAge) };
  }

  if (query.ngoId) {
    filter.ngoId = query.ngoId;
  }

  if (query.q && query.q.trim()) {
    const regex = { $regex: query.q.trim(), $options: 'i' };
    filter.$or = [
      { name: regex },
      { breed: regex },
      { location: regex },
      { species: regex },
      { description: regex },
      { petCode: regex },
    ];
  }

  return filter;
};

const buildSort = (sortKey) => {
  switch (sortKey) {
    case 'oldest':
      return { createdAt: 1 };
    case 'age_asc':
      return { age: 1, createdAt: -1 };
    case 'age_desc':
      return { age: -1, createdAt: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

exports.getPets = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const cacheKey = `pets:${JSON.stringify(req.query)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const filter = buildPetFilter(req.query);
  const sort = buildSort(req.query.sort);

  const [pets, total] = await Promise.all([
    Pet.find(filter)
      .populate('ngoId', 'organizationName address verificationStatus contactDetails')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Pet.countDocuments(filter),
  ]);

  const payload = {
    success: true,
    data: pets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };

  cache.set(cacheKey, payload, 20000);
  res.json(payload);
});

exports.searchPets = exports.getPets;

exports.getPetById = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id)
    .populate('ngoId', 'organizationName registrationNumber address contactDetails description verificationStatus')
    .populate('adoptedBy', 'fullName email');

  if (!pet) {
    throw new ApiError(404, 'Pet not found.');
  }

  const medicalRecords = await MedicalRecord.find({ petId: pet._id }).sort({ recordDate: -1 }).lean();

  res.json({
    success: true,
    pet,
    medicalRecords,
  });
});

exports.getNgoPets = asyncHandler(async (req, res) => {
  if (!req.ngo) {
    throw new ApiError(403, 'NGO profile not found.');
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;

  const filter = { ngoId: req.ngo._id };
  if (req.query.adoptionStatus && req.query.adoptionStatus !== 'All') {
    filter.adoptionStatus = req.query.adoptionStatus;
  }

  const [pets, total] = await Promise.all([
    Pet.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Pet.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: pets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.createPet = asyncHandler(async (req, res) => {
  const {
    name,
    species,
    breed,
    age,
    gender,
    weight,
    color,
    description,
    personality,
    location,
    medicalHistory,
    isVaccinated,
    vaccinationSummary,
    vaccines,
    sterilizationStatus,
    healthStatus,
    vetName,
    clinicName,
    clinicPhone,
    nextVaccinationDate,
    adoptionStatus,
    isPublished,
  } = req.body;

  const uploadedImages = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadFile(file, 'pawbridge/pets');
      if (uploaded) uploadedImages.push(uploaded);
    }
  } else if (req.body.imageUrls) {
    const urls = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls
      : String(req.body.imageUrls).split(',').map((u) => u.trim()).filter(Boolean);
    urls.forEach((url) => uploadedImages.push({ url, publicId: '' }));
  }

  let parsedVaccines = [];
  if (vaccines) {
    try {
      parsedVaccines = typeof vaccines === 'string' ? JSON.parse(vaccines) : vaccines;
    } catch {
      parsedVaccines = [];
    }
  }

  const parsedPersonality = Array.isArray(personality)
    ? personality
    : String(personality || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const vaccinatedFlag = isVaccinated === true || isVaccinated === 'true';

  const pet = await Pet.create({
    ngoId: req.ngo._id,
    name,
    species,
    breed,
    age: Number(age),
    gender,
    weight: Number(weight),
    color,
    description,
    personality: parsedPersonality,
    location,
    images: uploadedImages,
    medicalHistory,
    vaccinationRecords: {
      isVaccinated: vaccinatedFlag,
      vaccines: parsedVaccines,
      summary: vaccinationSummary || (vaccinatedFlag ? 'Core vaccinations completed' : 'Pending vaccination schedule'),
    },
    sterilizationStatus: sterilizationStatus || 'Not Sterilized',
    healthStatus: healthStatus || 'Healthy',
    veterinaryInfo: {
      vetName,
      clinicName: clinicName || '',
      clinicPhone: clinicPhone || '',
    },
    nextVaccinationDate: nextVaccinationDate ? new Date(nextVaccinationDate) : undefined,
    adoptionStatus: adoptionStatus || 'Available',
    isPublished: isPublished !== 'false' && isPublished !== false,
  });

  // Create initial MedicalRecord entry
  await MedicalRecord.create({
    petId: pet._id,
    veterinarianName: vetName,
    clinicName: clinicName || '',
    diagnosis: medicalHistory,
    treatment: sterilizationStatus === 'Sterilized' ? 'Sterilized & General Wellness Exam' : 'General Wellness Exam',
    vaccinationDetails: {
      vaccineName: parsedVaccines[0]?.name || (vaccinatedFlag ? 'Core Vaccine Panel' : 'Initial Assessment'),
      dateAdministered: parsedVaccines[0]?.dateAdministered || new Date(),
      nextDueDate: nextVaccinationDate ? new Date(nextVaccinationDate) : undefined,
    },
    nextVisitDate: nextVaccinationDate ? new Date(nextVaccinationDate) : undefined,
    createdBy: req.user._id,
  });

  cache.invalidatePrefix('pets:');

  await logAudit({
    userId: req.user._id,
    action: 'PET_CREATED',
    resourceType: 'Pet',
    resourceId: pet._id,
    metadata: { name: pet.name, petCode: pet.petCode },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Pet profile created successfully.',
    pet,
  });
});

exports.updatePet = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) {
    throw new ApiError(404, 'Pet not found.');
  }

  if (req.user.role !== 'admin' && (!req.ngo || String(pet.ngoId) !== String(req.ngo._id))) {
    throw new ApiError(403, 'You are not authorized to update this pet profile.');
  }

  const updatableFields = [
    'name',
    'species',
    'breed',
    'age',
    'gender',
    'weight',
    'color',
    'description',
    'location',
    'medicalHistory',
    'sterilizationStatus',
    'healthStatus',
    'adoptionStatus',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      pet[field] = ['age', 'weight'].includes(field) ? Number(req.body[field]) : req.body[field];
    }
  });

  if (req.body.personality !== undefined) {
    pet.personality = Array.isArray(req.body.personality)
      ? req.body.personality
      : String(req.body.personality)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  }

  if (req.body.vetName || req.body.clinicName || req.body.clinicPhone) {
    pet.veterinaryInfo = {
      vetName: req.body.vetName || pet.veterinaryInfo.vetName,
      clinicName: req.body.clinicName ?? pet.veterinaryInfo.clinicName,
      clinicPhone: req.body.clinicPhone ?? pet.veterinaryInfo.clinicPhone,
    };
  }

  if (req.body.isVaccinated !== undefined || req.body.vaccinationSummary !== undefined) {
    pet.vaccinationRecords = {
      ...pet.vaccinationRecords.toObject(),
      ...(req.body.isVaccinated !== undefined
        ? { isVaccinated: req.body.isVaccinated === true || req.body.isVaccinated === 'true' }
        : {}),
      ...(req.body.vaccinationSummary !== undefined ? { summary: req.body.vaccinationSummary } : {}),
    };
  }

  if (req.body.nextVaccinationDate) {
    pet.nextVaccinationDate = new Date(req.body.nextVaccinationDate);
  }

  if (req.body.isPublished !== undefined) {
    pet.isPublished = req.body.isPublished === true || req.body.isPublished === 'true';
  }

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadFile(file, 'pawbridge/pets');
      if (uploaded) pet.images.push(uploaded);
    }
  }

  await pet.save();
  cache.invalidatePrefix('pets:');

  await logAudit({
    userId: req.user._id,
    action: 'PET_UPDATED',
    resourceType: 'Pet',
    resourceId: pet._id,
    req,
  });

  res.json({
    success: true,
    message: 'Pet profile updated successfully.',
    pet,
  });
});

exports.deletePet = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) {
    throw new ApiError(404, 'Pet not found.');
  }

  if (req.user.role !== 'admin' && (!req.ngo || String(pet.ngoId) !== String(req.ngo._id))) {
    throw new ApiError(403, 'You are not authorized to delete this pet profile.');
  }

  for (const img of pet.images || []) {
    await deleteFile(img.publicId);
  }

  await MedicalRecord.deleteMany({ petId: pet._id });
  await pet.deleteOne();
  cache.invalidatePrefix('pets:');

  await logAudit({
    userId: req.user._id,
    action: 'PET_DELETED',
    resourceType: 'Pet',
    resourceId: pet._id,
    metadata: { name: pet.name },
    req,
  });

  res.json({
    success: true,
    message: 'Pet profile deleted successfully.',
  });
});

exports.getMedicalRecords = asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ petId: req.params.id }).sort({ recordDate: -1 }).lean();
  res.json({ success: true, data: records });
});

exports.addMedicalRecord = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) {
    throw new ApiError(404, 'Pet not found.');
  }

  if (req.user.role !== 'admin' && (!req.ngo || String(pet.ngoId) !== String(req.ngo._id))) {
    throw new ApiError(403, 'Only the managing NGO or admin can add medical records.');
  }

  let docInfo = { url: '', publicId: '' };
  if (req.file) {
    docInfo = await uploadFile(req.file, 'pawbridge/medical-records');
  }

  const record = await MedicalRecord.create({
    petId: pet._id,
    veterinarianName: req.body.veterinarianName,
    clinicName: req.body.clinicName || '',
    diagnosis: req.body.diagnosis,
    treatment: req.body.treatment || '',
    vaccinationDetails: {
      vaccineName: req.body.vaccineName || '',
      dateAdministered: req.body.dateAdministered ? new Date(req.body.dateAdministered) : undefined,
      batchNumber: req.body.batchNumber || '',
      nextDueDate: req.body.nextDueDate ? new Date(req.body.nextDueDate) : undefined,
    },
    documentUrl: docInfo.url,
    documentPublicId: docInfo.publicId,
    recordDate: req.body.recordDate ? new Date(req.body.recordDate) : new Date(),
    nextVisitDate: req.body.nextVisitDate ? new Date(req.body.nextVisitDate) : undefined,
    createdBy: req.user._id,
  });

  // Update pet summary vaccination info if vaccine recorded
  if (req.body.vaccineName) {
    pet.vaccinationRecords.isVaccinated = true;
    pet.vaccinationRecords.vaccines.push({
      name: req.body.vaccineName,
      dateAdministered: req.body.dateAdministered ? new Date(req.body.dateAdministered) : new Date(),
      nextDueDate: req.body.nextDueDate ? new Date(req.body.nextDueDate) : undefined,
    });
    if (req.body.nextDueDate) {
      pet.nextVaccinationDate = new Date(req.body.nextDueDate);
    }
    await pet.save();
    cache.invalidatePrefix('pets:');
  }

  await logAudit({
    userId: req.user._id,
    action: 'MEDICAL_RECORD_ADDED',
    resourceType: 'MedicalRecord',
    resourceId: record._id,
    metadata: { petId: pet._id },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Medical record added successfully.',
    record,
  });
});

exports.reportPet = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) {
    throw new ApiError(404, 'Pet not found.');
  }

  const report = await Report.create({
    reporterId: req.user._id,
    targetType: 'Pet',
    targetId: pet._id,
    reason: req.body.reason,
    details: req.body.details || '',
  });

  pet.reportCount += 1;
  await pet.save({ validateBeforeSave: false });

  await logAudit({
    userId: req.user._id,
    action: 'PET_REPORTED',
    resourceType: 'Report',
    resourceId: report._id,
    metadata: { petId: pet._id, reason: req.body.reason },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Listing reported. Our moderation team will review it shortly.',
    report,
  });
});
