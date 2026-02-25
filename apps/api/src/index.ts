import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import debugRoutes from "./routes/debug";
import healthRoutes from "./routes/health";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(morgan("combined"));

app.use(healthRoutes);
app.use(debugRoutes);

app.get("/", (_req, res) => {
  res.json({
    service: "zhongdao-api-minimal",
    version: "0.1.0",
    nodeEnv: env.nodeEnv
  });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API started on port ${env.port}`);
});
