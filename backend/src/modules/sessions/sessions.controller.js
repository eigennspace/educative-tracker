import { z } from 'zod';
import {
  createSession,
  deleteSession,
  listSessions,
  updateSession
} from './sessions.service.js';

const createSchema = z.object({
  courseId: z.number().int().positive(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().positive(),
  notes: z.string().max(1000).optional().or(z.literal(''))
});

const updateSchema = createSchema.partial();

const listFilterSchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export function listSessionsHandler(req, res) {
  const filters = listFilterSchema.parse(req.query);
  const data = listSessions(filters, req.userId);
  return res.json({ data });
}

export function createSessionHandler(req, res) {
  const payload = createSchema.parse(req.body);
  const data = createSession(payload, req.userId);
  return res.status(201).json({ data });
}

export function updateSessionHandler(req, res) {
  const id = Number(req.params.id);
  const payload = updateSchema.parse(req.body);
  const data = updateSession(id, payload, req.userId);

  if (!data) {
    return res.status(404).json({ error: 'Session not found' });
  }

  return res.json({ data });
}

export function deleteSessionHandler(req, res) {
  const id = Number(req.params.id);
  const removed = deleteSession(id, req.userId);

  if (!removed) {
    return res.status(404).json({ error: 'Session not found' });
  }

  return res.status(204).send();
}
