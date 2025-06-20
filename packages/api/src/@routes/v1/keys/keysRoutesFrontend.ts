import { Router } from "express";
import { authMiddleware } from "../../../@middlewares";
import { createApiKey } from "./controllers/createApiKey.controller";
import { getApiKeys } from "./controllers/getApiKeys.controller";
import { deleteApiKey } from "./controllers/deleteApiKey.controller";
import { getApiKeyStatus } from "./controllers/getApiKeyStatus.controller";

const router = Router();

// Apply auth middleware for frontend requests
router.use(authMiddleware);

// Get all API keys for user
router.get("/", getApiKeys);

// Create new API key
router.post("/", createApiKey);

// Get API key status
router.get("/:keyId/status", getApiKeyStatus);

// Delete API key
router.delete("/:keyId", deleteApiKey);

export { router as keysRoutesFrontend };
