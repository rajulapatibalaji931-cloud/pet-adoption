const Notification = require('../models/Notification');
const User = require('../models/User');
const { getTransporter } = require('../config/mailer');
const { admin, isFcmEnabled } = require('../config/firebase');

const sendEmailNotification = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pawbridge.org',
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html,
    });
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log(`[Email Dev Preview] To: ${to} | Subject: ${subject} | ID: ${info.messageId}`);
    }
    return true;
  } catch (err) {
    console.error('Email notification failed:', err.message);
    return false;
  }
};

const sendPushNotification = async (user, { title, message }) => {
  if (!isFcmEnabled() || !user?.fcmTokens?.length) return false;
  try {
    await admin.messaging().sendEachForMulticast({
      tokens: user.fcmTokens,
      notification: { title, body: message },
    });
    return true;
  } catch (err) {
    console.warn('FCM push notification skipped:', err.message);
    return false;
  }
};

/**
 * Create in-app notification and optionally dispatch email & push.
 * Uses dedupeKey to prevent duplicate scheduled reminders.
 */
const notifyUser = async ({
  userId,
  title,
  message,
  notificationType = 'System',
  relatedId = null,
  relatedModel = '',
  dedupeKey = undefined,
  sendEmail = true,
  emailSubject = null,
}) => {
  try {
    const payload = {
      userId,
      title,
      message,
      notificationType,
      relatedId,
      relatedModel,
      scheduledAt: new Date(),
      sentAt: new Date(),
    };
    if (dedupeKey) payload.dedupeKey = dedupeKey;

    let notification;
    try {
      notification = await Notification.create(payload);
    } catch (err) {
      // Duplicate dedupeKey means reminder already dispatched
      if (err.code === 11000) {
        return null;
      }
      throw err;
    }

    const user = await User.findById(userId).select('email fullName fcmTokens');
    if (user) {
      let emailSent = false;
      if (sendEmail && user.email) {
        emailSent = await sendEmailNotification({
          to: user.email,
          subject: emailSubject || `[PawBridge] ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
              <h2 style="color: #16a34a; margin-top: 0;">PawBridge Pet Adoption & Care</h2>
              <p>Hi ${user.fullName},</p>
              <h3 style="color: #111827;">${title}</h3>
              <p style="color: #374151; line-height: 1.6;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 12px; color: #6b7280;">You can view all updates in your PawBridge Notification Center.</p>
            </div>
          `,
        });
      }

      const pushSent = await sendPushNotification(user, { title, message });
      if (emailSent || pushSent) {
        notification.emailSent = emailSent;
        notification.pushSent = pushSent;
        await notification.save();
      }
    }

    return notification;
  } catch (err) {
    console.error('notifyUser error:', err.message);
    return null;
  }
};

module.exports = {
  notifyUser,
  sendEmailNotification,
};
