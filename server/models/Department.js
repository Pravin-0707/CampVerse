import { createMongoModel } from "../db/model-factory.js";

export const Department = createMongoModel({
  modelName: "Department",
  tableName: "departments",
  requiredFields: ["name", "head"],
  defaults: {
    facultyCount: 20,
    studentCount: 300,
    established: "1998",
  },
});
