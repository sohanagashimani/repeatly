import { Router } from "express";
import { createApiKey } from "./controllers/createApiKey.controller";
import { getApiKeys } from "./controllers/getApiKeys.controller";
import { deleteApiKey } from "./controllers/deleteApiKey.controller";
import { getApiKeyStatus } from "./controllers/getApiKeyStatus.controller";
import { authMiddleware } from "../../../@middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", createApiKey);
router.get("/", getApiKeys);
router.get("/:id/status", getApiKeyStatus);
router.delete("/:id", deleteApiKey);

export { router as keysRoutes };
