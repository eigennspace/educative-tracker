import { db } from '../../db/index.js';
import { DEFAULT_USER_ID } from '../../types/api.js';

const baseQuery = `
  SELECT
    s.id,
    s.user_id,
    s.course_id,
    s.session_date,
    s.duration_minutes,
    s.notes,
    s.created_at,
    s.updated_at,
    c.title AS course_title
  FROM study_sessions s
  JOIN courses c ON c.id = s.course_id
  WHERE s.user_id = ?
`;

function toSessionDto(row) {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    courseTitle: row.course_title,
    sessionDate: row.session_date,
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listSessions(filters = {}, userId = DEFAULT_USER_ID) {
  const conditions = [];
  const values = [userId];

  if (filters.courseId) {
    conditions.push('s.course_id = ?');
    values.push(filters.courseId);
  }

  if (filters.from) {
    conditions.push('s.session_date >= ?');
    values.push(filters.from);
  }

  if (filters.to) {
    conditions.push('s.session_date <= ?');
    values.push(filters.to);
  }

  const where = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`${baseQuery}${where} ORDER BY s.session_date DESC, s.created_at DESC`).all(...values);

  return rows.map(toSessionDto);
}

export function createSession(payload, userId = DEFAULT_USER_ID) {
  const course = db
    .prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
    .get(payload.courseId, userId);

  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  const result = db.prepare(`
    INSERT INTO study_sessions (
      user_id, course_id, session_date, duration_minutes, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(userId, payload.courseId, payload.sessionDate, payload.durationMinutes, payload.notes || null);

  db.prepare("UPDATE courses SET updated_at = datetime('now') WHERE id = ?").run(payload.courseId);
  return getSessionById(Number(result.lastInsertRowid), userId);
}

export function getSessionById(id, userId = DEFAULT_USER_ID) {
  const row = db.prepare(`${baseQuery} AND s.id = ? LIMIT 1`).get(userId, id);
  return row ? toSessionDto(row) : null;
}

export function updateSession(id, payload, userId = DEFAULT_USER_ID) {
  const existing = db.prepare('SELECT * FROM study_sessions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    return null;
  }

  if (payload.courseId !== undefined) {
    const target = db.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?').get(payload.courseId, userId);
    if (!target) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
  }

  const merged = {
    courseId: payload.courseId ?? existing.course_id,
    sessionDate: payload.sessionDate ?? existing.session_date,
    durationMinutes: payload.durationMinutes ?? existing.duration_minutes,
    notes: payload.notes !== undefined ? payload.notes : existing.notes
  };

  db.prepare(`
    UPDATE study_sessions
    SET course_id = ?, session_date = ?, duration_minutes = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(merged.courseId, merged.sessionDate, merged.durationMinutes, merged.notes, id, userId);

  db.prepare("UPDATE courses SET updated_at = datetime('now') WHERE id IN (?, ?)").run(existing.course_id, merged.courseId);

  return getSessionById(id, userId);
}

export function deleteSession(id, userId = DEFAULT_USER_ID) {
  const existing = db.prepare('SELECT course_id FROM study_sessions WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    return false;
  }

  db.prepare('DELETE FROM study_sessions WHERE id = ? AND user_id = ?').run(id, userId);
  db.prepare("UPDATE courses SET updated_at = datetime('now') WHERE id = ?").run(existing.course_id);

  return true;
}
