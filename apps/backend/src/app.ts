import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { areasRouter } from "./routes/areas.js";
import { announcementsRouter } from "./routes/announcements.js";
import { communityUpdatesRouter } from "./routes/communityUpdates.js";
import { complaintsRouter } from "./routes/complaints.js";
import { uploadsDir } from "./lib/uploads.js";
import { adminRouter } from './routes/admin.js';
import { vehiclesRouter } from './routes/vehicles.js';
import { adminVehiclesRouter } from './routes/adminVehicles.js';
import { adminComplaintsRouter } from './routes/adminComplaints.js';
import { announcementsAdminRouter } from './routes/announcementsAdmin.js';
import { areasAdminRouter } from './routes/areasAdmin.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(pinoHttp({ logger }));

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/areas", areasRouter);
  app.use("/api/v1/announcements", announcementsRouter);
  app.use("/api/v1/community-updates", communityUpdatesRouter);
  app.use("/api/v1/complaints", complaintsRouter);
  app.use(
    "/uploads",
    express.static(uploadsDir, {
      dotfiles: "deny",
      index: false,
    }),
  );
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/vehicles', vehiclesRouter);
  app.use('/api/v1/admin', adminVehiclesRouter);
  app.use('/api/v1/admin', adminComplaintsRouter);
  app.use('/api/v1/admin/announcements', announcementsAdminRouter);
app.use('/api/v1/admin/areas', areasAdminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
