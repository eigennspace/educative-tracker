import { formatDateKey } from '../../lib/date.js';

export default function Heatmap({ days }) {
  const map = new Map(days.map((d) => [d.date, d]));
  const today = new Date();
  const cells = [];
  let activeDays = 0;
  let totalMinutes = 0;

  for (let i = 119; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatDateKey(date);
    const day = map.get(key);
    const intensity = day?.intensity || 0;
    const minutes = day?.totalMinutes || 0;
    if (minutes > 0) {
      activeDays += 1;
      totalMinutes += minutes;
    }

    const classes =
      intensity === 0
        ? 'bg-slate-800'
        : intensity === 1
          ? 'bg-teal-900'
          : intensity === 2
            ? 'bg-teal-700'
            : intensity === 3
              ? 'bg-teal-500'
              : 'bg-teal-300';

    cells.push(
      <div
        key={key}
        title={`${key}: ${minutes} mins`}
        aria-label={`${key}: ${minutes} minutes studied`}
        className={`h-3 w-3 rounded-[2px] ${classes}`}
      />
    );
  }

  return (
    <figure aria-label="Study activity heatmap">
      <figcaption className="mb-3 text-xs text-muted">
        Last 120 days: {activeDays} active days, {totalMinutes} total minutes.
      </figcaption>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
        {cells}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
        <span>Less</span>
        <span className="h-2 w-2 rounded-[2px] bg-slate-800" aria-hidden="true" />
        <span className="h-2 w-2 rounded-[2px] bg-teal-900" aria-hidden="true" />
        <span className="h-2 w-2 rounded-[2px] bg-teal-700" aria-hidden="true" />
        <span className="h-2 w-2 rounded-[2px] bg-teal-500" aria-hidden="true" />
        <span className="h-2 w-2 rounded-[2px] bg-teal-300" aria-hidden="true" />
        <span>More</span>
      </div>
    </figure>
  );
}
