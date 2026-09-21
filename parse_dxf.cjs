const fs = require("fs");
const DxfParser = require("dxf-parser");

const parser = new DxfParser();

const files = [
  "./Map/clg campustopoexport-C72428/topoexport_2D_vectorial.dxf",
  "./Map/clg campustopoexport-C72428/topoexport_3D_modeling.dxf",
  "./Map/clgcampusextendedtopoexport-ADBD1A/topoexport_2D_vectorial.dxf",
  "./Map/clgcampusextendedtopoexport-ADBD1A/topoexport_3D_modeling.dxf",
];

const origError = console.error;
const origWarn = console.warn;
console.error = () => {};
console.warn = () => {};

const results = [];

files.forEach((filePath, idx) => {
  try {
    const fileText = fs.readFileSync(filePath, "utf-8");
    const parsed = parser.parseSync(fileText);
    const layers = parsed.tables?.layer?.layers ? Object.keys(parsed.tables.layer.layers) : [];
    const entityTypes = {};
    parsed.entities.forEach((e) => {
      entityTypes[e.type] = (entityTypes[e.type] || 0) + 1;
    });

    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    parsed.entities.forEach((e) => {
      const pts = [];
      if (e.vertices) pts.push(...e.vertices);
      if (e.position) pts.push(e.position);
      if (e.startPoint) pts.push(e.startPoint);
      if (e.endPoint) pts.push(e.endPoint);

      pts.forEach((p) => {
        if (p.x !== undefined && !isNaN(p.x)) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
        }
        if (p.y !== undefined && !isNaN(p.y)) {
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
        if (p.z !== undefined && !isNaN(p.z)) {
          minZ = Math.min(minZ, p.z);
          maxZ = Math.max(maxZ, p.z);
        }
      });
    });

    results.push({
      file: filePath,
      entitiesCount: parsed.entities.length,
      entityTypes,
      layers,
      bounds: { minX, maxX, minY, maxY, minZ, maxZ },
    });
  } catch (err) {
    results.push({
      file: filePath,
      error: err.message,
    });
  }
});

console.error = origError;
console.warn = origWarn;

fs.writeFileSync("dxf_analysis.json", JSON.stringify(results, null, 2));
console.log("Analysis written to dxf_analysis.json");
