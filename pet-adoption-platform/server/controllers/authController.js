const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NGO = require('../models/NGO');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notifyUser, sendEmailNotification } = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUserResponse = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  address: user.address,
  dateOfBirth: user.dateOfBirth,
  verificationStatus: user.verificationStatus,
  verificationProviderReference: user.verificationProviderReference,
  verificationMetadata: user.verificationMetadata,
  isSuspended: user.isSuspended,
  createdAt: user.createdAt,
});

exports.register = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    phone,
    role = 'adopter',
    address,
    organizationName,
    registrationNumber,
    ngoDescription,
    website,
  } = req.body;

  if (!['adopter', 'ngo'].includes(role)) {
    throw new ApiError(400, 'Registration is only allowed for adopter or ngo roles.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  if (role === 'ngo') {
    if (!organizationName || !registrationNumber) {
      throw new ApiError(400, 'Organization name and registration number are required for NGO registration.');
    }
    const existingNgo = await NGO.findOne({ registrationNumber: registrationNumber.trim() });
    if (existingNgo) {
      throw new ApiError(409, 'An NGO with this registration number is already registered.');
    }
  }

  const parsedAddress =
    typeof address === 'string'
      ? { street: address, city: '', state: '', postalCode: '', country: 'India' }
      : address || {};

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    phone: phone || '',
    role,
    address: parsedAddress,
    verificationStatus: role === 'ngo' ? 'Pending' : 'Unverified',
  });

  let ngo = null;
  if (role === 'ngo') {
    ngo = await NGO.create({
      userId: user._id,
      organizationName: organizationName.trim(),
      registrationNumber: registrationNumber.trim(),
      address: {
        street: parsedAddress.street || '',
        city: parsedAddress.city || 'Not specified',
        state: parsedAddress.state || 'Not specified',
        postalCode: parsedAddress.postalCode || '',
        country: parsedAddress.country || 'India',
      },
      contactDetails: {
        email: user.email,
        phone: user.phone,
        website: website || '',
      },
      description: ngoDescription || '',
      verificationStatus: 'Pending',
    });
  }

  await notifyUser({
    userId: user._id,
    title: 'Welcome to PawBridge!',
    message:
      role === 'ngo'
        ? `Your NGO account (${ngo.organizationName}) has been registered and is pending administrator verification.`
        : 'Your adopter account has been created. Complete identity verification in your dashboard to apply for pet adoptions.',
    notificationType: 'Registration',
    relatedId: user._id,
    relatedModel: 'User',
  });

  await logAudit({
    userId: user._id,
    action: 'USER_REGISTERED',
    resourceType: 'User',
    resourceId: user._id,
    metadata: { role },
    req,
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    token,
    user: sanitizeUserResponse(user),
    ngo,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.isSuspended) {
    throw new ApiError(403, `Your account is suspended. ${user.suspensionReason || ''}`.trim());
  }

  let ngo = null;
  if (user.role === 'ngo') {
    ngo = await NGO.findOne({ userId: user._id });
  }

  await logAudit({
    userId: user._id,
    action: 'USER_LOGIN',
    resourceType: 'User',
    resourceId: user._id,
    req,
  });

  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: sanitizeUserResponse(user),
    ngo,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await logAudit({
      userId: req.user._id,
      action: 'USER_LOGOUT',
      resourceType: 'User',
      resourceId: req.user._id,
      req,
    });
  }
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success message to prevent email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  await sendEmailNotification({
    to: user.email,
    subject: '[PawBridge] Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a;">Reset Your Password</h2>
        <p>Hi ${user.fullName},</p>
        <p>You requested a password reset. Click the button below within 30 minutes to set a new password:</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a></p>
        <p style="font-size:12px;color:#6b7280;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  await logAudit({
    userId: user._id,
    action: 'PASSWORD_RESET_REQUESTED',
    resourceType: 'User',
    resourceId: user._id,
    req,
  });

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
    ...(process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST ? { devResetToken: resetToken } : {}),
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token.');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await logAudit({
    userId: user._id,
    action: 'PASSWORD_RESET_COMPLETED',
    resourceType: 'User',
    resourceId: user._id,
    req,
  });

  res.json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.',
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUserResponse(req.user),
    ngo: req.ngo || null,
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, address, dateOfBirth } = req.body;
  const user = await User.findById(req.user._id);

  if (fullName) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (address && typeof address === 'object') {
    user.address = { ...user.address?.toObject?.(), ...address };
  }
  if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: sanitizeUserResponse(user),
  });
});

exports.saveFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'FCM token is required.');

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { fcmTokens: token },
  });

  res.json({ success: true, message: 'Push notification token registered.' });
});
