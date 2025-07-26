import { Router, Request, Response } from "express";
import { checkDatabaseConnection } from "@repeatly/database";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const dbStatus = await checkDatabaseConnection();

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "repeatly-api",
      version: "1.0.0",
      database: dbStatus ? "connected" : "disconnected",
      uptime: process.uptime(),
    };

    const statusCode = dbStatus ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error("Health check error:", error);

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "repeatly-api",
      error: "Service unavailable",
      uptime: process.uptime(),
    });
  }
});

export default router;
