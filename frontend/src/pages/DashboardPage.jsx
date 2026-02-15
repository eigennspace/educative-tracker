import { Suspense, lazy } from 'react';
import { api } from '../api/client.js';
import ChartCard from '../components/ChartCard.jsx';
import StatCard from '../components/StatCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Heatmap from '../features/dashboard/Heatmap.jsx';
import { useFetch } from '../hooks/useFetch.js';

const WeeklyTrendChart = lazy(() => import('../features/dashboard/WeeklyTrendChart.jsx'));

function ChartFallback() {
  return <p className="text-sm text-muted">Loading chart...</p>;
}

export default function DashboardPage() {
  const summary = useFetch(() => api.get('/dashboard/summary'), []);
  const weekly = useFetch(() => api.get('/dashboard/weekly'), []);
  const heatmap = useFetch(() => api.get('/analytics/heatmap'), []);
  const insights = useFetch(() => api.get('/analytics/insights'), []);

  if (summary.loading || weekly.loading || heatmap.loading || insights.loading) {
    return <p className="text-muted">Loading dashboard...</p>;
  }

  if (summary.error || weekly.error || heatmap.error || insights.error) {
    return <p className="text-rose-400">Failed to load dashboard data.</p>;
  }

  const totalWeeklyHours = weekly.data.reduce((acc, item) => acc + (item.totalHours || 0), 0);
  const hasTrendUp = insights.data.trendDirection === 'up';

  return (
    <div className="space-y-6">
      <section className="panel-elevated p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Overview</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Learning command center</h2>
        <p className="mt-2 text-sm text-muted">
          {summary.data.activeCourses} active courses, {summary.data.totalStudyHours} total study hours, and a {summary.data.learningStreakDays}-day streak.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Courses" value={summary.data.activeCourses} />
        <StatCard label="Total Study Hours" value={summary.data.totalStudyHours} />
        <StatCard label="Learning Streak" value={`${summary.data.learningStreakDays} days`} />
        <StatCard label="Consistency" value={`${insights.data.consistencyScore}%`} hint="Last 30 days" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Weekly Learning Trend (12 weeks)">
          <p className="mb-3 text-xs text-muted">
            Total last 12 weeks: {Number(totalWeeklyHours.toFixed(2))} hours.
          </p>
          <Suspense fallback={<ChartFallback />}>
            <WeeklyTrendChart data={weekly.data} />
          </Suspense>
        </ChartCard>

        <ChartCard title="Study Heatmap (Recent 120 days)">
          <Heatmap days={heatmap.data.days} />
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="panel p-4">
          <h3 className="mb-3 text-sm font-medium">Course Completion</h3>
          <div className="space-y-3">
            {!summary.data.completion.length ? (
              <p className="text-sm text-muted">No course activity yet. Add a course to begin.</p>
            ) : null}
            {summary.data.completion.map((item) => (
              <div key={item.courseId}>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{item.title}</span>
                  <span>{item.progressPercentage}%</span>
                </div>
                <ProgressBar
                  value={item.progressPercentage}
                  label={`Progress for ${item.title}`}
                  valueText={`${item.progressPercentage}% complete`}
                />
              </div>
            ))}
          </div>
        </article>

        <article className="panel-elevated p-4">
          <h3 className="mb-3 text-sm font-medium">Productivity Insights</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>Best study day: <span className="text-ink">{insights.data.bestStudyDay || '-'}</span></li>
            <li>Best day minutes: <span className="text-ink">{insights.data.bestStudyDayMinutes}</span></li>
            <li>
              14-day trend:
              <span className={`ml-1 ${hasTrendUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                {insights.data.trendPercent}% ({insights.data.trendDirection})
              </span>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
