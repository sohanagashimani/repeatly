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

router.get("/getJobs", getJobs);

router.get("/getJob/:id", getJob);

router.post("/addJob", validator(addJobSchema), addJob);

router.put("/updateJob/:id", validator(updateJobSchema), updateJob);

router.patch("/updateJob/:id", validator(updateJobSchema), updateJob);

router.delete("/deleteJob/:id", deleteJob);

router.post("/triggerJob/:id", triggerJob);

export default router;
