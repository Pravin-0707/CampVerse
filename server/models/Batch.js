import { createMongoModel } from "../db/model-factory.js";

export const Batch = createMongoModel({
  modelName: "Batch",
  tableName: "batches",
  requiredFields: ["name", "academicYear"],
  uniqueFields: ["name"],
  defaults: { status: "active" },
});
