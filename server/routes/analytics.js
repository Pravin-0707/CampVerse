import express from "express";
import { Building } from "../models/Building.js";
import { Classroom } from "../models/Classroom.js";

const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    const buildings = await Building.find();
    const classrooms = await Classroom.find();

    const totalBuildings = buildings.length;
    const totalClassrooms = classrooms.length;
    const availableRooms = classrooms.filter((c) => c.status === "Free").length;

    const totalOccupancySum = buildings.reduce((acc, b) => acc + (b.occupancy || 0), 0);
    const avgBuildingOccupancy =
      totalBuildings > 0 ? Math.round(totalOccupancySum / totalBuildings) : 0;

    const occupancyByHour = [
      { hour: "8AM", value: 22 },
      { hour: "9AM", value: 48 },
      { hour: "10AM", value: 72 },
      { hour: "11AM", value: 88 },
      { hour: "12PM", value: 76 },
      { hour: "1PM", value: 54 },
      { hour: "2PM", value: 82 },
      { hour: "3PM", value: 90 },
      { hour: "4PM", value: 68 },
      { hour: "5PM", value: 42 },
      { hour: "6PM", value: 28 },
      { hour: "7PM", value: 18 },
    ];

    const buildingUsage = buildings.map((b) => ({
      name: b.code || b.name.split(" ")[0],
      usage: b.occupancy || 0,
    }));

    const energyData = [
      { day: "Mon", kwh: 420 },
      { day: "Tue", kwh: 512 },
      { day: "Wed", kwh: 488 },
      { day: "Thu", kwh: 602 },
      { day: "Fri", kwh: 540 },
      { day: "Sat", kwh: 220 },
      { day: "Sun", kwh: 180 },
    ];

    res.json({
      peakHour: "3:00 PM",
      totalBuildings,
      totalClassrooms,
      availableRooms,
      avgBuildingOccupancy,
      energyTodayKwh: 512,
      occupancyByHour,
      buildingUsage,
      energyData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
