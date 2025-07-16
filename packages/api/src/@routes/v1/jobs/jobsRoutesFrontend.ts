import { Router } from "express";
import { validator, authMiddleware } from "../../../@middlewares";
import { addJob } from "./controllers/addJob.controller";
import { getJobs } from "./controllers/getJobs.controller";
import { getJob } from "./controllers/getJob.controller";
import { updateJob } from "./controllers/updateJob.controller";
import { deleteJob } from "./controllers/deleteJob.controller";
import { triggerJob } from "./controllers/triggerJob.controller";
import { getJobExecutions } from "./controllers/getJobExecutions.controller";
import { getJobExecutionDetails } from "./controllers/getJobExecutionDetails.controller";
import { getJobExecutionStats } from "./controllers/getJobExecutionStats.controller";
import { getJobRunningExecutions } from "./controllers/getJobRunningExecutions.controller";
import { getDashboardStats } from "./controllers/getDashboardStats.controller";
import addJobSchema from "./schemas/addJobSchema.schema";
import updateJobSchema from "./schemas/updateJobSchema.schema";

const router = Router();

// Apply auth middleware for frontend requests
router.use(authMiddleware);

// Dashboard statistics
router.get("/dashboard/stats", getDashboardStats);

// List all jobs
router.get("/getJobs", getJobs);

// Get a single job
router.get("/getJob/:id", getJob);

// Create a new job
router.post("/addJob", validator(addJobSchema), addJob);

// Update a job
router.put("/updateJob/:id", validator(updateJobSchema), updateJob);

// Partial update a job (for status toggle, etc.)
router.patch("/updateJob/:id", updateJob);

// Delete a job
router.delete("/deleteJob/:id", deleteJob);

// Job actions
router.post("/triggerJob/:id", triggerJob);

// Job execution history endpoints
router.get("/:jobId/executions", getJobExecutions);
router.get("/:jobId/executions/stats", getJobExecutionStats);
router.get("/:jobId/executions/running", getJobRunningExecutions);
router.get("/:jobId/executions/:executionId", getJobExecutionDetails);

export default router;
