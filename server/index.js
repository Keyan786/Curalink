// Load environment variables FIRST before anything else
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

// Guard: abort if critical env vars are missing
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing in .env — server cannot start.');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing in .env — server cannot start.');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const researchRoutes = require('./routes/research');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/research', researchRoutes);

// Serve built frontend
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get('*splat', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
