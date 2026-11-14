const express = require('express');
const { body } = require('express-validator');
const petController = require('../controllers/petController');
const { protect, authorize, requireVerifiedNgo } = require('../middleware/authMiddleware');
const { uploadPetImages, uploadDocument } = require('../middleware/uploadMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.get('/search', petController.searchPets);
router.get('/ngo/my-pets', protect, authorize('ngo'), petController.getNgoPets);
router.get('/', petController.getPets);
router.get('/:id', petController.getPetById);

router.post(
  '/',
  protect,
  authorize('ngo'),
  requireVerifiedNgo,
  uploadPetImages.array('images', 6),
  [
    body('name').trim().notEmpty().withMessage('Pet name is required'),
    body('species').isIn(['Dog', 'Cat', 'Rabbit', 'Bird', 'Other']).withMessage('Valid species is required'),
    body('breed').trim().notEmpty().withMessage('Breed is required'),
    body('age').isFloat({ min: 0, max: 40 }).withMessage('Valid age is required'),
    body('gender').isIn(['Male', 'Female']).withMessage('Gender must be Male or Female'),
    body('weight').isFloat({ min: 0.1 }).withMessage('Valid weight is required'),
    body('color').trim().notEmpty().withMessage('Color is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('medicalHistory').trim().notEmpty().withMessage('Medical history is required before publishing'),
    body('vetName').trim().notEmpty().withMessage('Veterinarian name is required before publishing'),
    validateRequest,
  ],
  petController.createPet
);

router.put(
  '/:id',
  protect,
  authorize('ngo', 'admin'),
  uploadPetImages.array('images', 6),
  petController.updatePet
);

router.delete('/:id', protect, authorize('ngo', 'admin'), petController.deletePet);

router.get('/:id/medical-records', petController.getMedicalRecords);
router.post(
  '/:id/medical-records',
  protect,
  authorize('ngo', 'admin'),
  uploadDocument.single('document'),
  [
    body('veterinarianName').trim().notEmpty().withMessage('Veterinarian name is required'),
    body('diagnosis').trim().notEmpty().withMessage('Diagnosis or summary is required'),
    validateRequest,
  ],
  petController.addMedicalRecord
);

router.post(
  '/:id/report',
  protect,
  [body('reason').trim().notEmpty().withMessage('Report reason is required'), validateRequest],
  petController.reportPet
);

module.exports = router;
