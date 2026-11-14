const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.put('/users/:id/suspend', adminController.toggleUserSuspension);
router.get('/ngos', adminController.getNgos);
router.put(
  '/verification/:id',
  [
    body('status')
      .isIn(['Pending', 'Verified', 'Rejected', 'Requires Manual Review'])
      .withMessage('Valid verification status required'),
    validateRequest,
  ],
  adminController.updateVerificationStatus
);
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.updateReportStatus);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/adoptions', adminController.getAllAdoptions);

module.exports = router;
