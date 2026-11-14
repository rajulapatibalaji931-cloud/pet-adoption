const CareSchedule = require('../models/CareSchedule');

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

/**
 * Automatically creates post-adoption care schedules when an adoption is finalized.
 */
const createDefaultCareSchedulesForAdoption = async ({ pet, adopterId, ngoId }) => {
  const existingCount = await CareSchedule.countDocuments({ petId: pet._id, adopterId });
  if (existingCount > 0) return [];

  const today = new Date();
  const nextVacDate = pet.nextVaccinationDate
    ? new Date(pet.nextVaccinationDate)
    : addDays(today, 30);

  const schedules = [
    {
      petId: pet._id,
      adopterId,
      ngoId,
      careType: 'Feeding',
      title: `Daily Meal Plan for ${pet.name}`,
      description: `Serve age-appropriate nutritious meals for ${pet.name} (${pet.species}) with fresh clean water twice daily.`,
      reminderDate: addDays(today, 1),
      reminderTime: '08:00',
      recurrence: 'Daily',
    },
    {
      petId: pet._id,
      adopterId,
      ngoId,
      careType: 'Exercise',
      title: `Daily Walk & Enrichment for ${pet.name}`,
      description: `Ensure regular physical activity, playtime, and mental enrichment tailored to ${pet.name}'s energy level.`,
      reminderDate: addDays(today, 1),
      reminderTime: '17:30',
      recurrence: 'Daily',
    },
    {
      petId: pet._id,
      adopterId,
      ngoId,
      careType: 'Veterinary',
      title: `Post-Adoption Wellness Checkup`,
      description: `Initial post-adoption checkup with a licensed veterinarian (${pet.veterinaryInfo?.vetName || 'local clinic'}) to establish continuity of care.`,
      reminderDate: addDays(today, 7),
      reminderTime: '10:30',
      recurrence: 'Once',
    },
    {
      petId: pet._id,
      adopterId,
      ngoId,
      careType: 'Grooming',
      title: `Coat Brushing & Hygiene Care`,
      description: `Brush coat, clean ears, check paws, and trim nails as needed for ${pet.name}.`,
      reminderDate: addDays(today, 7),
      reminderTime: '11:00',
      recurrence: 'Weekly',
    },
    {
      petId: pet._id,
      adopterId,
      ngoId,
      careType: 'Deworming',
      title: `Routine Deworming & Parasite Prevention`,
      description: `Administer veterinarian-recommended deworming and tick/flea preventive treatment.`,
      reminderDate: addDays(today, 30),
      reminderTime: '09:30',
      recurrence: 'Monthly',
    },
    {
      petId: pet._id,
      adopterId,
      ngoId,
      careType: 'Vaccination',
      title: `Scheduled Booster Vaccination for ${pet.name}`,
      description: `Upcoming vaccination appointment based on ${pet.name}'s medical history.`,
      reminderDate: nextVacDate,
      reminderTime: '10:00',
      recurrence: 'Yearly',
    },
  ];

  return CareSchedule.insertMany(schedules);
};

const computeNextReminderDate = (currentDate, recurrence) => {
  const base = new Date(currentDate);
  switch (recurrence) {
    case 'Daily':
      return addDays(base, 1);
    case 'Weekly':
      return addDays(base, 7);
    case 'Monthly':
      return addMonths(base, 1);
    case 'Yearly':
      return addYears(base, 1);
    default:
      return null;
  }
};

module.exports = {
  createDefaultCareSchedulesForAdoption,
  computeNextReminderDate,
};
