import { db } from '../../db/index.js';
import { DEFAULT_USER_ID } from '../../types/api.js';
import { daysBetween, startOfDay } from '../../utils/date.js';

function calculateStreak(dateKeys) {
  if (!dateKeys.length) {
    return 0;
  }

  const normalized = [...new Set(dateKeys)].sort((a, b) => (a > b ? -1 : 1));
  const today = startOfDay(new Date());
  const diffFromToday = daysBetween(today, normalized[0]);
  if (diffFromToday > 1) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < normalized.length; i += 1) {
    const diff = daysBetween(normalized[i - 1], normalized[i]);
    if (diff === 1) {
      streak += 1;
    } else if (diff > 1) {
      break;
    }
  }

  return streak;
}

export function getDashboardSummary(userId = DEFAULT_USER_ID) {
  const activeCourses = db
    .prepare('SELECT COUNT(*) AS total FROM courses WHERE user_id = ? AND is_archived = 0')
    .get(userId).total;

  const totalMinutes = db
    .prepare('SELECT COALESCE(SUM(duration_minutes), 0) AS total FROM study_sessions WHERE user_id = ?')
    .get(userId).total;

  const completionRows = db.prepare(`
    SELECT
      c.id,
      c.title,
      c.total_lessons,
      (
        SELECT COUNT(*) FROM lesson_progress lp
        WHERE lp.course_id = c.id AND lp.is_completed = 1
      ) AS completed_lessons
    FROM courses c
    WHERE c.user_id = ?
    ORDER BY c.updated_at DESC
  `).all(userId);

  const completion = completionRows.map((row) => ({
    courseId: row.id,
    title: row.title,
    completedLessons: row.completed_lessons,
    totalLessons: row.total_lessons,
    progressPercentage: row.total_lessons > 0
      ? Number(((row.completed_lessons / row.total_lessons) * 100).toFixed(2))
      : 0
  }));

  const streakDates = db.prepare(`
    SELECT DISTINCT session_date
    FROM study_sessions
    WHERE user_id = ?
    ORDER BY session_date DESC
  `).all(userId).map((row) => row.session_date);

  return {
    activeCourses,
    totalStudyHours: Number((totalMinutes / 60).toFixed(2)),
    learningStreakDays: calculateStreak(streakDates),
    completion
  };
}

export function getWeeklyLearning(userId = DEFAULT_USER_ID) {
  const rows = db.prepare(`
    SELECT
      strftime('%Y-W%W', session_date) AS week,
      COALESCE(SUM(duration_minutes), 0) AS total_minutes,
      COUNT(*) AS sessions_count
    FROM study_sessions
    WHERE user_id = ?
      AND session_date >= date('now', '-84 days')
    GROUP BY strftime('%Y-W%W', session_date)
    ORDER BY week ASC
  `).all(userId);

  return rows.map((row) => ({
    week: row.week,
    totalMinutes: row.total_minutes,
    totalHours: Number((row.total_minutes / 60).toFixed(2)),
    sessionsCount: row.sessions_count
  }));
}
