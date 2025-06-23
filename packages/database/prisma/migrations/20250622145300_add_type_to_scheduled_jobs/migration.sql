-- AlterTable: Add type field to scheduled_jobs
ALTER TABLE "scheduled_jobs" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'scheduled';

-- Create index for type + status queries
CREATE INDEX "scheduled_jobs_type_status_idx" ON "scheduled_jobs"("type", "status"); 