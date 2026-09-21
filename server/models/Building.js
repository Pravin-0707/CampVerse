import { createMongoModel } from "../db/model-factory.js";

export const Building = createMongoModel({
  modelName: "Building",
  tableName: "buildings",
  requiredFields: ["code", "name"],
  defaults: {
    departments: [],
    floors: 4,
    occupancy: 50,
    status: "Open",
  },
});
