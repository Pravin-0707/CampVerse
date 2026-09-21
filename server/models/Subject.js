import { createMongoModel } from "../db/model-factory.js";

export const Subject = createMongoModel({
  modelName: "Subject",
  tableName: "subjects",
  requiredFields: ["code", "name", "departmentId"],
  uniqueFields: ["code"],
  defaults: { credits: 3, status: "active" },
});
