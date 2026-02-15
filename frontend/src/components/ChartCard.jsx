export default function ChartCard({ title, children }) {
  return (
    <section className="panel p-4">
      <h3 className="mb-3 text-sm font-medium text-ink">{title}</h3>
      <div className="h-72 min-h-[18rem]">{children}</div>
    </section>
  );
}
