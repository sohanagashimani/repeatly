/*
  Warnings:

  - Made the column `scheduled_job_hour` on table `job_executions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "job_executions" DROP CONSTRAINT "job_executions_job_id_fkey";

-- DropIndex
DROP INDEX "scheduled_jobs_type_status_idx";

-- AlterTable
ALTER TABLE "job_executions" ALTER COLUMN "scheduled_job_hour" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Job_enabled_idx" ON "Job"("enabled");

-- RenameForeignKey
ALTER TABLE "job_executions" RENAME CONSTRAINT "job_executions_scheduled_job_id_fkey" TO "job_executions_scheduled_job_id_scheduled_job_hour_fkey";

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "job_executions_scheduled_job_id_hour_idx" RENAME TO "job_executions_scheduled_job_id_scheduled_job_hour_idx";

-- RenameIndex
ALTER INDEX "scheduled_jobs_hour_status_idx" RENAME TO "scheduled_jobs_scheduled_hour_status_idx";
