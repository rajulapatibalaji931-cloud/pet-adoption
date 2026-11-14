require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { startCareReminderJob } = require('./jobs/careReminderJob');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    initFirebase();
    startCareReminderJob();

    const server = app.listen(PORT, () => {
      console.log(`PawBridge API server running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err.message);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
