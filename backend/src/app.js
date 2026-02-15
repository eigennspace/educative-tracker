import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import coursesRoutes from './modules/courses/courses.routes.js';
import progressRoutes from './modules/progress/progress.routes.js';
import sessionsRoutes from './modules/sessions/sessions.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api', authenticate);

app.use('/api/courses', coursesRoutes);
app.use('/api/courses/:id/progress', progressRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
