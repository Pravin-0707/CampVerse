import { createMongoModel } from "../db/model-factory.js";

export const EmergencyContact = createMongoModel({
  modelName: "EmergencyContact",
  tableName: "emergency_contacts",
  requiredFields: ["label", "number"],
  defaults: {
    order: 0,
  },
});
