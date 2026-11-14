const express = require('express');
const { body } = require('express-validator');
const verificationController = require('../controllers/verificationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadDocument } = require('../middleware/uploadMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post(
  '/submit',
  protect,
  authorize('adopter'),
  uploadDocument.single('addressProof'),
  [
    body('fullName').trim().notEmpty().withMessage('Full legal name is required'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('idType').trim().notEmpty().withMessage('Government ID type is required'),
    body('idNumber').trim().isLength({ min: 6 }).withMessage('Valid government ID number is required'),
    body('address').notEmpty().withMessage('Residential address is required'),
    body('phone').trim().notEmpty().withMessage('Contact phone is required'),
    validateRequest,
  ],
  verificationController.submitVerification
);

router.get('/status', protect, verificationController.getVerificationStatus);
router.post('/webhook', verificationController.handleVerificationWebhook);

module.exports = router;
