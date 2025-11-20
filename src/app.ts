// src/app.ts
import express from "express";
import cors from "cors";

import uploadRoutes from "./api/routes/upload.routes.js";
import taskRoutes from "./api/routes/task.routes.js";

// 🔥 nuevos imports Arkiv
import arkivDaoRoutes from "./api/routes/arkiv-dao.routes.js";
import arkivProposalRoutes from "./api/routes/arkiv-proposal.routes.js";
import arkivTaskRoutes from "./api/routes/arkiv-task.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes existentes
app.use("/api/upload", uploadRoutes);
app.use("/api/tasks", taskRoutes);

// 🔥 Nuevas rutas Arkiv
app.use("/api/arkiv/daos", arkivDaoRoutes);
app.use("/api/arkiv/proposals", arkivProposalRoutes);
app.use("/api/arkiv/tasks", arkivTaskRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "roxium-dao-ops-ipfs",
  });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error no manejado:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Error interno del servidor",
    });
  }
);

export default app;
