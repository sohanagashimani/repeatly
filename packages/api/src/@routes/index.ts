import { Router } from "express";
import { v1Router } from "./v1";
import healthRoutes from "./health";

const router = Router();

router.use("/health", healthRoutes);

router.use("/v1", v1Router);

export default router;
