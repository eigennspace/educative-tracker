import { db } from '../../db/index.js';
import { DEFAULT_USER_ID } from '../../types/api.js';

const baseSelect = `
  SELECT
    c.*,
    (
      SELECT COUNT(*)
      FROM lesson_progress lp
      WHERE lp.course_id = c.id AND lp.is_completed = 1
    ) AS completed_lessons,
    (
      SELECT MAX(lp.completed_at)
      FROM lesson_progress lp
      WHERE lp.course_id = c.id AND lp.is_completed = 1
    ) AS last_lesson_completed_at,
    (
      SELECT MAX(s.session_date)
      FROM study_sessions s
      WHERE s.course_id = c.id
    ) AS last_session_date,
    (
      SELECT COALESCE(SUM(s.duration_minutes), 0)
      FROM study_sessions s
      WHERE s.course_id = c.id
    ) AS total_study_minutes
  FROM courses c
  WHERE c.user_id = ?
`;

function toCourseDto(row) {
  const totalLessons = row.total_lessons || 0;
  const completedLessons = row.completed_lessons || 0;
  const progressPercentage = totalLessons > 0
    ? Number(((completedLessons / totalLessons) * 100).toFixed(2))
    : 0;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    url: row.url,
    category: row.category,
    totalLessons: row.total_lessons,
    difficulty: row.difficulty,
    estimatedHours: row.estimated_hours,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedLessons,
    progressPercentage,
    totalStudyMinutes: row.total_study_minutes,
    lastStudiedAt: row.last_session_date || row.last_lesson_completed_at || null
  };
}

export function listCourses(userId = DEFAULT_USER_ID) {
  const rows = db.prepare(`${baseSelect} ORDER BY c.updated_at DESC`).all(userId);
  return rows.map(toCourseDto);
}

export function getCourseById(id, userId = DEFAULT_USER_ID) {
  const row = db.prepare(`${baseSelect} AND c.id = ? LIMIT 1`).get(userId, id);
  return row ? toCourseDto(row) : null;
}

export function createCourse(payload, userId = DEFAULT_USER_ID) {
  const stmt = db.prepare(`
    INSERT INTO courses (
      user_id, title, url, category, total_lessons, difficulty, estimated_hours, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const result = stmt.run(
    userId,
    payload.title,
    payload.url || null,
    payload.category,
    payload.totalLessons,
    payload.difficulty,
    payload.estimatedHours
  );

  return getCourseById(Number(result.lastInsertRowid), userId);
}

export function updateCourse(id, payload, userId = DEFAULT_USER_ID) {
  const existing = db
    .prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
    .get(id, userId);

  if (!existing) {
    return null;
  }

  const fields = [];
  const values = [];

  const map = {
    title: 'title',
    url: 'url',
    category: 'category',
    totalLessons: 'total_lessons',
    difficulty: 'difficulty',
    estimatedHours: 'estimated_hours',
    isArchived: 'is_archived'
  };

  Object.entries(map).forEach(([inputKey, dbKey]) => {
    if (payload[inputKey] !== undefined) {
      fields.push(`${dbKey} = ?`);
      if (inputKey === 'isArchived') {
        values.push(payload[inputKey] ? 1 : 0);
      } else {
        values.push(payload[inputKey]);
      }
    }
  });

  if (!fields.length) {
    return getCourseById(id, userId);
  }

  fields.push("updated_at = datetime('now')");
  values.push(id, userId);

  db.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  return getCourseById(id, userId);
}

export function deleteCourse(id, userId = DEFAULT_USER_ID) {
  const result = db
    .prepare('DELETE FROM courses WHERE id = ? AND user_id = ?')
    .run(id, userId);

  return result.changes > 0;
}
