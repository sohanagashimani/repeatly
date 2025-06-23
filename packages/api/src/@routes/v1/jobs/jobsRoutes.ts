import { Router } from "express";
import { validator } from "../../../@middlewares";
import { addJob } from "./controllers/addJob.controller";
import { getJobs } from "./controllers/getJobs.controller";
import { getJob } from "./controllers/getJob.controller";
import { updateJob } from "./controllers/updateJob.controller";
import { deleteJob } from "./controllers/deleteJob.controller";
import { triggerJob } from "./controllers/triggerJob.controller";
import addJobSchema from "./schemas/addJobSchema.schema";
import updateJobSchema from "./schemas/updateJobSchema.schema";

const router = Router();

// List all jobs
router.get("/getJobs", getJobs);

// Get a single job
router.get("/getJob/:id", getJob);

// Create a new job
router.post("/addJob", validator(addJobSchema), addJob);

// Update a job
router.put("/updateJob/:id", validator(updateJobSchema), updateJob);

// Partial update a job (for status toggle, etc.)
router.patch("/updateJob/:id", validator(updateJobSchema), updateJob);

// Delete a job
router.delete("/deleteJob/:id", deleteJob);

// Job actions
router.post("/triggerJob/:id", triggerJob);

export default router;
