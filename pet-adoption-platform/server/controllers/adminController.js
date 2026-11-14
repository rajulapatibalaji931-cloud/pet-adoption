const User = require('../models/User');
const NGO = require('../models/NGO');
const Pet = require('../models/Pet');
const AdoptionRequest = require('../models/AdoptionRequest');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notifyUser } = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');
const cache = require('../utils/cache');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalAdopters,
    totalNgos,
    verifiedNgos,
    pendingNgos,
    totalPets,
    availablePets,
    adoptedPets,
    totalAdoptions,
    pendingAdoptions,
    openReports,
    pendingAdopterVerifications,
    speciesBreakdown,
    monthlyAdoptions,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'adopter' }),
    NGO.countDocuments(),
    NGO.countDocuments({ verificationStatus: 'Verified' }),
    NGO.countDocuments({ verificationStatus: 'Pending' }),
    Pet.countDocuments(),
    Pet.countDocuments({ adoptionStatus: 'Available' }),
    Pet.countDocuments({ adoptionStatus: 'Adopted' }),
    AdoptionRequest.countDocuments(),
    AdoptionRequest.countDocuments({ applicationStatus: { $in: ['Pending', 'Under Review'] } }),
    Report.countDocuments({ status: 'Open' }),
    User.countDocuments({ role: 'adopter', verificationStatus: { $in: ['Pending', 'Requires Manual Review'] } }),
    Pet.aggregate([{ $group: { _id: '$species', count: { $sum: 1 } } }]),
    AdoptionRequest.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' },
          },
          applications: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$applicationStatus', 'Completed'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]),
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalAdopters,
      totalNgos,
      verifiedNgos,
      pendingNgos,
      totalPets,
      availablePets,
      adoptedPets,
      totalAdoptions,
      pendingAdoptions,
      openReports,
      pendingAdopterVerifications,
    },
    charts: {
      speciesBreakdown: speciesBreakdown.map((s) => ({ name: s._id || 'Other', value: s.count })),
      monthlyAdoptions: monthlyAdoptions.map((m) => ({
        month: `${monthNames[(m._id.month || 1) - 1]} ${m._id.year}`,
        applications: m.applications,
        completed: m.completed,
      })),
    },
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role && req.query.role !== 'All') filter.role = req.query.role;
  if (req.query.verificationStatus && req.query.verificationStatus !== 'All') {
    filter.verificationStatus = req.query.verificationStatus;
  }
  if (req.query.q) {
    filter.$or = [
      { fullName: { $regex: req.query.q, $options: 'i' } },
      { email: { $regex: req.query.q, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

exports.toggleUserSuspension = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot suspend an administrator account.');

  user.isSuspended = req.body.isSuspended !== undefined ? Boolean(req.body.isSuspended) : !user.isSuspended;
  user.suspensionReason = user.isSuspended ? req.body.reason || 'Suspended by administrator.' : '';
  await user.save();

  await logAudit({
    userId: req.user._id,
    action: user.isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
    resourceType: 'User',
    resourceId: user._id,
    metadata: { reason: user.suspensionReason },
    req,
  });

  res.json({
    success: true,
    message: user.isSuspended ? 'User account suspended.' : 'User account reactivated.',
    user,
  });
});

exports.getNgos = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'All') {
    filter.verificationStatus = req.query.status;
  }

  const ngos = await NGO.find(filter)
    .populate('userId', 'fullName email phone isSuspended')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: ngos });
});

