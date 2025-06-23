import { config } from "dotenv";
import { resolve } from "path";
import { PartitionedScheduler } from "./partitionedScheduler";

// Load environment variables from root directory
config({ path: resolve(__dirname, "../../../.env") });

const scheduler = new PartitionedScheduler();

async function main() {
  console.log("🚀 Starting Repeatly Partitioned Scheduler...");

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}. Gracefully shutting down...`);
    await scheduler.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await scheduler.start();

    // Log status every 5 minutes
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
