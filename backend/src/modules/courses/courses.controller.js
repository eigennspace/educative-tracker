import { z } from 'zod';
import {
  createCourse,
  deleteCourse,
  getCourseById,
  listCourses,
  updateCourse
} from './courses.service.js';

const difficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

const createCourseSchema = z.object({
  title: z.string().min(2),
  url: z.string().url().optional().or(z.literal('')),
  category: z.string().min(2),
  totalLessons: z.number().int().min(0),
  difficulty: difficultyEnum,
  estimatedHours: z.number().nonnegative()
});

const updateCourseSchema = createCourseSchema.partial().extend({
  isArchived: z.boolean().optional()
});

export function listCoursesHandler(req, res) {
  res.json({ data: listCourses(req.userId) });
}

export function getCourseHandler(req, res) {
  const id = Number(req.params.id);
  const course = getCourseById(id, req.userId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.json({ data: course });
}

export function createCourseHandler(req, res) {
  const payload = createCourseSchema.parse(req.body);
  const course = createCourse(payload, req.userId);
  return res.status(201).json({ data: course });
}

export function updateCourseHandler(req, res) {
  const id = Number(req.params.id);
  const payload = updateCourseSchema.parse(req.body);
  const course = updateCourse(id, payload, req.userId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.json({ data: course });
}

export function deleteCourseHandler(req, res) {
  const id = Number(req.params.id);
  const removed = deleteCourse(id, req.userId);

  if (!removed) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.status(204).send();
}
