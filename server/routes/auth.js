import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "smart-cadence-secret-key-2026";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "student",
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus: user.campus,
        notifications: user.notifications,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/users - privileged account provisioning. Public registration never grants roles.
router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role = "student" } = req.body;
    if (!name || !email || !password || !["admin", "professor", "student"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Name, email, password, and a valid role are required" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role,
    });
    res
      .status(201)
      .json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        campus: user.campus,
        notifications: user.notifications,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile (or /api/auth/settings)
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "campus",
      "language",
      "role",
      "department",
      "phone",
      "studentId",
      "appearance",
      "notifications",
      "accessibility",
      "navigation",
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true },
    ).select("-passwordHash");

    res.json({ user: updatedUser, message: "Settings and profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Alias for settings
router.put("/settings", requireAuth, async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "campus",
      "language",
      "role",
      "department",
      "phone",
      "studentId",
      "appearance",
      "notifications",
      "accessibility",
      "navigation",
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true },
    ).select("-passwordHash");

    res.json({ user: updatedUser, message: "Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
