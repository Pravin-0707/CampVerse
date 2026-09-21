import { createMongoModel } from "../db/model-factory.js";

export const Announcement = createMongoModel({
  modelName: "Announcement",
  tableName: "announcements",
  requiredFields: ["title"],
  defaults: {
    tag: "General",
    time: "Just now",
  },
});
