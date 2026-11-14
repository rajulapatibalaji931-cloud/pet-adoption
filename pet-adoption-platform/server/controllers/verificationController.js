const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { uploadFile } = require('../services/storageService');
const { submitToVerificationProvider } = require('../services/verificationService');
const { notifyUser } = require('../services/notificationService');
const { verifyWebhookSignature } = require('../utils/cryptoHelper');
const { logAudit } = require('../utils/auditLogger');

exports.submitVerification = asyncHandler(async (req, res) => {
  if (req.user.role !== 'adopter') {
    throw new ApiError(403, 'Identity verification submission is for adopter accounts.');
  }

  const { fullName, dateOfBirth, idType, idNumber, address, phone, email } = req.body;

  let addressProofUrl = req.user.verificationMetadata?.addressProofUrl || '';
  if (req.file) {
    const uploaded = await uploadFile(req.file, 'pawbridge/verification');
    addressProofUrl = uploaded.url;
  }

  if (!addressProofUrl && !req.body.addressProofReference) {
    throw new ApiError(400, 'Please upload an address proof document (PDF or image).');
  }

  // Send sensitive ID information directly to the authorized provider (never persist raw ID number)
  const result = await submitToVerificationProvider({
    userId: req.user._id,
    fullName,
    dateOfBirth,
    idType,
    idNumber,
    address,
    phone,
    email,
    addressProofUrl,
  });

  const user = await User.findById(req.user._id);
  user.fullName = fullName || user.fullName;
  if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
  if (phone) user.phone = phone;
  if (address) {
    user.address =
      typeof address === 'string'
        ? { ...user.address?.toObject?.(), street: address }
        : { ...user.address?.toObject?.(), ...address };
  }

  user.verificationStatus = result.status;
  user.verificationProviderReference = result.providerReference;
  user.verificationMetadata = {
    idType,
    maskedIdLast4: result.maskedIdLast4,
    addressProofUrl,
    provider: result.provider,
    submittedAt: new Date(),
    reviewedAt: result.status === 'Verified' || result.status === 'Rejected' ? new Date() : undefined,
    notes: result.notes,
  };

  await user.save();

  await notifyUser({
    userId: user._id,
    title: `Identity Verification: ${result.status}`,
    message: result.notes,
    notificationType: 'Verification',
    relatedId: user._id,
    relatedModel: 'User',
  });

  await logAudit({
    userId: user._id,
    action: 'IDENTITY_VERIFICATION_SUBMITTED',
    resourceType: 'User',
    resourceId: user._id,
    metadata: {
      provider: result.provider,
      providerReference: result.providerReference,
      status: result.status,
      idType,
    },
    req,
  });

  res.status(200).json({
    success: true,
    message: `Verification status: ${result.status}`,
    verificationStatus: user.verificationStatus,
    verificationProviderReference: user.verificationProviderReference,
    verificationMetadata: user.verificationMetadata,
    isMockProvider: result.isMock,
  });
});

exports.getVerificationStatus = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    verificationStatus: req.user.verificationStatus,
    verificationProviderReference: req.user.verificationProviderReference,
    verificationMetadata: req.user.verificationMetadata,
    providerMode: process.env.ID_VERIFICATION_PROVIDER || 'mock',
  });
});

exports.handleVerificationWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.ID_VERIFICATION_WEBHOOK_SECRET;
  const signature = req.headers['x-verification-signature'];

  if (process.env.NODE_ENV === 'production' || secret) {
    const valid = verifyWebhookSignature(req.body, signature, secret);
    if (!valid) {
      throw new ApiError(401, 'Invalid verification webhook signature.');
    }
  }

  const { providerReference, status, notes } = req.body;
  const allowedStatuses = ['Pending', 'Verified', 'Rejected', 'Requires Manual Review'];
  if (!providerReference || !allowedStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid webhook payload.');
  }

  const user = await User.findOne({ verificationProviderReference: providerReference });
  if (!user) {
    throw new ApiError(404, 'Verification reference not found.');
  }

  user.verificationStatus = status;
  user.verificationMetadata.reviewedAt = new Date();
  if (notes) user.verificationMetadata.notes = notes;
  await user.save();

  await notifyUser({
    userId: user._id,
    title: `Identity Verification Updated: ${status}`,
    message: notes || `Your identity verification status is now ${status}.`,
    notificationType: 'Verification',
    relatedId: user._id,
    relatedModel: 'User',
  });

  await logAudit({
    userId: user._id,
    action: 'IDENTITY_VERIFICATION_WEBHOOK',
    resourceType: 'User',
    resourceId: user._id,
    metadata: { providerReference, status },
    req,
  });

  res.json({ success: true, message: 'Webhook processed.' });
});
