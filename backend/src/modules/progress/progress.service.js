import { db } from '../../db/index.js';
import { DEFAULT_USER_ID } from '../../types/api.js';

function ensureCourseExists(courseId, userId = DEFAULT_USER_ID) {
  return db
    .prepare('SELECT id, total_lessons FROM courses WHERE id = ? AND user_id = ?')
    .get(courseId, userId);
}

export function getCourseProgress(courseId, userId = DEFAULT_USER_ID) {
  const course = ensureCourseExists(courseId, userId);
  if (!course) {
    return null;
  }

  const rows = db.prepare(`
    SELECT lesson_number, is_completed, completed_at
    FROM lesson_progress
    WHERE course_id = ?
    ORDER BY lesson_number ASC
  `).all(courseId);

  const completedCount = rows.filter((row) => row.is_completed === 1).length;

  return {
    courseId,
    totalLessons: course.total_lessons,
    completedLessons: completedCount,
    progressPercentage: course.total_lessons > 0
      ? Number(((completedCount / course.total_lessons) * 100).toFixed(2))
      : 0,
    lessons: rows.map((row) => ({
      lessonNumber: row.lesson_number,
      completed: row.is_completed === 1,
      completedAt: row.completed_at
    }))
  };
}

export function toggleLessonCompletion(
  courseId,
  lessonNumber,
  completed,
  userId = DEFAULT_USER_ID,
  options = {}
) {
  const applyToPrevious = options.applyToPrevious === true;
  const course = ensureCourseExists(courseId, userId);
  if (!course) {
    return null;
  }

  if (course.total_lessons > 0 && lessonNumber > course.total_lessons) {
    const err = new Error('Lesson number exceeds total lessons for this course');
    err.statusCode = 400;
    throw err;
  }

  const upsertLessonProgress = db.prepare(`
    INSERT INTO lesson_progress (course_id, lesson_number, is_completed, completed_at, updated_at)
    VALUES (?, ?, ?, CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, datetime('now'))
    ON CONFLICT(course_id, lesson_number)
    DO UPDATE SET
      is_completed = excluded.is_completed,
      completed_at = CASE WHEN excluded.is_completed = 1 THEN datetime('now') ELSE NULL END,
      updated_at = datetime('now')
  `);
  const touchCourseUpdatedAt = db.prepare("UPDATE courses SET updated_at = datetime('now') WHERE id = ?");
  const completionValue = completed ? 1 : 0;

  const applyProgressChange = db.transaction(() => {
    if (completed && applyToPrevious) {
      for (let targetLessonNumber = 1; targetLessonNumber <= lessonNumber; targetLessonNumber += 1) {
        upsertLessonProgress.run(courseId, targetLessonNumber, completionValue, completionValue);
      }
    } else {
      upsertLessonProgress.run(courseId, lessonNumber, completionValue, completionValue);
    }

    touchCourseUpdatedAt.run(courseId);
  });

  applyProgressChange();

  return getCourseProgress(courseId, userId);
}
