import { Router } from "express";
import { authMiddleware } from "../../../@middlewares";
import { createApiKey } from "./controllers/createApiKey.controller";
import { getApiKeys } from "./controllers/getApiKeys.controller";
import { deleteApiKey } from "./controllers/deleteApiKey.controller";
import { getApiKeyStatus } from "./controllers/getApiKeyStatus.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getApiKeys);

router.post("/", createApiKey);

router.get("/:id/status", getApiKeyStatus);

router.delete("/:id", deleteApiKey);

export { router as keysRoutesFrontend };
