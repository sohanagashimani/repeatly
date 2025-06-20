import * as yup from "yup";
import { isValidCron } from "cron-validator";

const updateJobSchema = yup.object({
  body: yup.object({
    name: yup.string().required("Name is required"),
    cron: yup
      .string()
      .required("Cron expression is required")
      .test("is-valid-cron", "Invalid cron expression", value => {
        if (!value) return false;
        return isValidCron(value);
      }),
    url: yup.string().url("Invalid URL").required("URL is required"),
    method: yup
      .string()
      .oneOf(["GET", "POST", "PUT", "PATCH", "DELETE"], "Invalid HTTP method")
      .required("HTTP method is required"),
    headers: yup.object().optional(),
    body: yup.mixed().optional(),
  }),
});

export type UpdateJobSchemaType = yup.InferType<typeof updateJobSchema>;

export default updateJobSchema;
