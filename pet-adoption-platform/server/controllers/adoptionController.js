const AdoptionRequest = require('../models/AdoptionRequest');
const Pet = require('../models/Pet');
const NGO = require('../models/NGO');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const cache = require('../utils/cache');
const { notifyUser } = require('../services/notificationService');
const { createDefaultCareSchedulesForAdoption } = require('../services/careService');
const { logAudit } = require('../utils/auditLogger');

exports.submitAdoptionRequest = asyncHandler(async (req, res) => {
  const {
    petId,
    residentialAddress,
    housingType,
    petOwnershipExperience,
    reasonForAdoption,
    familyApproval,
    availabilityToCare,
    preferredContactMethod,
    phone,
  } = req.body;

  const pet = await Pet.findById(petId).populate('ngoId');
  if (!pet || !pet.isPublished) {
    throw new ApiError(404, 'Pet listing not found.');
  }

  if (!['Available', 'Pending'].includes(pet.adoptionStatus)) {
    throw new ApiError(400, `This pet is currently ${pet.adoptionStatus.toLowerCase()} and not accepting applications.`);
  }

  // Enforce one active application per adopter per pet (also enforced by partial unique index)
  const existingActive = await AdoptionRequest.findOne({
    petId: pet._id,
    adopterId: req.user._id,
    applicationStatus: { $in: ['Pending', 'Under Review', 'Approved', 'Completed'] },
  });

  if (existingActive) {
    throw new ApiError(409, 'You already have an active adoption request for this pet.');
  }

  const adoptionRequest = await AdoptionRequest.create({
    petId: pet._id,
    adopterId: req.user._id,
    ngoId: pet.ngoId._id,
    applicationDetails: {
      fullName: req.user.fullName,
      email: req.user.email,
      phone: phone || req.user.phone || 'Not provided',
      residentialAddress,
      housingType,
      petOwnershipExperience,
      reasonForAdoption,
      familyApproval: Boolean(familyApproval === true || familyApproval === 'true'),
      availabilityToCare,
      preferredContactMethod: preferredContactMethod || 'Phone',
    },
    verificationStatus: req.user.verificationStatus,
    applicationStatus: 'Pending',
  });

  // Notify adopter
  await notifyUser({
    userId: req.user._id,
    title: `Application Submitted for ${pet.name}`,
    message: `Your adoption application for ${pet.name} (${pet.breed}) has been received by ${pet.ngoId.organizationName}.`,
    notificationType: 'Adoption',
    relatedId: adoptionRequest._id,
    relatedModel: 'AdoptionRequest',
  });

  // Notify NGO user
  if (pet.ngoId?.userId) {
    await notifyUser({
      userId: pet.ngoId.userId,
      title: `New Adoption Request for ${pet.name}`,
      message: `${req.user.fullName} (Verified Adopter) has applied to adopt ${pet.name}.`,
      notificationType: 'Adoption',
      relatedId: adoptionRequest._id,
      relatedModel: 'AdoptionRequest',
    });
  }

  await logAudit({
    userId: req.user._id,
    action: 'ADOPTION_REQUEST_SUBMITTED',
    resourceType: 'AdoptionRequest',
    resourceId: adoptionRequest._id,
    metadata: { petId: pet._id },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Adoption application submitted successfully.',
    adoptionRequest,
  });
});

exports.getMyRequests = asyncHandler(async (req, res) => {
  const requests = await AdoptionRequest.find({ adopterId: req.user._id })
    .populate('petId', 'name species breed age gender images location adoptionStatus petCode')
    .populate('ngoId', 'organizationName contactDetails address')
    .sort({ submittedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: requests,
  });
});

exports.getNgoRequests = asyncHandler(async (req, res) => {
  if (!req.ngo) {
    throw new ApiError(403, 'NGO profile required.');
  }

  const filter = { ngoId: req.ngo._id };
  if (req.query.status && req.query.status !== 'All') {
    filter.applicationStatus = req.query.status;
  }

  const requests = await AdoptionRequest.find(filter)
    .populate('petId', 'name species breed age gender images adoptionStatus petCode')
    .populate('adopterId', 'fullName email phone verificationStatus address verificationMetadata')
    .sort({ submittedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: requests,
  });
});

exports.getPetRequests = asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.petId);
  if (!pet) {
    throw new ApiError(404, 'Pet not found.');
  }

  if (req.user.role !== 'admin' && (!req.ngo || String(pet.ngoId) !== String(req.ngo._id))) {
    throw new ApiError(403, 'You are not authorized to view adoption requests for this pet.');
  }

  const requests = await AdoptionRequest.find({ petId: pet._id })
    .populate('adopterId', 'fullName email phone verificationStatus address')
    .sort({ submittedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: requests,
  });
});

