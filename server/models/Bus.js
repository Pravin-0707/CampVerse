import { createMongoModel } from "../db/model-factory.js";

export const Bus = createMongoModel({
  modelName: "Bus",
  tableName: "buses",
  requiredFields: ["code", "route"],
  defaults: {
    eta: "5 min",
    driver: "Unassigned",
    status: "On route",
  },
});
