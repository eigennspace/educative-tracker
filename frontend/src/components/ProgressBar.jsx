export default function ProgressBar({ value, label = 'Progress', valueText }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full rounded-full bg-line"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
      aria-valuetext={valueText || `${safe}%`}
    >
      <div className="h-2 rounded-full bg-accent transition-[width] duration-300" style={{ width: `${safe}%` }} />
    </div>
  );
}
