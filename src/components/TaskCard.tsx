import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { Trash2, GripVertical, Scan, Clock, Paperclip, Calendar, CheckSquare, Timer } from 'lucide-react';
import * as attachmentStore from '../store/attachmentStore';
import { renderInlineMarkdown } from '../utils/markdown';
import { Tooltip } from './Tooltip';

interface TaskCardProps {
  task: Task;
  highlightColor?: string | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  low: { label: 'Low', class: 'priority-low' },
  medium: { label: 'Med', class: 'priority-medium' },
  high: { label: 'High', class: 'priority-high' },
};

export function TaskCard({ task, highlightColor, onEdit, onDelete }: TaskCardProps) {
  const [attachmentCount, setAttachmentCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    attachmentStore.getAttachmentsByTask(task.id)
      .then((a) => { if (!cancelled) setAttachmentCount(a.length); })
      .catch(() => { if (!cancelled) setAttachmentCount(0); });
    return () => { cancelled = true; };
  }, [task.id, task]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform) ?? 'translate3d(0, 0, 0)',
    opacity: isDragging ? 0.4 : 1,
    ...(highlightColor ? {
      borderColor: highlightColor,
      boxShadow: `0 0 0 1px ${highlightColor}44, 0 0 12px ${highlightColor}22`,
    } : {}),
  };

  const timeAgo = getTimeAgo(task.createdAt);
  const prio = priorityConfig[task.priority];

  return (
    <div ref={setNodeRef} style={style} className={`task-card ${isDragging ? 'dragging' : ''}`} {...attributes} title={undefined}>
      <div className="task-card-header">
        <button className="drag-handle" {...listeners} aria-label="Drag to reorder">
          <GripVertical size={16} />
        </button>
        <div className="task-card-actions">
          <button className="icon-btn has-tooltip" onClick={() => onEdit(task)} aria-label="Open task" data-tooltip="Open task">
            <Scan size={14} />
          </button>
          <button className="icon-btn danger has-tooltip" onClick={() => onDelete(task.id)} aria-label="Delete task" data-tooltip="Delete task">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <Tooltip text={task.title} position="below">
        <h4 className="task-title">{task.title}</h4>
      </Tooltip>
      {task.description && <p className="task-description" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(task.description) }} />}

      <div className="task-card-badges">
        <span className={`priority-badge ${prio.class}`}>{prio.label}</span>
        {task.tags.length > 0 && task.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      <div className="task-card-footer">
        {task.subtasks && task.subtasks.length > 0 && (
          <span className={`task-subtask-count ${task.subtasks.every((s) => s.done) ? 'all-done' : ''}`}>
            <CheckSquare size={11} /> {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
          </span>
        )}
        {attachmentCount > 0 && (
          <span className="task-attachment-count">
            <Paperclip size={11} /> {attachmentCount}
          </span>
        )}
        {task.dueDate && (
          <span className={`task-due-badge ${getDueStatus(task.dueDate)}`}>
            <Calendar size={11} /> {formatDueDate(task.dueDate)}
          </span>
        )}
        {task.estimate && (
          <span className="task-estimate">
            <Timer size={11} /> {task.estimate}
          </span>
        )}
        <span className="task-time">
          <Clock size={12} /> {timeAgo}
        </span>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getDueStatus(dateStr: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diff = due.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'overdue';
  if (days <= 2) return 'soon';
  return 'upcoming';
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < -1) return `${Math.abs(days)}d overdue`;
  if (days <= 7) return `${days}d left`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
