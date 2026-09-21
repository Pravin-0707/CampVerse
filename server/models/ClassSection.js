import { createMongoModel } from "../db/model-factory.js";

export const ClassSection = createMongoModel({
  modelName: "ClassSection",
  tableName: "class_sections",
  requiredFields: ["name", "departmentId", "batchId"],
  defaults: { year: 1, status: "active" },
});
