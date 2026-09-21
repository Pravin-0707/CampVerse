import { createMongoModel } from "../db/model-factory.js";

export const Event = createMongoModel({
  modelName: "Event",
  tableName: "events",
  requiredFields: ["name", "date"],
  defaults: {
    type: "Seminar",
    location: "Auditorium",
    seats: 100,
    visibility: "public",
  },
});
