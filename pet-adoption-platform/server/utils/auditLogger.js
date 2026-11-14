const AuditLog = require('../models/AuditLog');

const logAudit = async ({ userId = null, action, resourceType, resourceId = '', metadata = {}, req = null }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : '',
      metadata,
      ipAddress: req ? req.ip || req.headers['x-forwarded-for'] || '' : '',
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

module.exports = { logAudit };
