-- Drop the current messy partitioned table
DROP TABLE IF EXISTS "scheduled_jobs" CASCADE;

-- Recreate with proper hourly partitioning using a dedicated hour column
CREATE TABLE "scheduled_jobs" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "scheduled_hour" INTEGER NOT NULL, -- Key insight: dedicated hour column (0-23)
    "status" TEXT NOT NULL DEFAULT 'pending',
    "job_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id", "scheduled_hour") -- Now works because scheduled_hour is a column, not expression
) PARTITION BY RANGE ("scheduled_hour");

-- Create 24 hourly partitions (0-23) - THIS WILL WORK NOW!
CREATE TABLE "scheduled_jobs_00" PARTITION OF "scheduled_jobs" FOR VALUES FROM (0) TO (1);
CREATE TABLE "scheduled_jobs_01" PARTITION OF "scheduled_jobs" FOR VALUES FROM (1) TO (2);
CREATE TABLE "scheduled_jobs_02" PARTITION OF "scheduled_jobs" FOR VALUES FROM (2) TO (3);
CREATE TABLE "scheduled_jobs_03" PARTITION OF "scheduled_jobs" FOR VALUES FROM (3) TO (4);
CREATE TABLE "scheduled_jobs_04" PARTITION OF "scheduled_jobs" FOR VALUES FROM (4) TO (5);
CREATE TABLE "scheduled_jobs_05" PARTITION OF "scheduled_jobs" FOR VALUES FROM (5) TO (6);
CREATE TABLE "scheduled_jobs_06" PARTITION OF "scheduled_jobs" FOR VALUES FROM (6) TO (7);
CREATE TABLE "scheduled_jobs_07" PARTITION OF "scheduled_jobs" FOR VALUES FROM (7) TO (8);
CREATE TABLE "scheduled_jobs_08" PARTITION OF "scheduled_jobs" FOR VALUES FROM (8) TO (9);
CREATE TABLE "scheduled_jobs_09" PARTITION OF "scheduled_jobs" FOR VALUES FROM (9) TO (10);
CREATE TABLE "scheduled_jobs_10" PARTITION OF "scheduled_jobs" FOR VALUES FROM (10) TO (11);
CREATE TABLE "scheduled_jobs_11" PARTITION OF "scheduled_jobs" FOR VALUES FROM (11) TO (12);
CREATE TABLE "scheduled_jobs_12" PARTITION OF "scheduled_jobs" FOR VALUES FROM (12) TO (13);
CREATE TABLE "scheduled_jobs_13" PARTITION OF "scheduled_jobs" FOR VALUES FROM (13) TO (14);
CREATE TABLE "scheduled_jobs_14" PARTITION OF "scheduled_jobs" FOR VALUES FROM (14) TO (15);
CREATE TABLE "scheduled_jobs_15" PARTITION OF "scheduled_jobs" FOR VALUES FROM (15) TO (16);
CREATE TABLE "scheduled_jobs_16" PARTITION OF "scheduled_jobs" FOR VALUES FROM (16) TO (17);
CREATE TABLE "scheduled_jobs_17" PARTITION OF "scheduled_jobs" FOR VALUES FROM (17) TO (18);
CREATE TABLE "scheduled_jobs_18" PARTITION OF "scheduled_jobs" FOR VALUES FROM (18) TO (19);
CREATE TABLE "scheduled_jobs_19" PARTITION OF "scheduled_jobs" FOR VALUES FROM (19) TO (20);
CREATE TABLE "scheduled_jobs_20" PARTITION OF "scheduled_jobs" FOR VALUES FROM (20) TO (21);
CREATE TABLE "scheduled_jobs_21" PARTITION OF "scheduled_jobs" FOR VALUES FROM (21) TO (22);
CREATE TABLE "scheduled_jobs_22" PARTITION OF "scheduled_jobs" FOR VALUES FROM (22) TO (23);
CREATE TABLE "scheduled_jobs_23" PARTITION OF "scheduled_jobs" FOR VALUES FROM (23) TO (24);

-- Create indexes (inherited by all partitions)
CREATE INDEX "scheduled_jobs_scheduled_at_status_idx" ON "scheduled_jobs"("scheduled_at", "status");
CREATE INDEX "scheduled_jobs_job_id_idx" ON "scheduled_jobs"("job_id");
CREATE INDEX "scheduled_jobs_hour_status_idx" ON "scheduled_jobs"("scheduled_hour", "status");

-- Add foreign key constraints
ALTER TABLE "scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update job_executions to reference the new composite key
ALTER TABLE "job_executions" DROP COLUMN IF EXISTS "scheduled_job_scheduled_at";
ALTER TABLE "job_executions" ADD COLUMN "scheduled_job_hour" INTEGER;

-- Fix foreign key for job_executions
ALTER TABLE "job_executions" DROP CONSTRAINT IF EXISTS "job_executions_scheduled_job_id_fkey";
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_scheduled_job_id_fkey" 
FOREIGN KEY ("scheduled_job_id", "scheduled_job_hour") REFERENCES "scheduled_jobs"("id", "scheduled_hour") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update index for job_executions
DROP INDEX IF EXISTS "job_executions_scheduled_job_id_idx";
CREATE INDEX "job_executions_scheduled_job_id_hour_idx" ON "job_executions"("scheduled_job_id", "scheduled_job_hour"); 