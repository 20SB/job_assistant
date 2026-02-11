import { env } from "./config/env.js";
import { app } from "./app.js";
import { logger } from "./lib/logger.js";
import { startTaskProcessor } from "./lib/task-processor.js";

// Start server
app.listen(env.PORT, () => {
    logger.info(`Server running at http://localhost:${env.PORT}`);
    startTaskProcessor(env.WORKER_POLL_INTERVAL_MS);
});
