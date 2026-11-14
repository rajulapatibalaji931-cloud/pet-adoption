const express = require('express');
const { body } = require('express-validator');
const careController = require('../controllers/careController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize('adopter', 'ngo', 'admin'),
  [
    body('petId').notEmpty().withMessage('Pet ID is required'),
    body('careType')
      .isIn(['Feeding', 'Vaccination', 'Veterinary', 'Grooming', 'Deworming', 'Exercise', 'Health Check'])
      .withMessage('Valid care type is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('reminderDate').notEmpty().withMessage('Reminder date is required'),
    validateRequest,
  ],
  careController.createCareSchedule
);

router.get('/my-schedules', careController.getMyCareSchedules);
router.put('/:id', careController.updateCareSchedule);
router.delete('/:id', careController.deleteCareSchedule);
router.post('/:id/complete', careController.completeCareSchedule);

module.exports = router;
