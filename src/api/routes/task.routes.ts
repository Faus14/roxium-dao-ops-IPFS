// Placeholder - será implementado en Fase 6
import express from 'express';

const router = express.Router();

router.post('/:taskId/status', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Endpoint pendiente de implementación (Fase 6)',
  });
});

router.get('/:taskId/attachments', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Endpoint pendiente de implementación (Fase 7)',
  });
});

router.get('/:taskId/history', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Endpoint pendiente de implementación (Fase 7)',
  });
});

export default router;

