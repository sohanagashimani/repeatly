import { config } from "dotenv";
import { writeFileSync } from "fs";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env") });

import baseConfig from "./openapi/config/baseConfig";
import { generateApiSpecPaths } from "./openapi/helpers";
import { jobRoutes } from "./openapi/routes/jobRoutes";

const apiVersion = "v1";

const routesWithPathAndMethod = jobRoutes;

const v1Paths = generateApiSpecPaths({
  routesWithPathAndMethod,
  apiVersion,
});

const apiSpec = { ...baseConfig, paths: v1Paths };

const outputPath = resolve(__dirname, "../open-api.json");
writeFileSync(outputPath, JSON.stringify(apiSpec, null, 2));

console.log("✅ OpenAPI specification generated at:", outputPath);
console.log(`📋 Generated ${Object.keys(v1Paths).length} API paths`);

export default apiSpec;
