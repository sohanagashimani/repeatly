-- Function to notify when a job becomes ready
CREATE OR REPLACE FUNCTION notify_job_ready()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if job just became due
  IF (NEW."nextRun" <= NOW() AND NEW.enabled = true AND NEW.processing = false) THEN
    -- Only notify if this is a new due job or status changed
    IF (OLD IS NULL OR 
        OLD."nextRun" > NOW() OR 
        OLD.enabled = false OR 
        OLD.processing = true) THEN
      
      -- Send notification with job ID
      PERFORM pg_notify('job_ready', NEW.id::text);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on job updates and inserts
CREATE TRIGGER job_ready_trigger
  AFTER INSERT OR UPDATE ON "Job"
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_ready();

-- Function to check for due jobs (fallback mechanism)
CREATE OR REPLACE FUNCTION check_due_jobs()
RETURNS void AS $$
BEGIN
  -- Find jobs that are due but not being processed
  PERFORM pg_notify('job_ready', id::text)
  FROM "Job" 
  WHERE "nextRun" <= NOW() 
    AND enabled = true 
    AND processing = false;
END;
$$ LANGUAGE plpgsql;

-- Add processing field to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS processing BOOLEAN DEFAULT false; 