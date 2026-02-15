import { Router } from 'express';
import { dashboardSummaryHandler, dashboardWeeklyHandler } from './dashboard.controller.js';

const router = Router();

router.get('/summary', dashboardSummaryHandler);
router.get('/weekly', dashboardWeeklyHandler);

export default router;
