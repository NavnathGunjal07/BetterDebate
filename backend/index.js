// Must be the very first import — validates all env vars before any other code runs
const env = require('./config/env');

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const debateRoutes = require('./routes/debates');
const argumentRoutes = require('./routes/arguments');
const summaryRoutes = require('./routes/summary');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/debates/:id/arguments', argumentRoutes);
app.use('/api/debates/:id/summary', summaryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.PORT, () => {
  console.log(`🎯 BetterDebate backend running on http://localhost:${env.PORT}`);
});
