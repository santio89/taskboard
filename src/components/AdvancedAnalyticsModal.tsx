import { useMemo, useState } from 'react';
import type { Task, Column } from '../types';
import { t } from '../utils/i18n';
import { X, BarChart3, CheckCircle2, AlertTriangle, ListChecks, TrendingUp, CalendarDays } from 'lucide-react';

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


const GAUGE_ARC = Math.PI * 80;

const WITH_TAGS_COLOR = '#8b5cf6';
const WITHOUT_TAGS_COLOR = '#6b7280';

export function AdvancedAnalyticsModal({ isOpen, tasks, columns, onClose }: AdvancedAnalyticsModalProps) {
  const [tasksByView, setTasksByView] = useState<'column' | 'tag'>('column');
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

    const columnData = columns.map((c) => ({
      id: c.id,
      title: c.title,
      color: c.color,
      count: tasks.filter((tk) => tk.columnId === c.id).length,
    }));
    const maxColumnCount = Math.max(1, ...columnData.map((c) => c.count));

    // Due date status
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

    // Tags
    const tagCounts: Record<string, number> = {};
    tasks.forEach((tk) => tk.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const tagData = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    const maxTagCount = Math.max(1, ...topTags.map(([, c]) => c));
    const totalTagUses = tagData.reduce((s, [, c]) => s + c, 0);
    const tasksWithTags = tasks.filter((tk) => tk.tags.length > 0).length;
    const tasksWithoutTags = tasks.length - tasksWithTags;

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

    // Avg tasks per column
    const avgTasksPerColumn = columns.length > 0 ? Math.round((tasks.length / columns.length) * 10) / 10 : 0;

    // Tasks with due dates
    const withDueDate = tasks.filter((tk) => tk.dueDate).length;
    const dueDateRate = tasks.length > 0 ? Math.round((withDueDate / tasks.length) * 100) : 0;

    // Task composition
    const total = tasks.length || 1;
    const composition = [
      { key: 'desc', pct: Math.round((tasks.filter((tk) => tk.description.trim()).length / total) * 100) },
      { key: 'subtasks', pct: Math.round((tasks.filter((tk) => tk.subtasks && tk.subtasks.length > 0).length / total) * 100) },
      { key: 'tags', pct: Math.round((tasks.filter((tk) => tk.tags.length > 0).length / total) * 100) },
      { key: 'due', pct: Math.round((withDueDate / total) * 100) },
      { key: 'estimate', pct: Math.round((tasks.filter((tk) => tk.estimate).length / total) * 100) },
    ];

    return {
      overdue, subtaskRate, totalSub, doneSub, completedTasks, completionRate,
      priorityCounts, columnData, maxColumnCount,
      topTags, maxTagCount, tagData, totalTagUses, tasksWithTags, tasksWithoutTags,
      timelineData,
      ageBuckets, maxAgeBucket,
      avgTasksPerColumn, dueDateRate, withDueDate,
      composition,
      dueSoon, dueOnTrack, noDueDate,
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

  const maxTimeline = Math.max(1, ...stats.timelineData.map((d) => d.count));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-analytics modal-analytics-advanced" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title-group">
            <h2>{t('analytics.title')}</h2>
            <span className="modal-header-subtitle">{t('analytics.advancedLabel')}</span>
          </div>
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

            {/* Task Details — same row as Priority Breakdown */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.taskComposition')}</h3>
              <div className="composition-chart">
                {stats.composition.map((item) => {
                  const labels: Record<string, string> = {
                    desc: t('analytics.withDescription'),
                    subtasks: t('analytics.withSubtasks'),
                    tags: t('analytics.withTags'),
                    due: t('analytics.withDueDateLabel'),
                    estimate: t('analytics.withEstimate'),
                  };
                  return (
                    <div key={item.key} className="composition-row">
                      <span className="composition-label">{labels[item.key]}</span>
                      <div className="composition-track">
                        <div className="composition-fill" style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="composition-value">{item.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tag Breakdown — donut like Priority */}
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

            {/* Tag Details */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.tagDetails')}</h3>
              <div className="tag-details-stats">
                <div className="tag-detail-row">
                  <span className="tag-detail-label">{t('analytics.uniqueTags')}</span>
                  <span className="tag-detail-value">{stats.tagData.length}</span>
                </div>
                <div className="tag-detail-row">
                  <span className="tag-detail-label">{t('analytics.totalTagUses')}</span>
                  <span className="tag-detail-value">{stats.totalTagUses}</span>
                </div>
                <div className="tag-detail-row">
                  <span className="tag-detail-label">{t('analytics.tasksWithTags')}</span>
                  <span className="tag-detail-value">{stats.tasksWithTags}</span>
                </div>
                <div className="tag-detail-row">
                  <span className="tag-detail-label">{t('analytics.tasksWithoutTags')}</span>
                  <span className="tag-detail-value">{stats.tasksWithoutTags}</span>
                </div>
              </div>
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
                    stroke={stats.completionRate >= 75 ? '#10b981' : stats.completionRate >= 40 ? '#f59e0b' : 'var(--accent)'}
                    strokeDasharray={GAUGE_ARC}
                    strokeDashoffset={GAUGE_ARC * (1 - stats.completionRate / 100)}
                  />
                  <text x="100" y="85" className="gauge-value-text">{stats.completionRate}%</text>
                  <text x="100" y="106" className="gauge-label-text">{t('analytics.completed')}</text>
                </svg>
              </div>
            </div>

            {/* Due Date Status */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.dueStatus')}</h3>
              {tasks.length > 0 ? (
                <div className="stacked-bar-wrap">
                  <div className="stacked-bar">
                    {[
                      { key: 'overdue', color: '#ef4444', count: stats.overdue },
                      { key: 'soon', color: '#f59e0b', count: stats.dueSoon },
                      { key: 'onTrack', color: '#10b981', count: stats.dueOnTrack },
                      { key: 'noDue', color: '#6b7280', count: stats.noDueDate },
                    ].map((seg) =>
                      seg.count > 0 ? (
                        <div
                          key={seg.key}
                          className="stacked-bar-segment"
                          style={{ width: `${(seg.count / tasks.length) * 100}%`, background: seg.color }}
                        />
                      ) : null
                    )}
                  </div>
                  <div className="stacked-bar-legend">
                    {[
                      { key: 'overdue', color: '#ef4444', label: t('analytics.overdue'), count: stats.overdue },
                      { key: 'soon', color: '#f59e0b', label: t('analytics.dueSoon'), count: stats.dueSoon },
                      { key: 'onTrack', color: '#10b981', label: t('analytics.onTrack'), count: stats.dueOnTrack },
                      { key: 'noDue', color: '#6b7280', label: t('analytics.noDueDate'), count: stats.noDueDate },
                    ].map((seg) => (
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

            {/* Task age distribution */}
            <div className="analytics-card">
              <h3 className="analytics-card-title">{t('analytics.taskAge')}</h3>
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

            {/* Tasks Created (Last 14 days) */}
            <div className="analytics-card">
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

            {/* Top tags */}
            {stats.topTags.length > 0 && (
              <div className="analytics-card analytics-card-wide">
                <h3 className="analytics-card-title">{t('analytics.topTags')}</h3>
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

            {/* Tasks by Column / Tag — full width, at end */}
            <div className="analytics-card analytics-card-wide">
              <div className="analytics-card-header-row">
                <h3 className="analytics-card-title">{tasksByView === 'column' ? t('analytics.tasksByColumn') : t('analytics.tasksByTag')}</h3>
                <div className="analytics-view-toggle">
                  <button
                    type="button"
                    className={`analytics-toggle-btn ${tasksByView === 'column' ? 'active' : ''}`}
                    onClick={() => setTasksByView('column')}
                  >
                    {t('analytics.tasksByColumn')}
                  </button>
                  <button
                    type="button"
                    className={`analytics-toggle-btn ${tasksByView === 'tag' ? 'active' : ''}`}
                    onClick={() => setTasksByView('tag')}
                  >
                    {t('analytics.tasksByTag')}
                  </button>
                </div>
              </div>
              {tasksByView === 'column' ? (
                <>
                  {stats.columnData.length > 0 ? (
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
                    </div>
                  ) : (
                    <p className="analytics-empty">{t('analytics.noColumns')}</p>
                  )}
                </>
              ) : (
                <>
                  {stats.tagData.length > 0 ? (
                    <div className="bar-chart">
                      {stats.tagData.map(([tag, count]) => (
                        <div key={tag} className="bar-row">
                          <span className="bar-label">{tag}</span>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${(count / stats.maxTagCount) * 100}%`, background: 'var(--accent)' }} />
                          </div>
                          <span className="bar-value">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="analytics-empty">{t('analytics.noTagsPresent')}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
