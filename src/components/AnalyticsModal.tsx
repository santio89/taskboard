import { useMemo } from 'react';
import type { Task, Column } from '../types';
import { X, AlertTriangle, CheckCircle2, BarChart3, ListChecks } from 'lucide-react';

interface AnalyticsModalProps {
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

export function AnalyticsModal({ isOpen, tasks, columns, onClose }: AnalyticsModalProps) {
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdue = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate + 'T00:00:00') < now;
    }).length;

    const withSubtasks = tasks.filter((t) => t.subtasks && t.subtasks.length > 0);
    const totalSubtasks = withSubtasks.reduce((sum, t) => sum + (t.subtasks?.length ?? 0), 0);
    const doneSubtasks = withSubtasks.reduce((sum, t) => sum + (t.subtasks?.filter((s) => s.done).length ?? 0), 0);
    const subtaskRate = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;

    const DONE_KW = ['done', 'complete', 'completed', 'deployed', 'finished', 'resolved', 'closed'];
    const doneColIds = new Set(columns.filter((c) => DONE_KW.some((kw) => c.title.toLowerCase().includes(kw))).map((c) => c.id));
    const completedTasks = tasks.filter((t) => doneColIds.has(t.columnId)).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const priorityCounts = { high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => priorityCounts[t.priority]++);

    const columnData = columns.map((c) => ({
      id: c.id,
      title: c.title,
      color: c.color,
      count: tasks.filter((t) => t.columnId === c.id).length,
    }));
    const maxColumnCount = Math.max(1, ...columnData.map((c) => c.count));

    const tagCounts: Record<string, number> = {};
    tasks.forEach((t) => t.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxTagCount = Math.max(1, ...topTags.map(([, c]) => c));

    const timelineMap: Record<string, number> = {};
    tasks.forEach((t) => {
      const day = t.createdAt.slice(0, 10);
      timelineMap[day] = (timelineMap[day] || 0) + 1;
    });
    const sortedDays = Object.keys(timelineMap).sort();
    const last14 = sortedDays.slice(-14);
    const timelineData = last14.map((d) => ({ date: d, count: timelineMap[d] }));

    return { overdue, subtaskRate, totalSubtasks, doneSubtasks, completedTasks, completionRate, priorityCounts, columnData, maxColumnCount, topTags, maxTagCount, timelineData };
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
      const endAngle = cumulative * 360;
      segments.push({ color: PRIORITY_COLORS[key].fill, label: PRIORITY_COLORS[key].label, count, startAngle, endAngle });
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
      <div className="modal modal-analytics" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Analytics</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="analytics-content">
          {/* Stat cards */}
          <div className="analytics-stats">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <BarChart3 size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{tasks.length}</span>
                <span className="stat-label">Total Tasks</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--priority-low-bg)', color: 'var(--priority-low-text)' }}>
                <CheckCircle2 size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.completionRate}%</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--priority-high-bg)', color: 'var(--priority-high-text)' }}>
                <AlertTriangle size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.overdue}</span>
                <span className="stat-label">Overdue</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--priority-med-bg)', color: 'var(--priority-med-text)' }}>
                <ListChecks size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.subtaskRate}%</span>
                <span className="stat-label">Subtasks Done</span>
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            {/* Column distribution */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">Tasks by Column</h3>
              <div className="bar-chart">
                {stats.columnData.map((c) => (
                  <div key={c.id} className="bar-row">
                    <span className="bar-label">{c.title}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(c.count / stats.maxColumnCount) * 100}%`, background: c.color }}
                      />
                    </div>
                    <span className="bar-value">{c.count}</span>
                  </div>
                ))}
                {stats.columnData.length === 0 && <p className="analytics-empty">No columns</p>}
              </div>
            </div>

            {/* Priority donut */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">Priority Breakdown</h3>
              {priorityTotal > 0 ? (
                <div className="donut-chart-wrap">
                  <svg viewBox="0 0 120 120" className="donut-chart">
                    {donutSegments.length === 1 ? (
                      <circle cx="60" cy="60" r="45" fill="none" stroke={donutSegments[0].color} strokeWidth="16" />
                    ) : (
                      donutSegments.map((seg, i) => (
                        <path
                          key={i}
                          d={describeArc(60, 60, 45, seg.startAngle, seg.endAngle)}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="16"
                          strokeLinecap="round"
                        />
                      ))
                    )}
                    <text x="60" y="58" textAnchor="middle" className="donut-center-value">{priorityTotal}</text>
                    <text x="60" y="72" textAnchor="middle" className="donut-center-label">tasks</text>
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
                <p className="analytics-empty">No tasks</p>
              )}
            </div>

            {/* Timeline */}
            <div className="analytics-card analytics-card-wide">
              <h3 className="analytics-card-title">Tasks Created (Last 14 days)</h3>
              {stats.timelineData.length > 0 ? (
                <div className="timeline-chart">
                  <svg viewBox={`0 0 ${Math.max(stats.timelineData.length * 40, 100)} 80`} className="timeline-svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
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
                          <path d={area} fill="url(#tl-grad)" />
                          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          {pts.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)" />
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
                <p className="analytics-empty">No data yet</p>
              )}
            </div>

            {/* Top tags */}
            {stats.topTags.length > 0 && (
              <div className="analytics-card analytics-card-wide">
                <h3 className="analytics-card-title">Top Tags</h3>
                <div className="bar-chart">
                  {stats.topTags.map(([tag, count]) => (
                    <div key={tag} className="bar-row">
                      <span className="bar-label">{tag}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${(count / stats.maxTagCount) * 100}%`, background: 'var(--accent)' }}
                        />
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
