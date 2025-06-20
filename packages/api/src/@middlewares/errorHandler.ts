import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let message = "Internal server error";
  if (
    typeof err === "object" &&
    err &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  ) {
    message = (err as { message: string }).message;
  }
  res.status(500).json({ error: message });
};

export default errorHandler;
