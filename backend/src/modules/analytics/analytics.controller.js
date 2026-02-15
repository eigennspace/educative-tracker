import { z } from 'zod';
import { getHeatmap, getInsights } from './analytics.service.js';

const heatmapQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional()
});

export function analyticsHeatmapHandler(req, res) {
  const query = heatmapQuerySchema.parse(req.query);
  res.json({ data: getHeatmap(req.userId, query.year) });
}

export function analyticsInsightsHandler(req, res) {
  res.json({ data: getInsights(req.userId) });
}
