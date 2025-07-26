/*
  Warnings:

  - A unique constraint covering the columns `[job_id,scheduled_at]` on the table `scheduled_jobs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "scheduled_jobs_job_id_scheduled_at_scheduled_hour_key" ON "scheduled_jobs"("job_id", "scheduled_at", "scheduled_hour");
