import { db } from '../../db/index.js';
import { DEFAULT_USER_ID } from '../../types/api.js';

const dayNames = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

export function getHeatmap(userId = DEFAULT_USER_ID, year) {
  const targetYear = Number(year || new Date().getFullYear());

  const rows = db.prepare(`
    SELECT
      session_date AS date,
      COALESCE(SUM(duration_minutes), 0) AS total_minutes,
      COUNT(*) AS sessions_count
    FROM study_sessions
    WHERE user_id = ?
      AND strftime('%Y', session_date) = ?
    GROUP BY session_date
    ORDER BY session_date ASC
  `).all(userId, String(targetYear));

  return {
    year: targetYear,
    days: rows.map((row) => ({
      date: row.date,
      totalMinutes: row.total_minutes,
      sessionsCount: row.sessions_count,
      intensity: row.total_minutes >= 120 ? 4 : row.total_minutes >= 90 ? 3 : row.total_minutes >= 45 ? 2 : 1
    }))
  };
}

export function getInsights(userId = DEFAULT_USER_ID) {
  const bestDay = db.prepare(`
    SELECT
      strftime('%w', session_date) AS weekday,
      COALESCE(SUM(duration_minutes), 0) AS total_minutes
    FROM study_sessions
    WHERE user_id = ?
    GROUP BY strftime('%w', session_date)
    ORDER BY total_minutes DESC
    LIMIT 1
  `).get(userId);

  const last30 = db
    .prepare(`
      SELECT COUNT(DISTINCT session_date) AS days
      FROM study_sessions
      WHERE user_id = ? AND session_date >= date('now', '-30 days')
    `)
    .get(userId).days;

  const current14 = db
    .prepare(`
      SELECT COALESCE(SUM(duration_minutes), 0) AS minutes
      FROM study_sessions
      WHERE user_id = ? AND session_date >= date('now', '-13 days')
    `)
    .get(userId).minutes;

  const previous14 = db
    .prepare(`
      SELECT COALESCE(SUM(duration_minutes), 0) AS minutes
      FROM study_sessions
      WHERE user_id = ? AND session_date >= date('now', '-27 days') AND session_date < date('now', '-13 days')
    `)
    .get(userId).minutes;

  const trend = previous14 === 0
    ? (current14 > 0 ? 100 : 0)
    : Number((((current14 - previous14) / previous14) * 100).toFixed(2));

  return {
    bestStudyDay: bestDay ? dayNames[bestDay.weekday] : null,
    bestStudyDayMinutes: bestDay ? bestDay.total_minutes : 0,
    consistencyScore: Number(((last30 / 30) * 100).toFixed(2)),
    trendPercent: trend,
    trendDirection: trend >= 0 ? 'up' : 'down'
  };
}
