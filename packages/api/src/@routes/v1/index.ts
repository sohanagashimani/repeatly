import { Router } from "express";
import jobsRoutes from "./jobs/jobsRoutes";
import { usersRoutes } from "./users/usersRoutes";
import { keysRoutes } from "./keys/keysRoutes";

const router = Router();

router.use("/jobs", jobsRoutes);
router.use("/users", usersRoutes);
router.use("/keys", keysRoutes);

export { router as v1Router };
