import { createMongoModel } from "../db/model-factory.js";

export const Timetable = createMongoModel({
  modelName: "Timetable",
  tableName: "timetables",
  requiredFields: [
    "classSectionId",
    "subjectId",
    "professorId",
    "classroomCode",
    "dayOfWeek",
    "period",
  ],
  defaults: { status: "active" },
});
