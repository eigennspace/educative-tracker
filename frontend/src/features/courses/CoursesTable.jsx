import { useState } from 'react';
import ProgressBar from '../../components/ProgressBar.jsx';

export default function CoursesTable({ courses, onDelete, onToggleLesson }) {
  const [lessonInputs, setLessonInputs] = useState({});
  const getCourseInput = (courseId) => lessonInputs[courseId] || {};

  function updateCourseInput(courseId, partial) {
    setLessonInputs({
      ...lessonInputs,
      [courseId]: {
        ...getCourseInput(courseId),
        ...partial
      }
    });
  }

  function applyToggle(course) {
    const input = getCourseInput(course.id);
    const number = Number(input.number);
    const completed = (input.completed ?? 'true') === 'true';
    const applyToPrevious = completed && (input.mode ?? 'single') === 'range';

    if (number > 0) {
      onToggleLesson(course.id, number, completed, { applyToPrevious });
    }
  }

  if (!courses.length) {
    return (
      <div className="rounded-xl border border-line bg-panel px-3 py-8 text-center text-sm text-muted">
        No courses yet. Add your first course above to start tracking progress.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {courses.map((course) => (
          <article key={course.id} className="table-mobile-card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{course.title}</p>
                <p className="text-xs text-muted">{course.category} • {course.difficulty}</p>
              </div>
              <button
                type="button"
                className="rounded-md border border-rose-400 px-2 py-1 text-xs text-rose-300 hover:bg-rose-900/20"
                onClick={() => onDelete(course)}
              >
                Delete
              </button>
            </div>

            <div>
              <p className="mb-1 text-xs text-muted">{course.completedLessons}/{course.totalLessons} ({course.progressPercentage}%)</p>
              <ProgressBar
                value={course.progressPercentage}
                label={`Progress for ${course.title}`}
                valueText={`${course.progressPercentage}% complete`}
              />
            </div>

            <p className="text-xs text-muted">Last studied: {course.lastStudiedAt || '-'}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="input"
                type="number"
                aria-label={`Lesson number for ${course.title}`}
                min="1"
                max={Math.max(1, course.totalLessons || 1)}
                placeholder="Lesson #"
                value={getCourseInput(course.id).number || ''}
                onChange={(e) => updateCourseInput(course.id, { number: e.target.value })}
              />
              <select
                className="input"
                aria-label={`Lesson action for ${course.title}`}
                value={getCourseInput(course.id).completed ?? 'true'}
                onChange={(e) => updateCourseInput(course.id, { completed: e.target.value })}
              >
                <option value="true">Complete</option>
                <option value="false">Undo</option>
              </select>
              <label className="field-label mb-0 mt-1" htmlFor={`mobile-toggle-mode-${course.id}`}>Complete mode</label>
              <select
                id={`mobile-toggle-mode-${course.id}`}
                className="input"
                aria-label={`Complete mode for ${course.title}`}
                value={getCourseInput(course.id).mode ?? 'single'}
                disabled={(getCourseInput(course.id).completed ?? 'true') !== 'true'}
                onChange={(e) => updateCourseInput(course.id, { mode: e.target.value })}
              >
                <option value="single">Only N</option>
                <option value="range">1..N</option>
              </select>
            </div>

            {(getCourseInput(course.id).completed ?? 'true') !== 'true' ? (
              <p className="text-xs text-muted">Range mode is only available for Complete.</p>
            ) : null}

            <button
              type="button"
              className="btn w-full"
              aria-label={`Apply lesson update for ${course.title}`}
              onClick={() => applyToggle(course)}
            >
              <span className="sr-only">Apply lesson update for {course.title}: </span>
              Apply
            </button>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-line bg-panel md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-900/60 text-left text-muted">
            <tr>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Difficulty</th>
              <th className="px-3 py-2">Progress</th>
              <th className="px-3 py-2">Last Studied</th>
              <th className="px-3 py-2">Lesson Toggle</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-t border-line">
                <td className="px-3 py-3">
                  <p className="font-medium text-ink">{course.title}</p>
                  <p className="text-xs text-muted">{course.totalLessons} lessons • {course.estimatedHours}h est.</p>
                </td>
                <td className="px-3 py-3">{course.category}</td>
                <td className="px-3 py-3 capitalize">{course.difficulty}</td>
                <td className="px-3 py-3">
                  <p className="mb-1 text-xs text-muted">{course.completedLessons}/{course.totalLessons} ({course.progressPercentage}%)</p>
                  <ProgressBar
                    value={course.progressPercentage}
                    label={`Progress for ${course.title}`}
                    valueText={`${course.progressPercentage}% complete`}
                  />
                </td>
                <td className="px-3 py-3 text-xs text-muted">{course.lastStudiedAt || '-'}</td>
                <td className="px-3 py-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        className="input w-24"
                        type="number"
                        aria-label={`Lesson number for ${course.title}`}
                        min="1"
                        max={Math.max(1, course.totalLessons || 1)}
                        placeholder="#"
                        value={getCourseInput(course.id).number || ''}
                        onChange={(e) => updateCourseInput(course.id, { number: e.target.value })}
                      />
                      <select
                        className="input w-28"
                        aria-label={`Lesson action for ${course.title}`}
                        value={getCourseInput(course.id).completed ?? 'true'}
                        onChange={(e) => updateCourseInput(course.id, { completed: e.target.value })}
                      >
                        <option value="true">Complete</option>
                        <option value="false">Undo</option>
                      </select>
                      <button
                        type="button"
                        className="btn"
                        aria-label={`Apply lesson update for ${course.title}`}
                        onClick={() => applyToggle(course)}
                      >
                        Apply
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted" htmlFor={`toggle-mode-${course.id}`}>
                        Complete mode
                      </label>
                      <select
                        id={`toggle-mode-${course.id}`}
                        className="input w-32"
                        aria-label={`Complete mode for ${course.title}`}
                        value={getCourseInput(course.id).mode ?? 'single'}
                        disabled={(getCourseInput(course.id).completed ?? 'true') !== 'true'}
                        onChange={(e) => updateCourseInput(course.id, { mode: e.target.value })}
                      >
                        <option value="single">Only N</option>
                        <option value="range">1..N</option>
                      </select>
                    </div>
                    {(getCourseInput(course.id).completed ?? 'true') !== 'true' ? (
                      <p className="text-xs text-muted">Range mode is only available for Complete.</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="rounded-md border border-rose-400 px-2 py-1 text-xs text-rose-300 hover:bg-rose-900/20"
                    onClick={() => onDelete(course)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
