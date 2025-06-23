import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root directory
config({ path: resolve(__dirname, "../.env") });

// Import custom types
import "./@types";

import "./createLocalServer";
