import { Router } from "express";
import { createApiKey } from "./controllers/createApiKey.controller";
import { getApiKeys } from "./controllers/getApiKeys.controller";
import { deleteApiKey } from "./controllers/deleteApiKey.controller";
import { getApiKeyStatus } from "./controllers/getApiKeyStatus.controller";
import { authMiddleware } from "../../../@middlewares/auth";

const router = Router();

// API Key management uses Firebase auth (dashboard access)
// Users authenticate with Firebase tokens to manage their API keys
router.use(authMiddleware);

// API Key routes
router.post("/", createApiKey);
router.get("/", getApiKeys);
router.get("/:id/status", getApiKeyStatus); // Check key creation status and get actual key
router.delete("/:id", deleteApiKey);

export { router as keysRoutes };
