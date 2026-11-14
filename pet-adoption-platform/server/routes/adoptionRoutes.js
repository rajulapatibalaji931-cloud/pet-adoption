const express = require('express');
const { body } = require('express-validator');
const adoptionController = require('../controllers/adoptionController');
const { protect, authorize, requireVerifiedAdopter } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('adopter'),
  requireVerifiedAdopter,
  [
    body('petId').notEmpty().withMessage('Pet ID is required'),
    body('residentialAddress').trim().notEmpty().withMessage('Residential address is required'),
    body('housingType').notEmpty().withMessage('Housing type is required'),
    body('petOwnershipExperience').trim().notEmpty().withMessage('Pet ownership experience is required'),
    body('reasonForAdoption').trim().notEmpty().withMessage('Reason for adoption is required'),
    body('availabilityToCare').trim().notEmpty().withMessage('Availability to care is required'),
    validateRequest,
  ],
  adoptionController.submitAdoptionRequest
);

router.get('/my-requests', protect, authorize('adopter'), adoptionController.getMyRequests);
router.get('/ngo-requests', protect, authorize('ngo'), adoptionController.getNgoRequests);
router.get('/pet/:petId', protect, authorize('ngo', 'admin'), adoptionController.getPetRequests);

router.put(
  '/:id/status',
  protect,
  authorize('ngo', 'admin'),
  [
    body('status')
      .isIn(['Under Review', 'Approved', 'Rejected', 'Completed'])
      .withMessage('Valid adoption status is required'),
    validateRequest,
  ],
  adoptionController.updateAdoptionStatus
);

router.post('/:id/cancel', protect, authorize('adopter'), adoptionController.cancelAdoptionRequest);

module.exports = router;
