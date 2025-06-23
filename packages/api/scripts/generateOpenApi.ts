import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env file
config({ path: resolve(__dirname, "../../../.env") });

import "../src/openapi/generateOpenApi";

// This script will automatically run the OpenAPI generation
// Run with: npm run generate:openapi
