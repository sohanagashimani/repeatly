import { writeFileSync } from "fs";
import { resolve } from "path";

import baseConfig from "./config/baseConfig";
import {
  generateRoutesWithPathAndMethod,
  generateApiSpecPaths,
} from "./helpers";

import jobsRoutes from "../@routes/v1/jobs/jobsRoutes";

const apiVersion = "v1";

// Extract routes from Express router
const routesWithPathAndMethod = generateRoutesWithPathAndMethod(jobsRoutes);

// Generate OpenAPI paths
const v1Paths = generateApiSpecPaths({
  routesWithPathAndMethod,
  apiVersion,
});

// Combine base config with generated paths
const apiSpec = { ...baseConfig, paths: v1Paths };

// Write to file
const outputPath = resolve(__dirname, "../../../../open-api.json");
writeFileSync(outputPath, JSON.stringify(apiSpec, null, 2));

console.log("✅ OpenAPI specification generated at:", outputPath);
console.log(`📋 Generated ${Object.keys(v1Paths).length} API paths`);

export default apiSpec;
