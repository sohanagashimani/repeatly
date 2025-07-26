import dotenv from "dotenv";

dotenv.config();
import express from "express";
import { PartitionedScheduler } from "./partitionedScheduler";
import { prisma } from "@repeatly/database";

const scheduler = new PartitionedScheduler();
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "repeatly-scheduler",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scheduled_jobs'
      ) as exists
    `;

    const exists = (tableExists as any)[0]?.exists;

    res.status(200).json({
      status: "healthy",
      database: "connected",
      scheduled_jobs_table: exists ? "exists" : "missing",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      database: "connection_failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Repeatly Scheduler",
    status: "running",
  });
});

async function main() {
  console.log("🚀 Starting Repeatly Partitioned Scheduler...");

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 Scheduler HTTP server listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log("HTTP server closed");
    });
    await scheduler.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await scheduler.start();
    console.log("✅ Scheduler started successfully");

    setInterval(
      async () => {
        try {
          const status = await scheduler.getStatus();
          console.log("📊 Scheduler Status:", JSON.stringify(status, null, 2));
        } catch (error) {
          console.error("❌ Failed to get scheduler status:", error);
        }
      },
      5 * 60 * 1000
    );
  } catch (error) {
    console.error("❌ Failed to start scheduler:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
