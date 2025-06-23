-- CreateTable: ScheduledJob (without partitioning for now)
CREATE TABLE "scheduled_jobs" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "job_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JobExecution
CREATE TABLE "job_executions" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "scheduled_job_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "response" JSONB,
    "error" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ScheduledJob indexes
CREATE INDEX "scheduled_jobs_scheduled_at_status_idx" ON "scheduled_jobs"("scheduled_at", "status");
CREATE INDEX "scheduled_jobs_job_id_idx" ON "scheduled_jobs"("job_id");

-- CreateIndex: JobExecution indexes
CREATE INDEX "job_executions_job_id_idx" ON "job_executions"("job_id");
CREATE INDEX "job_executions_scheduled_job_id_idx" ON "job_executions"("scheduled_job_id");
CREATE INDEX "job_executions_status_idx" ON "job_executions"("status");

-- AddForeignKey: ScheduledJob -> Job
ALTER TABLE "scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: JobExecution -> Job  
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: JobExecution -> ScheduledJob
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_scheduled_job_id_fkey" FOREIGN KEY ("scheduled_job_id") REFERENCES "scheduled_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex: Remove old job indexes
DROP INDEX IF EXISTS "Job_enabled_nextRun_idx";
DROP INDEX IF EXISTS "Job_processing_idx";

-- Drop old triggers and functions
DROP TRIGGER IF EXISTS job_ready_trigger ON "Job";
DROP FUNCTION IF EXISTS notify_job_ready();
DROP FUNCTION IF EXISTS check_due_jobs();

-- AlterTable: Remove old columns from Job table
ALTER TABLE "Job" DROP COLUMN IF EXISTS "nextRun";
ALTER TABLE "Job" DROP COLUMN IF EXISTS "lastRun"; 
ALTER TABLE "Job" DROP COLUMN IF EXISTS "processing"; 