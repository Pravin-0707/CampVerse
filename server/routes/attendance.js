import express from "express";
import { Attendance } from "../models/Attendance.js";
import { Classroom } from "../models/Classroom.js";
import { Building } from "../models/Building.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

const router = express.Router();

// GET /api/attendance - List recent attendance records
router.get("/", requireAuth, async (req, res) => {
  try {
    const records = await Attendance.find().sort({ createdAt: -1 }).limit(50);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendance - Manual attendance entry by Admin/Staff
router.post("/", requireAuth, requireStaff, async (req, res) => {
  try {
    const { classroomCode, presentCount, subject } = req.body;

    if (!classroomCode || presentCount === undefined) {
      return res.status(400).json({ message: "Classroom code and present count are required" });
    }

    const classroom = await Classroom.findOne({ code: classroomCode });
    if (!classroom) {
      return res.status(404).json({ message: `Classroom ${classroomCode} not found` });
    }

    const capacity = Math.max(1, Number(classroom.capacity) || 1);
    const present = Math.max(0, Math.min(Number(presentCount), capacity));
    const occupancyPercentage = Math.round((present / capacity) * 100);
    const status = present > 0 ? "In Session" : "Free";

    // 1. Update Classroom occupancy and status
    classroom.occupancy = present;
    classroom.status = status;
    if (subject) classroom.currentClass = subject;
    await classroom.save();

    // 2. Recalculate Building occupancy based on all classrooms in that building
    const buildingClassrooms = await Classroom.find({ building: classroom.building });
    let totalOccPercentage = 0;
    if (buildingClassrooms.length > 0) {
      const sum = buildingClassrooms.reduce((acc, c) => {
        const cCapacity = Math.max(1, Number(c.capacity) || 1);
        const cOcc = Math.round((c.occupancy / cCapacity) * 100);
        return acc + cOcc;
      }, 0);
      totalOccPercentage = Math.round(sum / buildingClassrooms.length);
    }

    // Update Building occupancy in DB
    await Building.findOneAndUpdate(
      { name: classroom.building },
      { occupancy: totalOccPercentage },
      { new: true },
    );

    // 3. Create Attendance log record
    const record = await Attendance.create({
      classroomCode: classroom.code,
      buildingName: classroom.building,
      subject: subject || classroom.currentClass || "Lecture",
      totalCapacity: capacity,
      presentCount: present,
      occupancyPercentage,
      status,
      takenBy: req.user?.name || "Admin",
    });

    res.status(201).json({
      message: `Attendance recorded for ${classroom.code}. Occupancy updated to ${occupancyPercentage}%.`,
      record,
      updatedClassroom: classroom,
      buildingOccupancy: totalOccPercentage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
