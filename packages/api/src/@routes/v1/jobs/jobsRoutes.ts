import { Router } from "express";
import { validator, gatewayAuthMiddleware } from "../../../@middlewares";
import { addJob } from "./controllers/addJob.controller";
import { getJobs } from "./controllers/getJobs.controller";
import { getJob } from "./controllers/getJob.controller";
import { updateJob } from "./controllers/updateJob.controller";
import { deleteJob } from "./controllers/deleteJob.controller";
import addJobSchema from "./schemas/addJobSchema.schema";
import updateJobSchema from "./schemas/updateJobSchema.schema";

const router = Router();

// Apply gateway auth middleware to all routes
router.use(gatewayAuthMiddleware);

// List all jobs
router.get("/jobs/getJobs", getJobs);

// Get a single job
router.get("/jobs/getJob/:id", getJob);

// Create a new job
router.post("/jobs/addJob", validator(addJobSchema), addJob);

// Update a job
router.put("/jobs/updateJob/:id", validator(updateJobSchema), updateJob);

// Delete a job
router.delete("/jobs/deleteJob/:id", deleteJob);

export default router;
