import express from 'express';
import cors from 'cors';
import uploadRoutes from './api/routes/upload.routes.js';
import taskRoutes from './api/routes/task.routes.js';
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/tasks', taskRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'roxium-dao-ops-ipfs'
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Error interno del servidor',
    });
});
export default app;
//# sourceMappingURL=app.js.map