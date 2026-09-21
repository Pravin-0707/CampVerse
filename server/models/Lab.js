import { createMongoModel } from "../db/model-factory.js";

export const Lab = createMongoModel({
  modelName: "Lab",
  tableName: "labs",
  requiredFields: ["name", "building"],
  defaults: {
    floor: 1,
    status: "Available",
    capacity: 30,
    occupancy: 0,
  },
});
