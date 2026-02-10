// env.ts must be imported first — it loads dotenv and validates all env vars
import { env } from "./config/env.js";

import express from "express";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./lib/error-handler.js";
import userRouter from "./modules/users/user.routes.js";
import cvRouter from "./modules/cv/cv.routes.js";
import preferencesRouter from "./modules/preferences/preferences.routes.js";
import cors from "cors";

// Side-effect import: establishes DB pool connection on startup
import "./db/index.js";

const app = express();

// Global middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// API routes
app.use("/api/users", userRouter);
app.use("/api/cv", cvRouter);
app.use("/api/preferences", preferencesRouter);

// Global error handler (must be AFTER all routes)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
    logger.info(`Server running at http://localhost:${env.PORT}`);
});
