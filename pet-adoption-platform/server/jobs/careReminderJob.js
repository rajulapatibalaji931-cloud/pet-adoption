const cron = require('node-cron');
const CareSchedule = require('../models/CareSchedule');
const { notifyUser } = require('../services/notificationService');

const processDueCareReminders = async () => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSchedules = await CareSchedule.find({
      completionStatus: 'Pending',
      reminderDate: { $lte: next24Hours },
    })
      .populate('petId', 'name species')
      .limit(200);

    for (const schedule of dueSchedules) {
      if (!schedule.petId) continue;

      const dateKey = new Date(schedule.reminderDate).toISOString().split('T')[0];
      const dedupeKey = `care:${schedule._id}:${dateKey}`;

      await notifyUser({
        userId: schedule.adopterId,
        title: `${schedule.careType} Reminder: ${schedule.petId.name}`,
        message: `${schedule.title} — Scheduled for ${dateKey} at ${schedule.reminderTime}. ${schedule.description}`,
        notificationType: 'CareReminder',
        relatedId: schedule._id,
        relatedModel: 'CareSchedule',
        dedupeKey,
        sendEmail: true,
      });

      schedule.lastRemindedAt = new Date();
      await schedule.save();
    }
  } catch (err) {
    console.error('Care reminder cron error:', err.message);
  }
};

const startCareReminderJob = () => {
  // Runs every 15 minutes
  const task = cron.schedule('*/15 * * * *', () => {
    processDueCareReminders();
  });

  // Also run once 5 seconds after server startup so immediate due reminders fire
  setTimeout(() => {
    processDueCareReminders();
  }, 5000);

  console.log('Scheduled post-adoption care reminder job active (every 15 minutes)');
  return task;
};

module.exports = {
  startCareReminderJob,
  processDueCareReminders,
};
