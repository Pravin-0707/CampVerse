import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { connectDatabase } from '../server/db/mongo.js';

import authRoutes from '../server/routes/auth.js';
import buildingRoutes from '../server/routes/buildings.js';
import classroomRoutes from '../server/routes/classrooms.js';
import labRoutes from '../server/routes/labs.js';
import departmentRoutes from '../server/routes/departments.js';
import eventRoutes from '../server/routes/events.js';
import announcementRoutes from '../server/routes/announcements.js';
import analyticsRoutes from '../server/routes/analytics.js';
import chatRoutes from '../server/routes/chat.js';
import attendanceRoutes from '../server/routes/attendance.js';
import academicRoutes from '../server/routes/academics.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Connect to DB if MONGODB_URI is configured, otherwise continue in standalone mode
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI) {
    try {
      await connectDatabase();
    } catch (err) {
      console.warn("MongoDB connection warning:", err.message);
    }
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academics', academicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
