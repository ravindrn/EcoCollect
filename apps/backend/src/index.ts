import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`EcoCollect backend listening on http://localhost:${env.PORT}`);
  logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
});