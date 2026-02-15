import { getDashboardSummary, getWeeklyLearning } from './dashboard.service.js';

export function dashboardSummaryHandler(req, res) {
  res.json({ data: getDashboardSummary(req.userId) });
}

export function dashboardWeeklyHandler(req, res) {
  res.json({ data: getWeeklyLearning(req.userId) });
}
