import { Path } from "../types";

export const jobRoutes: Path[] = [
  {
    path: "/getJobs",
    method: "get",
    type: "jobs",
  },
  {
    path: "/getJob/:id",
    method: "get",
    type: "jobs",
  },
  {
    path: "/addJob",
    method: "post",
    type: "jobs",
  },
  {
    path: "/updateJob/:id",
    method: "put",
    type: "jobs",
  },
  {
    path: "/updateJob/:id",
    method: "patch",
    type: "jobs",
  },
  {
    path: "/deleteJob/:id",
    method: "delete",
    type: "jobs",
  },
  {
    path: "/triggerJob/:id",
    method: "post",
    type: "jobs",
  },
];
