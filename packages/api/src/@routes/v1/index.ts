import { Router } from "express";
import jobsRoutes from "./jobs/jobsRoutes"; // Gateway routes
import jobsRoutesFrontend from "./jobs/jobsRoutesFrontend"; // Frontend routes
import { usersRoutes } from "./users/usersRoutes";
import { keysRoutes } from "./keys/keysRoutes"; // Gateway routes
import { keysRoutesFrontend } from "./keys/keysRoutesFrontend"; // Frontend routes

const router = Router();

// Frontend routes (authenticated via Firebase Auth)
router.use("/jobs", jobsRoutesFrontend);
router.use("/users", usersRoutes);
router.use("/keys", keysRoutesFrontend);

// Gateway routes (authenticated via API keys)
router.use("/gateway/jobs", jobsRoutes);
router.use("/gateway/keys", keysRoutes);

export { router as v1Router };
