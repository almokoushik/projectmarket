require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists (skip on Vercel — read-only filesystem)
const uploadsDir = path.join(__dirname, '../uploads');
if (process.env.NODE_ENV !== 'production') {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create uploads dir:', e.message);
  }
}

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
// Serve uploads locally only (Vercel filesystem is read-only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(uploadsDir));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/submissions', require('./routes/submissions'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Connect DB and start
const PORT = process.env.PORT || 5000;

// Cache connection across serverless invocations
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ProjectMarket');
  isConnected = true;
  console.log('MongoDB connected');
};

if (process.env.NODE_ENV !== 'production') {
  // Local development: start the server normally
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
      console.error('DB connection failed:', err);
      process.exit(1);
    });
} else {
  // Vercel serverless: connect on cold start, export handler
  connectDB().catch(console.error);
}

module.exports = app;