exports.updateAdoptionStatus = asyncHandler(async (req, res) => {
  const { status, reviewNotes = '' } = req.body;
  const allowed = ['Under Review', 'Approved', 'Rejected', 'Completed'];

  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed values: ${allowed.join(', ')}`);
  }

  const adoptionRequest = await AdoptionRequest.findById(req.params.id).populate('petId');
  if (!adoptionRequest) {
    throw new ApiError(404, 'Adoption request not found.');
  }

  if (
    req.user.role !== 'admin' &&
    (!req.ngo || String(adoptionRequest.ngoId) !== String(req.ngo._id))
  ) {
    throw new ApiError(403, 'You are not authorized to update this adoption request.');
  }

  if (['Cancelled', 'Completed', 'Rejected'].includes(adoptionRequest.applicationStatus)) {
    throw new ApiError(
      400,
      `Cannot update a request that is already ${adoptionRequest.applicationStatus}.`
    );
  }

  const pet = adoptionRequest.petId;
  if (!pet) {
    throw new ApiError(404, 'Associated pet not found.');
  }

  if (status === 'Approved') {
    // Atomically move pet to Pending if currently Available or already Pending
    const updatedPet = await Pet.findOneAndUpdate(
      { _id: pet._id, adoptionStatus: { $in: ['Available', 'Pending'] } },
      { $set: { adoptionStatus: 'Pending' } },
      { new: true }
    );
    if (!updatedPet) {
      throw new ApiError(409, 'This pet has already been adopted or is no longer available.');
    }
    adoptionRequest.applicationStatus = 'Approved';
    adoptionRequest.reviewedAt = new Date();
    adoptionRequest.reviewNotes = reviewNotes;
    await adoptionRequest.save();
  } else if (status === 'Completed') {
    // Concurrency-safe atomic finalization: only ONE adoption can ever succeed per pet
    const finalizedPet = await Pet.findOneAndUpdate(
      { _id: pet._id, adoptionStatus: { $in: ['Available', 'Pending'] } },
      {
        $set: {
          adoptionStatus: 'Adopted',
          adoptedBy: adoptionRequest.adopterId,
          adoptedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!finalizedPet) {
      throw new ApiError(409, 'Adoption conflict: this pet has already been adopted.');
    }

    adoptionRequest.applicationStatus = 'Completed';
    adoptionRequest.reviewedAt = adoptionRequest.reviewedAt || new Date();
    adoptionRequest.completedAt = new Date();
    adoptionRequest.reviewNotes = reviewNotes;
    await adoptionRequest.save();

    // Auto-reject any other active applications for the same pet
    const competingRequests = await AdoptionRequest.find({
      petId: pet._id,
      _id: { $ne: adoptionRequest._id },
      applicationStatus: { $in: ['Pending', 'Under Review', 'Approved'] },
    });

    if (competingRequests.length > 0) {
      await AdoptionRequest.updateMany(
        {
          petId: pet._id,
          _id: { $ne: adoptionRequest._id },
          applicationStatus: { $in: ['Pending', 'Under Review', 'Approved'] },
        },
        {
          $set: {
            applicationStatus: 'Rejected',
            reviewedAt: new Date(),
            reviewNotes: `${pet.name} has been adopted by another family.`,
          },
        }
      );

      for (const comp of competingRequests) {
        await notifyUser({
          userId: comp.adopterId,
          title: `Adoption Update for ${pet.name}`,
          message: `Thank you for applying to adopt ${pet.name}. ${pet.name} has now been placed with another adopter. Please explore other wonderful pets waiting for a home.`,
          notificationType: 'Adoption',
          relatedId: comp._id,
          relatedModel: 'AdoptionRequest',
        });
      }
    }

    // Automatically generate post-adoption care schedules
    await createDefaultCareSchedulesForAdoption({
      pet: finalizedPet,
      adopterId: adoptionRequest.adopterId,
      ngoId: adoptionRequest.ngoId,
    });
  } else {
    adoptionRequest.applicationStatus = status;
    adoptionRequest.reviewedAt = new Date();
    adoptionRequest.reviewNotes = reviewNotes;
    await adoptionRequest.save();
  }

  cache.invalidatePrefix('pets:');

  // Notify adopter of status update
  const statusMessages = {
    'Under Review': `Your adoption application for ${pet.name} is now under review by the shelter.`,
    Approved: `Great news! Your adoption request for ${pet.name} has been approved. The shelter will coordinate final handover.`,
    Rejected: `Your adoption request for ${pet.name} was not approved at this time. ${reviewNotes ? `Note: ${reviewNotes}` : ''}`,
    Completed: `Congratulations! Your adoption of ${pet.name} is now complete. Your personalized Pet Care Dashboard and reminders are ready!`,
  };

  await notifyUser({
    userId: adoptionRequest.adopterId,
    title: `Adoption ${status}: ${pet.name}`,
    message: statusMessages[status],
    notificationType: 'Adoption',
    relatedId: adoptionRequest._id,
    relatedModel: 'AdoptionRequest',
  });

  await logAudit({
    userId: req.user._id,
    action: `ADOPTION_${status.toUpperCase().replace(/\s+/g, '_')}`,
    resourceType: 'AdoptionRequest',
    resourceId: adoptionRequest._id,
    metadata: { petId: pet._id, adopterId: adoptionRequest.adopterId },
    req,
  });

  res.json({
    success: true,
    message: `Adoption request marked as ${status}.`,
    adoptionRequest,
  });
});

exports.cancelAdoptionRequest = asyncHandler(async (req, res) => {
  const adoptionRequest = await AdoptionRequest.findById(req.params.id).populate('petId', 'name');
  if (!adoptionRequest) {
    throw new ApiError(404, 'Adoption request not found.');
  }

  if (String(adoptionRequest.adopterId) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only cancel your own adoption requests.');
  }

  if (!['Pending', 'Under Review'].includes(adoptionRequest.applicationStatus)) {
    throw new ApiError(
      400,
      `Cannot cancel an application with status ${adoptionRequest.applicationStatus}.`
    );
  }

  adoptionRequest.applicationStatus = 'Cancelled';
  await adoptionRequest.save();

  await logAudit({
    userId: req.user._id,
    action: 'ADOPTION_REQUEST_CANCELLED',
    resourceType: 'AdoptionRequest',
    resourceId: adoptionRequest._id,
    req,
  });

  res.json({
    success: true,
    message: 'Adoption request cancelled successfully.',
    adoptionRequest,
  });
});
