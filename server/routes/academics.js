import express from "express";
import { requireAuth, requireAdmin, requireRoles } from "../middleware/auth.js";
import { Batch } from "../models/Batch.js";
import { ClassSection } from "../models/ClassSection.js";
import { Subject } from "../models/Subject.js";
import { Timetable } from "../models/Timetable.js";

const router = express.Router();
const resources = {
  batches: Batch,
  sections: ClassSection,
  subjects: Subject,
  timetables: Timetable,
};

router.use(requireAuth);

router.get("/overview", async (_req, res) => {
  try {
    const [batches, sections, subjects, timetables] = await Promise.all([
      Batch.find({ status: { $ne: "archived" } }).sort({ academicYear: -1, name: 1 }),
      ClassSection.find({ status: { $ne: "archived" } }).sort({ name: 1 }),
      Subject.find({ status: { $ne: "archived" } }).sort({ code: 1 }),
      Timetable.find({ status: { $ne: "archived" } }).sort({ dayOfWeek: 1, period: 1 }),
    ]);
    res.json({ batches, sections, subjects, timetables });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:resource", requireRoles("admin"), async (req, res) => {
  try {
    const Model = resources[req.params.resource];
    if (!Model) return res.status(404).json({ message: "Academic resource not found" });
    const item = await Model.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:resource/:id", requireRoles("admin"), async (req, res) => {
  try {
    const Model = resources[req.params.resource];
    if (!Model) return res.status(404).json({ message: "Academic resource not found" });
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: "Academic record not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:resource/:id", requireAdmin, async (req, res) => {
  try {
    const Model = resources[req.params.resource];
    if (!Model) return res.status(404).json({ message: "Academic resource not found" });
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      { status: "archived" },
      { new: true },
    );
    if (!item) return res.status(404).json({ message: "Academic record not found" });
    res.json({ message: "Academic record archived", item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
