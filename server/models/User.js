import { createMongoModel } from "../db/model-factory.js";

export const User = createMongoModel({
  modelName: "User",
  tableName: "users",
  requiredFields: ["name", "email", "passwordHash"],
  uniqueFields: ["email"],
  defaults: {
    role: "student",
    status: "active",
    campus: "Main Campus",
    language: "English",
    notifications: {
      announcements: true,
      classAlerts: true,
      emergencyAlerts: true,
    },
  },
});
