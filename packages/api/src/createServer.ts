import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./@routes";
import { errorHandler } from "./@middlewares";

const createServer = () => {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "15mb" }));
  app.use(cors());

  app.use("/api", routes);

  app.use(errorHandler);
  return app;
};

export default createServer;
