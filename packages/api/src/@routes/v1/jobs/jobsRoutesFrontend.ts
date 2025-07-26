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

router.use(authMiddleware);

router.get("/dashboard/stats", getDashboardStats);

router.get("/getJobs", getJobs);

router.get("/getJob/:id", getJob);

router.post("/addJob", validator(addJobSchema), addJob);

router.put("/updateJob/:id", validator(updateJobSchema), updateJob);

router.patch("/updateJob/:id", updateJob);

router.delete("/deleteJob/:id", deleteJob);

router.post("/triggerJob/:id", triggerJob);

router.get("/:jobId/executions", getJobExecutions);
router.get("/:jobId/executions/stats", getJobExecutionStats);
router.get("/:jobId/executions/running", getJobRunningExecutions);
router.get("/:jobId/executions/:executionId", getJobExecutionDetails);

export default router;
