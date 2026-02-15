import { Router } from 'express';
import { analyticsHeatmapHandler, analyticsInsightsHandler } from './analytics.controller.js';

const router = Router();

router.get('/heatmap', analyticsHeatmapHandler);
router.get('/insights', analyticsInsightsHandler);

export default router;
