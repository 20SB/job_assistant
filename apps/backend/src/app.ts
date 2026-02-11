// env.ts must be imported first — it loads dotenv and validates all env vars
import "./config/env.js";

import express from "express";
import cors from "cors";
import { errorHandler } from "./lib/error-handler.js";
import userRouter from "./modules/users/user.routes.js";
import cvRouter from "./modules/cv/cv.routes.js";
import preferencesRouter from "./modules/preferences/preferences.routes.js";
import subscriptionsRouter from "./modules/subscriptions/subscriptions.routes.js";
import jobsRouter from "./modules/jobs/jobs.routes.js";
import matchingRouter from "./modules/matching/matching.routes.js";
import csvRouter from "./modules/csv/csv.routes.js";
import notificationsRouter from "./modules/notifications/notifications.routes.js";
import tasksRouter from "./modules/tasks/tasks.routes.js";
import adminRouter from "./modules/admin/admin.routes.js";

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
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/matching", matchingRouter);
app.use("/api/csv", csvRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/admin", adminRouter);

// Global error handler (must be AFTER all routes)
app.use(errorHandler);

export { app };
