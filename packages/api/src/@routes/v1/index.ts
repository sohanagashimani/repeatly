import { Router } from "express";
import jobsRoutes from "./jobs/jobsRoutes";
import jobsRoutesFrontend from "./jobs/jobsRoutesFrontend";
import { usersRoutes } from "./users/usersRoutes";
import { keysRoutes } from "./keys/keysRoutes";
import { keysRoutesFrontend } from "./keys/keysRoutesFrontend";
import { gatewayAuthMiddleware } from "../../@middlewares";

const router = Router();

router.use("/jobs", jobsRoutesFrontend);
router.use("/users", usersRoutes);
router.use("/keys", keysRoutesFrontend);

router.use("/gateway/jobs", gatewayAuthMiddleware, jobsRoutes);
router.use("/gateway/keys", keysRoutes);

export { router as v1Router };
