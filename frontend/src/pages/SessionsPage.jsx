import { useState } from 'react';
import { api } from '../api/client.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import SessionForm from '../features/sessions/SessionForm.jsx';
import SessionsTable from '../features/sessions/SessionsTable.jsx';
import { useFetch } from '../hooks/useFetch.js';

export default function SessionsPage() {
  const sessions = useFetch(() => api.get('/sessions'), []);
  const courses = useFetch(() => api.get('/courses'), []);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshAll() {
    await Promise.all([sessions.reload(), courses.reload()]);
  }

  async function handleCreate(payload) {
    await api.post('/sessions', payload);
    await refreshAll();
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await api.delete(`/sessions/${pendingDelete.id}`);
      await refreshAll();
      setPendingDelete(null);
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  if (sessions.loading || courses.loading) {
    return <p className="text-muted">Loading sessions...</p>;
  }

  return (
    <div className="space-y-4">
      <SessionForm courses={courses.data || []} onSubmit={handleCreate} />
      {error ? <p className="text-sm text-rose-400" role="alert">{error}</p> : null}
      {sessions.error ? <p className="text-sm text-rose-400" role="alert">{sessions.error}</p> : null}
      <SessionsTable sessions={sessions.data || []} onDelete={(session) => setPendingDelete(session)} />
      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete session?"
        description={pendingDelete ? `Remove the ${pendingDelete.durationMinutes}-minute session from ${pendingDelete.sessionDate}?` : ''}
        confirmLabel="Delete session"
        loading={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
