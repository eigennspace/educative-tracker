import { useId, useState } from 'react';
import { todayDateKey } from '../../lib/date.js';

export default function SessionForm({ courses, onSubmit }) {
  const id = useId();
  const [form, setForm] = useState({
    courseId: courses[0]?.id || '',
    sessionDate: todayDateKey(),
    durationMinutes: 60,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function validate(nextForm = form) {
    const nextErrors = {};

    if (!nextForm.courseId) {
      nextErrors.courseId = 'Select a course.';
    }

    if (!nextForm.sessionDate) {
      nextErrors.sessionDate = 'Session date is required.';
    }

    if (Number(nextForm.durationMinutes) < 1) {
      nextErrors.durationMinutes = 'Duration must be at least 1 minute.';
    }

    if (String(nextForm.notes).length > 400) {
      nextErrors.notes = 'Notes must be under 400 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!validate()) {
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        ...form,
        courseId: Number(form.courseId),
        durationMinutes: Number(form.durationMinutes),
        notes: form.notes.trim()
      });
      setForm({ ...form, durationMinutes: 60, notes: '' });
      setFieldErrors({});
    } catch (err) {
      setError(err.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  }

  if (!courses.length) {
    return (
      <div className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
        Add at least one course before logging study sessions.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="panel-elevated grid gap-3 p-4 md:grid-cols-5" noValidate>
      <div>
        <label className="field-label" htmlFor={`${id}-course`}>Course</label>
        <select
          id={`${id}-course`}
          className="input"
          value={form.courseId}
          onChange={(e) => {
            const next = { ...form, courseId: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.courseId)}
          aria-describedby={fieldErrors.courseId ? `${id}-course-error` : undefined}
          required
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
        {fieldErrors.courseId ? <p id={`${id}-course-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.courseId}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-date`}>Session date</label>
        <input
          id={`${id}-date`}
          className="input"
          type="date"
          value={form.sessionDate}
          onChange={(e) => {
            const next = { ...form, sessionDate: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.sessionDate)}
          aria-describedby={fieldErrors.sessionDate ? `${id}-date-error` : undefined}
          required
        />
        {fieldErrors.sessionDate ? <p id={`${id}-date-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.sessionDate}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-duration`}>Duration (minutes)</label>
        <input
          id={`${id}-duration`}
          className="input"
          type="number"
          min="1"
          value={form.durationMinutes}
          onChange={(e) => {
            const next = { ...form, durationMinutes: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.durationMinutes)}
          aria-describedby={fieldErrors.durationMinutes ? `${id}-duration-error` : `${id}-duration-help`}
          required
        />
        <p id={`${id}-duration-help`} className="mt-1 text-xs text-muted">Most learners log sessions between 15 and 120 minutes.</p>
        {fieldErrors.durationMinutes ? <p id={`${id}-duration-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.durationMinutes}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-notes`}>Notes</label>
        <input
          id={`${id}-notes`}
          className="input"
          placeholder="Optional notes"
          value={form.notes}
          onChange={(e) => {
            const next = { ...form, notes: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.notes)}
          aria-describedby={`${id}-notes-help ${fieldErrors.notes ? `${id}-notes-error` : ''}`.trim()}
        />
        <p id={`${id}-notes-help`} className="mt-1 text-xs text-muted">Optional. Add a quick takeaway from this session.</p>
        {fieldErrors.notes ? <p id={`${id}-notes-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.notes}</p> : null}
      </div>
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Session'}</button>
      {error ? <p className="text-sm text-rose-400 md:col-span-5" role="status" aria-live="polite">{error}</p> : null}
    </form>
  );
}
