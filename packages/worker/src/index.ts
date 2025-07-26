import dotenv from "dotenv";

dotenv.config();
import express from "express";
import { JobWorker } from "./jobWorker";

console.log(
  "🔍 DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ Found" : "❌ Missing"
);

const worker = new JobWorker();
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "repeatly-worker",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Repeatly Worker",
    status: "running",
  });
});

async function main() {
  console.log("🚀 Starting Repeatly Partitioned Worker...");

  const server = app.listen(PORT, () => {
    console.log(`📡 Worker HTTP server listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log("HTTP server closed");
    });
    await worker.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await worker.start();
    console.log("✅ Worker started successfully");

    setInterval(
      () => {
        console.log(
          "📊 Partitioned Worker Status: Running and waiting for jobs..."
        );
      },
      5 * 60 * 1000
    );
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
