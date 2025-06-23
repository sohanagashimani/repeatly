import { config } from "dotenv";
import { writeFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from root directory
config({ path: resolve(__dirname, "../.env") });

import baseConfig from "./openapi/config/baseConfig";
import { generateApiSpecPaths } from "./openapi/helpers";
import { jobRoutes } from "./openapi/routes/jobRoutes";

const apiVersion = "v1";

// Use static route definitions to avoid Express/Google Auth dependencies
const routesWithPathAndMethod = jobRoutes;

// Generate OpenAPI paths
const v1Paths = generateApiSpecPaths({
  routesWithPathAndMethod,
  apiVersion,
});

// Combine base config with generated paths
const apiSpec = { ...baseConfig, paths: v1Paths };

// Write to file - output to root directory
const outputPath = resolve(__dirname, "../open-api.json");
writeFileSync(outputPath, JSON.stringify(apiSpec, null, 2));

console.log("✅ OpenAPI specification generated at:", outputPath);
console.log(`📋 Generated ${Object.keys(v1Paths).length} API paths`);

export default apiSpec;
