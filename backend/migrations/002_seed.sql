INSERT INTO users (id, name, email, password_hash)
SELECT 1, 'Default Learner', 'learner@example.com', '$2b$10$0xQ28hiPjI1/N/yYOJFWUeFpjX9JU/llPfZX6KFBtqQsZbTuWDMhW'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO courses (user_id, title, url, category, total_lessons, difficulty, estimated_hours)
SELECT 1, 'Grokking Algorithms', 'https://www.educative.io/courses/grokking-algorithms', 'Algorithms', 48, 'intermediate', 32
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Grokking Algorithms');

INSERT INTO courses (user_id, title, url, category, total_lessons, difficulty, estimated_hours)
SELECT 1, 'System Design Fundamentals', 'https://www.educative.io/courses/system-design-fundamentals', 'System Design', 36, 'advanced', 28
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'System Design Fundamentals');

INSERT INTO lesson_progress (course_id, lesson_number, is_completed, completed_at)
SELECT c.id, v.lesson_number, 1, datetime('now', '-' || v.days_offset || ' days')
FROM courses c
JOIN (
  SELECT 1 AS lesson_number, 10 AS days_offset
  UNION ALL SELECT 2, 8
  UNION ALL SELECT 3, 6
) v
WHERE c.title = 'Grokking Algorithms'
AND NOT EXISTS (
  SELECT 1 FROM lesson_progress lp WHERE lp.course_id = c.id AND lp.lesson_number = v.lesson_number
);

INSERT INTO study_sessions (user_id, course_id, session_date, duration_minutes, notes)
SELECT 1, c.id, date('now', '-7 days'), 90, 'Reviewed dynamic programming basics'
FROM courses c
WHERE c.title = 'Grokking Algorithms'
AND NOT EXISTS (
  SELECT 1 FROM study_sessions s WHERE s.course_id = c.id AND s.session_date = date('now', '-7 days')
);

INSERT INTO study_sessions (user_id, course_id, session_date, duration_minutes, notes)
SELECT 1, c.id, date('now', '-2 days'), 75, 'Scalability patterns and caching notes'
FROM courses c
WHERE c.title = 'System Design Fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM study_sessions s WHERE s.course_id = c.id AND s.session_date = date('now', '-2 days')
);
