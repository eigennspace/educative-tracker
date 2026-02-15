import { z } from 'zod';
import { getCourseProgress, toggleLessonCompletion } from './progress.service.js';

const toggleSchema = z.object({
  lessonNumber: z.number().int().positive(),
  completed: z.boolean(),
  applyToPrevious: z.boolean().optional()
});

export function getCourseProgressHandler(req, res) {
  const courseId = Number(req.params.id);
  const data = getCourseProgress(courseId, req.userId);

  if (!data) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.json({ data });
}

export function toggleCourseProgressHandler(req, res) {
  const courseId = Number(req.params.id);
  const payload = toggleSchema.parse(req.body);
  const data = toggleLessonCompletion(
    courseId,
    payload.lessonNumber,
    payload.completed,
    req.userId,
    { applyToPrevious: payload.applyToPrevious === true }
  );

  if (!data) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.json({ data });
}
