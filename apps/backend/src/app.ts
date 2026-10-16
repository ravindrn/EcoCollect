import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(pinoHttp({ logger }));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}