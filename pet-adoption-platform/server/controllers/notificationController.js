const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 25);
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.unreadOnly === 'true') {
    filter.readStatus = false;
  }
  if (req.query.type && req.query.type !== 'All') {
    filter.notificationType = req.query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, readStatus: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { readStatus: true } },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found.');
  }

  res.json({
    success: true,
    notification,
  });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, readStatus: false },
    { $set: { readStatus: true } }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
