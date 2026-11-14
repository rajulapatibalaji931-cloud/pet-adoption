const admin = require('firebase-admin');

let fcmInitialized = false;

const initFirebase = () => {
  if (fcmInitialized) return admin;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      fcmInitialized = true;
      console.log('Firebase Cloud Messaging initialized');
    } catch (err) {
      console.warn('Firebase initialization skipped:', err.message);
    }
  }
  return admin;
};

const isFcmEnabled = () => fcmInitialized;

module.exports = { initFirebase, isFcmEnabled, admin };
