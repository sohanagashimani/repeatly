-- Add CASCADE DELETE to job_executions.job_id foreign key
-- This allows job executions to be automatically deleted when a job is deleted

-- Drop the existing foreign key constraint
ALTER TABLE "job_executions" DROP CONSTRAINT "job_executions_job_id_fkey";

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE "job_executions" 
ADD CONSTRAINT "job_executions_job_id_fkey" 
FOREIGN KEY ("job_id") REFERENCES "Job"("id") 
ON DELETE CASCADE; 