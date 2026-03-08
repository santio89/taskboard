import { useMemo } from 'react';
import type { Task, Column } from '../types';
import { t } from '../utils/i18n';
import { X, BarChart3, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';

interface BasicAnalyticsModalProps {
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

const WITH_TAGS_COLOR = '#8b5cf6';
const WITHOUT_TAGS_COLOR = '#6b7280';

const GAUGE_ARC = Math.PI * 80; // ~251.33

export function BasicAnalyticsModal({ isOpen, tasks, columns, onClose }: BasicAnalyticsModalProps) {
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdue = tasks.filter((tk) => tk.dueDate && new Date(tk.dueDate + 'T00:00:00') < now).length;

    const withSub = tasks.filter((tk) => tk.subtasks && tk.subtasks.length > 0);
    const totalSub = withSub.reduce((s, tk) => s + (tk.subtasks?.length ?? 0), 0);
    const doneSub = withSub.reduce((s, tk) => s + (tk.subtasks?.filter((st) => st.done).length ?? 0), 0);
    const subtaskRate = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

    const doneColIds = new Set(columns.filter((c) => c.isDone).map((c) => c.id));
    const completedTasks = tasks.filter((tk) => doneColIds.has(tk.columnId)).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const priorityCounts = { high: 0, medium: 0, low: 0 };
    tasks.forEach((tk) => priorityCounts[tk.priority]++);

    let dueSoon = 0;
    let dueOnTrack = 0;
    let noDueDate = 0;
    tasks.forEach((tk) => {
      if (!tk.dueDate) { noDueDate++; return; }
      const due = new Date(tk.dueDate + 'T00:00:00');
      const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 2) dueSoon++;
      else if (diff > 2) dueOnTrack++;
    });

    const tasksWithTags = tasks.filter((tk) => tk.tags.length > 0).length;
    const tasksWithoutTags = tasks.length - tasksWithTags;

    return { overdue, subtaskRate, completionRate, priorityCounts, dueSoon, dueOnTrack, noDueDate, tasksWithTags, tasksWithoutTags };
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

  const tagDonutSegments = (() => {
    const total = tasks.length;
    if (total === 0) return [];
    const segments: { color: string; label: string; count: number; startAngle: number; endAngle: number }[] = [];
    let start = 0;
    for (const { count, color, label } of [
      { count: stats.tasksWithTags, color: WITH_TAGS_COLOR, label: t('analytics.tasksWithTags') },
      { count: stats.tasksWithoutTags, color: WITHOUT_TAGS_COLOR, label: t('analytics.tasksWithoutTags') },
    ]) {
      const pct = count / total;
      const end = start + 360 * pct;
      segments.push({ label, count, color, startAngle: start, endAngle: end });
      start = end;
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

  const dueSegments = [
    { key: 'overdue', color: '#ef4444', label: t('analytics.overdue'), count: stats.overdue },
    { key: 'soon', color: '#f59e0b', label: t('analytics.dueSoon'), count: stats.dueSoon },
    { key: 'onTrack', color: '#10b981', label: t('analytics.onTrack'), count: stats.dueOnTrack },
    { key: 'noDue', color: '#6b7280', label: t('analytics.noDueDate'), count: stats.noDueDate },
  ];
  const dueTotal = tasks.length;

  const gaugeColor = stats.completionRate >= 75 ? '#10b981' : stats.completionRate >= 40 ? '#f59e0b' : 'var(--accent)';
  const gaugeOffset = GAUGE_ARC * (1 - stats.completionRate / 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-analytics" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('analytics.basicTitle')}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="analytics-content">
          <div className="analytics-stats">
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
          </div>

          <div className="analytics-grid">
            {/* Priority Breakdown */}
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

            {/* Tag Breakdown — same row as Priority Breakdown */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.tagBreakdown')}</h3>
              {tagDonutSegments.length > 0 ? (
                <div className="donut-chart-wrap">
                  <svg viewBox="0 0 120 120" className="donut-chart">
                    {tagDonutSegments.length === 1 ? (
                      <circle cx="60" cy="60" r="45" fill="none" stroke={tagDonutSegments[0].color} strokeWidth="16" />
                    ) : (
                      tagDonutSegments.map((seg, i) => (
                        <path key={i} d={describeArc(60, 60, 45, seg.startAngle, seg.endAngle)} fill="none" stroke={seg.color} strokeWidth="16" strokeLinecap="round" />
                      ))
                    )}
                    <text x="60" y="58" textAnchor="middle" className="donut-center-value">{tasks.length}</text>
                    <text x="60" y="74" textAnchor="middle" className="donut-center-label">{t('analytics.tasks')}</text>
                  </svg>
                  <div className="donut-legend">
                    {tagDonutSegments.map((seg, i) => (
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

            {/* Completion Gauge */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.completionProgress')}</h3>
              <div className="gauge-wrap">
                <svg viewBox="0 0 200 110" className="gauge-svg">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" className="gauge-bg" />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    className="gauge-fill"
                    stroke={gaugeColor}
                    strokeDasharray={GAUGE_ARC}
                    strokeDashoffset={gaugeOffset}
                  />
                  <text x="100" y="85" className="gauge-value-text">{stats.completionRate}%</text>
                  <text x="100" y="106" className="gauge-label-text">{t('analytics.completed')}</text>
                </svg>
              </div>
            </div>

            {/* Due Date Status */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.dueStatus')}</h3>
              {dueTotal > 0 ? (
                <div className="stacked-bar-wrap">
                  <div className="stacked-bar">
                    {dueSegments.map((seg) =>
                      seg.count > 0 ? (
                        <div
                          key={seg.key}
                          className="stacked-bar-segment"
                          style={{ width: `${(seg.count / dueTotal) * 100}%`, background: seg.color }}
                        />
                      ) : null
                    )}
                  </div>
                  <div className="stacked-bar-legend">
                    {dueSegments.map((seg) => (
                      <div key={seg.key} className="stacked-bar-legend-item">
                        <span className="stacked-bar-legend-dot" style={{ background: seg.color }} />
                        <span className="stacked-bar-legend-label">{seg.label}</span>
                        <span className="stacked-bar-legend-count">{seg.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="analytics-empty">{t('analytics.noTasks')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
