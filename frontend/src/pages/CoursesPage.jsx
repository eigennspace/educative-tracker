import { useState } from 'react';
import { api } from '../api/client.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import CourseForm from '../features/courses/CourseForm.jsx';
import CoursesTable from '../features/courses/CoursesTable.jsx';
import { useFetch } from '../hooks/useFetch.js';

export default function CoursesPage() {
  const courses = useFetch(() => api.get('/courses'), []);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    await courses.reload();
  }

  async function handleCreate(payload) {
    await api.post('/courses', payload);
    await refresh();
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await api.delete(`/courses/${pendingDelete.id}`);
      await refresh();
      setPendingDelete(null);
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleLesson(courseId, lessonNumber, completed, options = {}) {
    try {
      setError('');
      await api.post(`/courses/${courseId}/progress/toggle`, {
        lessonNumber,
        completed,
        ...(options.applyToPrevious ? { applyToPrevious: true } : {})
      });
      await refresh();
    } catch (err) {
      setError(err.message || 'Progress update failed');
    }
  }

  if (courses.loading) {
    return <p className="text-muted">Loading courses...</p>;
  }

  return (
    <div className="space-y-4">
      <CourseForm onSubmit={handleCreate} />
      {error ? <p className="text-sm text-rose-400" role="alert">{error}</p> : null}
      {courses.error ? <p className="text-sm text-rose-400" role="alert">{courses.error}</p> : null}
      <CoursesTable
        courses={courses.data || []}
        onDelete={(course) => setPendingDelete(course)}
        onToggleLesson={handleToggleLesson}
      />
      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete course?"
        description={pendingDelete ? `This will permanently remove "${pendingDelete.title}" and its related sessions/progress.` : ''}
        confirmLabel="Delete course"
        loading={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
