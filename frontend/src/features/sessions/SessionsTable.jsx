export default function SessionsTable({ sessions, onDelete }) {
  if (!sessions.length) {
    return (
      <div className="rounded-xl border border-line bg-panel px-3 py-8 text-center text-sm text-muted">
        No study sessions yet. Log one from the form above.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {sessions.map((session) => (
          <article key={session.id} className="table-mobile-card space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">{session.courseTitle}</p>
              <button
                type="button"
                className="rounded-md border border-rose-400 px-2 py-1 text-xs text-rose-300 hover:bg-rose-900/20"
                onClick={() => onDelete(session)}
              >
                Delete
              </button>
            </div>
            <p className="text-xs text-muted">Date: {session.sessionDate}</p>
            <p className="text-xs text-muted">Duration: {session.durationMinutes} mins</p>
            <p className="text-xs text-muted">Notes: {session.notes || '-'}</p>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-line bg-panel md:block">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-slate-900/60 text-left text-muted">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-t border-line">
                <td className="px-3 py-3">{session.sessionDate}</td>
                <td className="px-3 py-3">{session.courseTitle}</td>
                <td className="px-3 py-3">{session.durationMinutes} mins</td>
                <td className="px-3 py-3 text-xs text-muted">{session.notes || '-'}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="rounded-md border border-rose-400 px-2 py-1 text-xs text-rose-300 hover:bg-rose-900/20"
                    onClick={() => onDelete(session)}
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
