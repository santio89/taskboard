import { useMemo } from 'react';
import type { Task, Column } from '../types';
import { t } from '../utils/i18n';
import { X, BarChart3, CheckCircle2, AlertTriangle, ListChecks, TrendingUp, Clock, Tag, CalendarDays } from 'lucide-react';

interface AdvancedAnalyticsModalProps {
  isOpen: boolean;
  tasks: Task[];
  columns: Column[];
  onClose: () => void;
}

const PRIORITY_COLORS = {
  high: { fill: '#ef4444', label: 'High' },
  medium: { fill: '#f59e0b', label: 'Medium' },
  low: { fill: '#10b981', label: 'Low' },
};

const DONE_KW = ['done', 'complete', 'completed', 'deployed', 'finished', 'resolved', 'closed'];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AdvancedAnalyticsModal({ isOpen, tasks, columns, onClose }: AdvancedAnalyticsModalProps) {
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdue = tasks.filter((tk) => tk.dueDate && new Date(tk.dueDate + 'T00:00:00') < now).length;

    const withSub = tasks.filter((tk) => tk.subtasks && tk.subtasks.length > 0);
    const totalSub = withSub.reduce((s, tk) => s + (tk.subtasks?.length ?? 0), 0);
    const doneSub = withSub.reduce((s, tk) => s + (tk.subtasks?.filter((st) => st.done).length ?? 0), 0);
    const subtaskRate = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

    const doneColIds = new Set(columns.filter((c) => DONE_KW.some((kw) => c.title.toLowerCase().includes(kw))).map((c) => c.id));
    const completedTasks = tasks.filter((tk) => doneColIds.has(tk.columnId)).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const priorityCounts = { high: 0, medium: 0, low: 0 };
    tasks.forEach((tk) => priorityCounts[tk.priority]++);

    const columnData = columns.map((c) => ({
      id: c.id,
      title: c.title,
      color: c.color,
      count: tasks.filter((tk) => tk.columnId === c.id).length,
    }));
    const maxColumnCount = Math.max(1, ...columnData.map((c) => c.count));

    // Tags
    const tagCounts: Record<string, number> = {};
    tasks.forEach((tk) => tk.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxTagCount = Math.max(1, ...topTags.map(([, c]) => c));

    // Timeline (last 14 days)
    const timelineMap: Record<string, number> = {};
    tasks.forEach((tk) => {
      const day = tk.createdAt.slice(0, 10);
      timelineMap[day] = (timelineMap[day] || 0) + 1;
    });
    const sortedDays = Object.keys(timelineMap).sort();
    const last14 = sortedDays.slice(-14);
    const timelineData = last14.map((d) => ({ date: d, count: timelineMap[d] }));

    // Task age distribution (days since creation)
    const ages = tasks.map((tk) => {
      const created = new Date(tk.createdAt);
      return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });
    const ageBuckets = [
      { label: t('analytics.today'), min: 0, max: 0, count: 0 },
      { label: '1-3d', min: 1, max: 3, count: 0 },
      { label: '4-7d', min: 4, max: 7, count: 0 },
      { label: '1-2w', min: 8, max: 14, count: 0 },
      { label: '2-4w', min: 15, max: 28, count: 0 },
      { label: '1m+', min: 29, max: Infinity, count: 0 },
    ];
    ages.forEach((age) => {
      const bucket = ageBuckets.find((b) => age >= b.min && age <= b.max);
      if (bucket) bucket.count++;
    });
    const maxAgeBucket = Math.max(1, ...ageBuckets.map((b) => b.count));

    // Workload by day of week
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    tasks.forEach((tk) => {
      const day = new Date(tk.createdAt).getDay();
      weekdayCounts[day]++;
    });
    const maxWeekday = Math.max(1, ...weekdayCounts);

    // Avg tasks per column
    const avgTasksPerColumn = columns.length > 0 ? Math.round((tasks.length / columns.length) * 10) / 10 : 0;

    // Tasks with due dates
    const withDueDate = tasks.filter((tk) => tk.dueDate).length;
    const dueDateRate = tasks.length > 0 ? Math.round((withDueDate / tasks.length) * 100) : 0;

    return {
      overdue, subtaskRate, totalSub, doneSub, completedTasks, completionRate,
      priorityCounts, columnData, maxColumnCount,
      topTags, maxTagCount, timelineData,
      ageBuckets, maxAgeBucket,
      weekdayCounts, maxWeekday,
      avgTasksPerColumn, dueDateRate, withDueDate,
    };
  }, [tasks, columns]);

  if (!isOpen) return null;

  const priorityTotal = stats.priorityCounts.high + stats.priorityCounts.medium + stats.priorityCounts.low;

  const donutSegments = (() => {
    if (priorityTotal === 0) return [];
    const segments: { color: string; label: string; count: number; startAngle: number; endAngle: number }[] = [];
    let cumulative = 0;
    for (const key of ['high', 'medium', 'low'] as const) {
      const count = stats.priorityCounts[key];
      if (count === 0) continue;
      const fraction = count / priorityTotal;
      const startAngle = cumulative * 360;
      cumulative += fraction;
      segments.push({ color: PRIORITY_COLORS[key].fill, label: PRIORITY_COLORS[key].label, count, startAngle, endAngle: cumulative * 360 });
    }
    return segments;
  })();

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const rad = (a: number) => ((a - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(startAngle));
    const y1 = cy + r * Math.sin(rad(startAngle));
    const x2 = cx + r * Math.cos(rad(endAngle));
    const y2 = cy + r * Math.sin(rad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const maxTimeline = Math.max(1, ...stats.timelineData.map((d) => d.count));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-analytics modal-analytics-advanced" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('analytics.advancedTitle')}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="analytics-content">
          {/* Stat cards — 6 across */}
          <div className="analytics-stats analytics-stats-6">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <BarChart3 size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{tasks.length}</span>
                <span className="stat-label">{t('analytics.totalTasks')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--priority-low-bg)', color: 'var(--priority-low-text)' }}>
                <CheckCircle2 size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.completionRate}%</span>
                <span className="stat-label">{t('analytics.completed')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--priority-high-bg)', color: 'var(--priority-high-text)' }}>
                <AlertTriangle size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.overdue}</span>
                <span className="stat-label">{t('analytics.overdue')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--priority-med-bg)', color: 'var(--priority-med-text)' }}>
                <ListChecks size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.subtaskRate}%</span>
                <span className="stat-label">{t('analytics.subtasksDone')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <TrendingUp size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.avgTasksPerColumn}</span>
                <span className="stat-label">{t('analytics.avgPerColumn')}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
                <CalendarDays size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.dueDateRate}%</span>
                <span className="stat-label">{t('analytics.withDueDate')}</span>
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            {/* Column distribution */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.tasksByColumn')}</h3>
              <div className="bar-chart">
                {stats.columnData.map((c) => (
                  <div key={c.id} className="bar-row">
                    <span className="bar-label">{c.title}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(c.count / stats.maxColumnCount) * 100}%`, background: c.color }} />
                    </div>
                    <span className="bar-value">{c.count}</span>
                  </div>
                ))}
                {stats.columnData.length === 0 && <p className="analytics-empty">{t('analytics.noColumns')}</p>}
              </div>
            </div>

            {/* Priority donut */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.priorityBreakdown')}</h3>
              {priorityTotal > 0 ? (
                <div className="donut-chart-wrap">
                  <svg viewBox="0 0 120 120" className="donut-chart">
                    {donutSegments.length === 1 ? (
                      <circle cx="60" cy="60" r="45" fill="none" stroke={donutSegments[0].color} strokeWidth="16" />
                    ) : (
                      donutSegments.map((seg, i) => (
                        <path key={i} d={describeArc(60, 60, 45, seg.startAngle, seg.endAngle)} fill="none" stroke={seg.color} strokeWidth="16" strokeLinecap="round" />
                      ))
                    )}
                    <text x="60" y="58" textAnchor="middle" className="donut-center-value">{priorityTotal}</text>
                    <text x="60" y="74" textAnchor="middle" className="donut-center-label">{t('analytics.tasks')}</text>
                  </svg>
                  <div className="donut-legend">
                    {donutSegments.map((seg, i) => (
                      <div key={i} className="legend-item">
                        <span className="legend-dot" style={{ background: seg.color }} />
                        <span className="legend-label">{seg.label}</span>
                        <span className="legend-count">{seg.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="analytics-empty">{t('analytics.noTasks')}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="analytics-card analytics-card-wide">
              <h3 className="analytics-card-title">{t('analytics.timeline')}</h3>
              {stats.timelineData.length > 0 ? (
                <div className="timeline-chart">
                  <svg viewBox={`0 0 ${Math.max(stats.timelineData.length * 40, 100)} 80`} className="timeline-svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="tl-grad-adv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const pts = stats.timelineData.map((d, i) => ({
                        x: i * 40 + 20,
                        y: 70 - (d.count / maxTimeline) * 60,
                      }));
                      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const area = `${line} L ${pts[pts.length - 1].x} 70 L ${pts[0].x} 70 Z`;
                      return (
                        <>
                          <path d={area} fill="url(#tl-grad-adv)" />
                          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {pts.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="timeline-labels">
                    {stats.timelineData.map((d) => (
                      <span key={d.date} className="timeline-label">
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="analytics-empty">{t('analytics.noData')}</p>
              )}
            </div>

            {/* Task age distribution */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">
                <Clock size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                {t('analytics.taskAge')}
              </h3>
              <div className="age-chart">
                {stats.ageBuckets.map((b) => (
                  <div key={b.label} className="age-bar-col">
                    <span className="age-bar-value">{b.count}</span>
                    <div className="age-bar-track">
                      <div
                        className="age-bar-fill"
                        style={{ height: `${(b.count / stats.maxAgeBucket) * 100}%` }}
                      />
                    </div>
                    <span className="age-bar-label">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workload by day of week */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">
                <CalendarDays size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                {t('analytics.workloadByDay')}
              </h3>
              <div className="age-chart">
                {stats.weekdayCounts.map((count, i) => (
                  <div key={i} className="age-bar-col">
                    <span className="age-bar-value">{count}</span>
                    <div className="age-bar-track">
                      <div
                        className="age-bar-fill age-bar-fill-alt"
                        style={{ height: `${(count / stats.maxWeekday) * 100}%` }}
                      />
                    </div>
                    <span className="age-bar-label">{WEEKDAY_LABELS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top tags */}
            {stats.topTags.length > 0 && (
              <div className="analytics-card analytics-card-wide">
                <h3 className="analytics-card-title">
                  <Tag size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                  {t('analytics.topTags')}
                </h3>
                <div className="bar-chart">
                  {stats.topTags.map(([tag, count]) => (
                    <div key={tag} className="bar-row">
                      <span className="bar-label">{tag}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(count / stats.maxTagCount) * 100}%`, background: 'var(--accent)' }} />
                      </div>
                      <span className="bar-value">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
