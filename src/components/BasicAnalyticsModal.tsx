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

const DONE_KW = ['done', 'complete', 'completed', 'deployed', 'finished', 'resolved', 'closed'];

export function BasicAnalyticsModal({ isOpen, tasks, columns, onClose }: BasicAnalyticsModalProps) {
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

    return { overdue, subtaskRate, completionRate, priorityCounts, columnData, maxColumnCount };
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
          </div>
        </div>
      </div>
    </div>
  );
}
