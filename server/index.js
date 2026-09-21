import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDatabase, getDatabaseUri } from "./db/mongo.js";

import authRoutes from "./routes/auth.js";
import buildingRoutes from "./routes/buildings.js";
import classroomRoutes from "./routes/classrooms.js";
import labRoutes from "./routes/labs.js";
import departmentRoutes from "./routes/departments.js";
import eventRoutes from "./routes/events.js";
import announcementRoutes from "./routes/announcements.js";
import analyticsRoutes from "./routes/analytics.js";
import chatRoutes from "./routes/chat.js";
import attendanceRoutes from "./routes/attendance.js";
import academicRoutes from "./routes/academics.js";

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (
  process.env.CLIENT_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/academics", academicRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server and connect DB
async function start() {
  try {
    await connectDatabase();
    console.log(`Connected to MongoDB successfully: ${getDatabaseUri()}`);

    app.listen(PORT, () => {
      console.log(`Smart Cadence Express API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start Express server: unable to connect to MongoDB.");
    console.error("Check that MongoDB is running and that MONGODB_URI is correct.");
    console.error(err);
    process.exit(1);
  }
}

start();
