import { config } from "dotenv";
import { resolve } from "path";
import { JobWorker } from "./jobWorker";

// Load environment variables from root directory
config({ path: resolve(__dirname, "../../../.env") });

console.log("🔍 Loaded env from:", resolve(__dirname, "../../../.env"));
console.log(
  "🔍 DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ Found" : "❌ Missing"
);

const worker = new JobWorker();

async function main() {
  console.log("🚀 Starting Repeatly Partitioned Worker...");

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}. Gracefully shutting down...`);
    await worker.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await worker.start();

    // Log worker status every 5 minutes
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
