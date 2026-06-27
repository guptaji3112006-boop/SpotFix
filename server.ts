import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import fs from 'fs';
import { submitIssue, getIssues, upvoteIssue, analyzeImage } from './src/server/controllers/issueController';
import { getLeaderboard, getOrCreateUser, getUserProfile } from './src/server/controllers/userController';
import { getAdminIssues, updateIssueStatus, getPredictiveInsights, getCategoryStats } from './src/server/controllers/adminController';
import { protect, isAdmin } from './src/server/middleware/authMiddleware';
import { registerUser, loginUser, forgotPassword, verifyOTP, resetPassword } from './src/server/controllers/authController';

import { getImpactStats, getImpactMetrics, getDeepDiveStats, getPredictiveInsightsPublic } from './src/server/controllers/publicController';

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"]
    }
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Environment variables
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.warn('MONGO_URI is not set in environment variables. Database features will fail if called.');
  } else {
    try {
      mongoose.set('bufferCommands', false); // Disable query buffering
      await mongoose.connect(MONGO_URI, { 
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        connectTimeoutMS: 5000 
      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }

  // --- API Routes ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Auth Routes
  app.post('/api/auth/register', registerUser);
  app.post('/api/auth/login', loginUser);
  app.post('/api/auth/forgot-password', forgotPassword);
  app.post('/api/auth/verify-otp', verifyOTP);
  app.post('/api/auth/reset-password', resetPassword);

  // User Gamification Routes
  app.post('/api/users', getOrCreateUser);
  app.get('/api/users/leaderboard', getLeaderboard);
  app.get('/api/users/profile', protect, getUserProfile);

  // Issues Routes
  app.post('/api/issues/analyze', upload.single('media'), analyzeImage);
  app.post('/api/issues', upload.single('media'), submitIssue);
  app.get('/api/issues', getIssues);
  app.post('/api/issues/:id/upvote', upvoteIssue);

  // Public Routes
  app.get('/api/public/impact-stats', getImpactStats);
  app.get('/api/public/impact-metrics', getImpactMetrics);
  app.get('/api/impact-stats/deep-dive', getDeepDiveStats);
  app.get('/api/insights/predictive', getPredictiveInsightsPublic);

  // Admin Routes
  app.get('/api/admin/issues', protect, isAdmin, getAdminIssues);
  app.patch('/api/admin/issues/:id/status', protect, isAdmin, updateIssueStatus);
  app.get('/api/admin/predictive-insights', protect, isAdmin, getPredictiveInsights);
  app.get('/api/admin/category-stats', protect, isAdmin, getCategoryStats);

  // --- Vite / SPA Fallback Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files and SPA fallback
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