exports.updateVerificationStatus = asyncHandler(async (req, res) => {
  const { status, notes = '', targetType } = req.body;
  const allowed = ['Pending', 'Verified', 'Rejected', 'Requires Manual Review'];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid verification status. Allowed: ${allowed.join(', ')}`);
  }

  // Can verify either an NGO (by NGO _id) or an Adopter User (by User _id)
  let ngo = targetType === 'adopter' ? null : await NGO.findById(req.params.id);

  if (ngo) {
    ngo.verificationStatus = status;
    ngo.verificationNotes = notes;
    await ngo.save();

    await User.findByIdAndUpdate(ngo.userId, { verificationStatus: status });
    cache.invalidatePrefix('pets:');

    await notifyUser({
      userId: ngo.userId,
      title: `NGO Verification ${status}`,
      message:
        status === 'Verified'
          ? `Congratulations! ${ngo.organizationName} is now verified and can publish pet listings.`
          : `Your NGO verification status has been updated to ${status}. ${notes}`,
      notificationType: 'Verification',
      relatedId: ngo._id,
      relatedModel: 'NGO',
    });

    await logAudit({
      userId: req.user._id,
      action: `NGO_VERIFICATION_${status.toUpperCase().replace(/\s+/g, '_')}`,
      resourceType: 'NGO',
      resourceId: ngo._id,
      metadata: { notes },
      req,
    });

    return res.json({
      success: true,
      message: `NGO verification updated to ${status}.`,
      ngo,
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'NGO or User record not found.');
  }

  user.verificationStatus = status;
  user.verificationMetadata = {
    ...(user.verificationMetadata?.toObject?.() || user.verificationMetadata || {}),
    reviewedAt: new Date(),
    notes: notes || `Manually marked ${status} by administrator.`,
  };
  await user.save();

  await notifyUser({
    userId: user._id,
    title: `Identity Verification ${status}`,
    message: notes || `Your identity verification status has been updated to ${status}.`,
    notificationType: 'Verification',
    relatedId: user._id,
    relatedModel: 'User',
  });

  await logAudit({
    userId: req.user._id,
    action: `ADOPTER_VERIFICATION_${status.toUpperCase().replace(/\s+/g, '_')}`,
    resourceType: 'User',
    resourceId: user._id,
    metadata: { notes },
    req,
  });

  res.json({
    success: true,
    message: `User verification updated to ${status}.`,
    user,
  });
});

exports.getReports = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;

  const reports = await Report.find(filter)
    .populate('reporterId', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();

  // Enrich Pet reports with pet info
  const petIds = reports.filter((r) => r.targetType === 'Pet').map((r) => r.targetId);
  const pets = await Pet.find({ _id: { $in: petIds } }).select('name species breed petCode adoptionStatus isPublished').lean();
  const petMap = new Map(pets.map((p) => [String(p._id), p]));

  const enriched = reports.map((r) => ({
    ...r,
    targetInfo: r.targetType === 'Pet' ? petMap.get(String(r.targetId)) || null : null,
  }));

  res.json({ success: true, data: enriched });
});

exports.updateReportStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes = '', unpublishPet = false } = req.body;
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Report not found.');

  report.status = status;
  report.adminNotes = adminNotes;
  report.reviewedBy = req.user._id;
  await report.save();

  if (unpublishPet && report.targetType === 'Pet') {
    await Pet.findByIdAndUpdate(report.targetId, {
      isPublished: false,
      adoptionStatus: 'Unavailable',
    });
    cache.invalidatePrefix('pets:');
  }

  await logAudit({
    userId: req.user._id,
    action: 'REPORT_REVIEWED',
    resourceType: 'Report',
    resourceId: report._id,
    metadata: { status, unpublishPet },
    req,
  });

  res.json({ success: true, message: 'Report updated.', report });
});

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .populate('userId', 'fullName email role')
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

  res.json({ success: true, data: logs });
});

exports.getAllAdoptions = asyncHandler(async (req, res) => {
  const adoptions = await AdoptionRequest.find()
    .populate('petId', 'name species breed petCode adoptionStatus')
    .populate('adopterId', 'fullName email verificationStatus')
    .populate('ngoId', 'organizationName')
    .sort({ submittedAt: -1 })
    .limit(100)
    .lean();

  res.json({ success: true, data: adoptions });
});
