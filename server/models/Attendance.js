import { createMongoModel } from "../db/model-factory.js";

export const Attendance = createMongoModel({
  modelName: "Attendance",
  tableName: "attendance",
  requiredFields: [
    "classroomCode",
    "buildingName",
    "totalCapacity",
    "presentCount",
    "occupancyPercentage",
  ],
  defaults: {
    subject: "General Lecture",
    status: "In Session",
    takenBy: "Admin",
    classSectionId: null,
    timetableId: null,
    sessionDate: null,
    period: null,
  },
});
