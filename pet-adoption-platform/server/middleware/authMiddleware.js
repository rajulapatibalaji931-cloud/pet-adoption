const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NGO = require('../models/NGO');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Session expired or invalid token. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Account associated with this token no longer exists.');
  }

  if (user.isSuspended) {
    throw new ApiError(403, `Account suspended: ${user.suspensionReason || 'Contact platform support.'}`);
  }

  req.user = user;

  if (user.role === 'ngo') {
    req.ngo = await NGO.findOne({ userId: user._id });
  }

  next();
});

const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isSuspended) {
        req.user = user;
        if (user.role === 'ngo') {
          req.ngo = await NGO.findOne({ userId: user._id });
        }
      }
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

const requireVerifiedAdopter = (req, res, next) => {
  if (!req.user || req.user.role !== 'adopter') {
    return next(new ApiError(403, 'Only adopter accounts can perform this action.'));
  }
  if (req.user.verificationStatus !== 'Verified') {
    return next(
      new ApiError(
        403,
        `Identity verification is required before applying for adoption. Current status: ${req.user.verificationStatus}`
      )
    );
  }
  next();
};

const requireVerifiedNgo = (req, res, next) => {
  if (!req.user || req.user.role !== 'ngo' || !req.ngo) {
    return next(new ApiError(403, 'NGO profile required.'));
  }
  if (req.ngo.verificationStatus !== 'Verified') {
    return next(
      new ApiError(
        403,
        `Your NGO account must be verified by an administrator first. Current status: ${req.ngo.verificationStatus}`
      )
    );
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  requireVerifiedAdopter,
  requireVerifiedNgo,
};
