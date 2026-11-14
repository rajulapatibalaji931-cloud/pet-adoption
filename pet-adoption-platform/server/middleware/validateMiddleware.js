const { validationResult } = require('express-validator');
const xss = require('xss');
const ApiError = require('../utils/ApiError');

const sanitizeValue = (val) => {
  if (typeof val === 'string') {
    return xss(val);
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val && typeof val === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      clean[k] = sanitizeValue(v);
    }
    return clean;
  }
  return val;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return next(new ApiError(400, formatted[0].message, formatted));
  }
  next();
};

module.exports = {
  sanitizeInputs,
  validateRequest,
};
