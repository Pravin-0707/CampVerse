import mongoose from "mongoose";

function buildSchemaDefinition(requiredFields = [], defaults = {}, uniqueFields = []) {
  const fields = {};
  const fieldNames = new Set([...requiredFields, ...Object.keys(defaults), ...uniqueFields]);

  for (const fieldName of fieldNames) {
    fields[fieldName] = {
      type: mongoose.Schema.Types.Mixed,
      required: requiredFields.includes(fieldName),
    };

    if (defaults[fieldName] !== undefined) {
      fields[fieldName].default = defaults[fieldName];
    }

    if (uniqueFields.includes(fieldName)) {
      fields[fieldName].trim = typeof defaults[fieldName] === "string";
    }
  }

  return fields;
}

export function createMongoModel({
  modelName,
  tableName,
  requiredFields = [],
  defaults = {},
  uniqueFields = [],
}) {
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  const schema = new mongoose.Schema(
    buildSchemaDefinition(requiredFields, defaults, uniqueFields),
    {
      collection: tableName,
      strict: false,
      timestamps: true,
      toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (_doc, ret) => {
          ret.id = ret._id.toString();
          return ret;
        },
      },
      toObject: {
        virtuals: true,
        versionKey: false,
        transform: (_doc, ret) => {
          ret.id = ret._id.toString();
          return ret;
        },
      },
    },
  );

  if (uniqueFields.length > 0) {
    schema.index(
      uniqueFields.reduce((index, field) => {
        index[field] = 1;
        return index;
      }, {}),
      { unique: true },
    );
  }

  return mongoose.model(modelName, schema);
}
