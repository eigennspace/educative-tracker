import { useId, useState } from 'react';

const initial = {
  title: '',
  url: '',
  category: '',
  totalLessons: 1,
  difficulty: 'beginner',
  estimatedHours: 1
};

export default function CourseForm({ onSubmit }) {
  const id = useId();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function validate(nextForm = form) {
    const nextErrors = {};

    if (!String(nextForm.title).trim()) {
      nextErrors.title = 'Course title is required.';
    }

    if (!String(nextForm.category).trim()) {
      nextErrors.category = 'Category is required.';
    }

    if (nextForm.url) {
      try {
        const parsed = new URL(nextForm.url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          nextErrors.url = 'Use a valid http(s) URL.';
        }
      } catch {
        nextErrors.url = 'Use a valid URL, for example https://example.com/course.';
      }
    }

    if (Number(nextForm.totalLessons) < 0) {
      nextErrors.totalLessons = 'Lessons must be 0 or more.';
    }

    if (Number(nextForm.estimatedHours) < 0) {
      nextErrors.estimatedHours = 'Estimated hours must be 0 or more.';
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
        title: form.title.trim(),
        category: form.category.trim(),
        totalLessons: Number(form.totalLessons),
        estimatedHours: Number(form.estimatedHours)
      });
      setForm(initial);
      setFieldErrors({});
    } catch (err) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel-elevated grid gap-3 p-4 md:grid-cols-6" noValidate>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor={`${id}-title`}>Course title</label>
        <input
          id={`${id}-title`}
          className="input"
          placeholder="e.g. Grokking Algorithms"
          value={form.title}
          onChange={(e) => {
            const next = { ...form, title: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? `${id}-title-error` : undefined}
          required
        />
        {fieldErrors.title ? <p id={`${id}-title-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.title}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-category`}>Category</label>
        <input
          id={`${id}-category`}
          className="input"
          placeholder="e.g. System Design"
          value={form.category}
          onChange={(e) => {
            const next = { ...form, category: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.category)}
          aria-describedby={fieldErrors.category ? `${id}-category-error` : undefined}
          required
        />
        {fieldErrors.category ? <p id={`${id}-category-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.category}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-url`}>Educative URL</label>
        <input
          id={`${id}-url`}
          className="input"
          placeholder="https://..."
          value={form.url}
          onChange={(e) => {
            const next = { ...form, url: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.url)}
          aria-describedby={`${id}-url-help ${fieldErrors.url ? `${id}-url-error` : ''}`.trim()}
        />
        <p id={`${id}-url-help`} className="mt-1 text-xs text-muted">Optional. Paste the public course URL.</p>
        {fieldErrors.url ? <p id={`${id}-url-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.url}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-lessons`}>Lessons</label>
        <input
          id={`${id}-lessons`}
          className="input"
          type="number"
          min="0"
          value={form.totalLessons}
          onChange={(e) => {
            const next = { ...form, totalLessons: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.totalLessons)}
          aria-describedby={fieldErrors.totalLessons ? `${id}-lessons-error` : `${id}-lessons-help`}
          required
        />
        <p id={`${id}-lessons-help`} className="mt-1 text-xs text-muted">Use 0 only if lesson count is unknown.</p>
        {fieldErrors.totalLessons ? <p id={`${id}-lessons-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.totalLessons}</p> : null}
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-difficulty`}>Difficulty</label>
        <select id={`${id}-difficulty`} className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-hours`}>Estimated hours</label>
        <input
          id={`${id}-hours`}
          className="input"
          type="number"
          min="0"
          step="0.5"
          value={form.estimatedHours}
          onChange={(e) => {
            const next = { ...form, estimatedHours: e.target.value };
            setForm(next);
            validate(next);
          }}
          aria-invalid={Boolean(fieldErrors.estimatedHours)}
          aria-describedby={fieldErrors.estimatedHours ? `${id}-hours-error` : `${id}-hours-help`}
          required
        />
        <p id={`${id}-hours-help`} className="mt-1 text-xs text-muted">Use half-hour increments when possible.</p>
        {fieldErrors.estimatedHours ? <p id={`${id}-hours-error`} className="mt-1 text-xs text-rose-400">{fieldErrors.estimatedHours}</p> : null}
      </div>
      <button className="btn md:col-span-1" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Course'}</button>
      {error ? <p className="text-sm text-rose-400 md:col-span-6" role="status" aria-live="polite">{error}</p> : null}
    </form>
  );
}
