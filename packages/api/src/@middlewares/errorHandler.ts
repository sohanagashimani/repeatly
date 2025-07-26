import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};

export default errorHandler;
