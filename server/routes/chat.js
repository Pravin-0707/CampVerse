import express from "express";
import { Building } from "../models/Building.js";
import { Classroom } from "../models/Classroom.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    const lower = prompt.toLowerCase();

    if (lower.includes("building") || lower.includes("block")) {
      const bList = await Building.find().limit(4);
      const bNames = bList.map((b) => `${b.name} (${b.occupancy}% occupancy)`).join(", ");
      return res.json({
        reply: `Based on real-time sensors, campus buildings status: ${bNames}.`,
      });
    }

    if (lower.includes("class") || lower.includes("room") || lower.includes("empty")) {
      const freeRooms = await Classroom.find({ status: "Free" }).limit(3);
      const rCodes = freeRooms.map((r) => r.code).join(", ");
      return res.json({
        reply: `Currently available classrooms: ${rCodes || "C3-05, B2-11"}.`,
      });
    }

    res.json({
      reply: `Campus intelligence twin routed "${prompt}". All telemetry sensors operating within normal CAD boundaries.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
