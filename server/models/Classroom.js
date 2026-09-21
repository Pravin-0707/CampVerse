import { createMongoModel } from "../db/model-factory.js";

export const Classroom = createMongoModel({
  modelName: "Classroom",
  tableName: "classrooms",
  requiredFields: ["code", "building"],
  defaults: {
    floor: 1,
    capacity: 60,
    occupancy: 0,
    status: "Free",
    facilities: [],
    exitDistance: "15 m",
    washroom: "10 m",
    lift: "20 m",
  },
});
