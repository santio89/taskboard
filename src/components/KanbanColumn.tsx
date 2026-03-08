import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, Column } from '../types';
import * as columnStore from '../store/columnStore';
import { TaskCard } from './TaskCard';
import { Tooltip } from './Tooltip';
import { Plus, GripHorizontal, Trash2, Scan, ChevronDown } from 'lucide-react';
import { t } from '../utils/i18n';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  isTaskOver?: boolean;
  isDragActive?: boolean;
  animationsEnabled?: boolean;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (id: string) => void;
}

export function KanbanColumn({ column, tasks, isTaskOver, isDragActive, animationsEnabled = true, onAddTask, onEditTask, onDeleteTask, onEditColumn, onDeleteColumn }: KanbanColumnProps) {
  const [collapsed, setCollapsed] = useState(() => columnStore.getColumnCollapsed(column.id));
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `column-drop-${column.id}` });

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      columnStore.setColumnCollapsed(column.id, next);
      return next;
    });
  };

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: { type: 'column', column },
  });

  const columnTransition = animationsEnabled
    ? (transition?.trim() || 'transform 200ms cubic-bezier(0.22, 0.68, 0, 1)')
    : undefined;
  const style = {
    transform: CSS.Transform.toString(transform) ?? 'translate3d(0, 0, 0)',
    transition: isDragging ? undefined : columnTransition,
    opacity: isDragging ? 0.4 : 1,
    ...(isDragging ? {
      borderColor: column.color,
      boxShadow: `0 0 0 1px ${column.color}88, 0 0 16px ${column.color}33`,
    } : {}),
    ...(isTaskOver ? {
      borderColor: column.color,
      boxShadow: `0 0 0 1px ${column.color}, 0 0 20px ${column.color}33`,
    } : {}),
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`kanban-column ${isTaskOver ? 'column-over' : ''} ${isDragging ? 'column-dragging' : ''}`}
      {...attributes}
    >
      <div className="column-header">
        <div className="column-title-group">
          <button className="column-drag-handle" {...listeners} aria-label={t('column.dragReorder')}>
            <GripHorizontal size={14} />
          </button>
          <span className="column-dot" style={{ backgroundColor: column.color, boxShadow: `0 0 6px ${column.color}bf, 0 0 10px ${column.color}66` }} />
          <Tooltip text={column.title} position="below">
            <h3 className="column-title">{column.title}</h3>
          </Tooltip>
          <span className="column-count">{tasks.length}</span>
          <button className={`column-collapse-btn ${collapsed ? 'collapsed' : ''}`} onClick={handleToggleCollapsed} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="column-header-actions">
          <button
            className="icon-btn has-tooltip"
            onClick={() => onEditColumn(column)}
            aria-label={t('column.open')}
            data-tooltip={t('column.open')}
          >
            <Scan size={13} />
          </button>
          <button
            className="icon-btn danger has-tooltip"
            onClick={() => onDeleteColumn(column.id)}
            aria-label={t('column.delete')}
            data-tooltip={t('column.delete')}
          >
            <Trash2 size={13} />
          </button>
          <button className="icon-btn add-btn has-tooltip" onClick={() => onAddTask(column.id)} aria-label={t('column.addTask')} data-tooltip={t('column.addTask')}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className={`column-body ${collapsed ? 'collapsed' : ''}`}>
        <div ref={setDroppableRef} className="column-tasks">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout={false}
                  initial={animationsEnabled && !isDragActive ? { opacity: 0, height: 0, scale: 0.98 } : false}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={isDragActive
                    ? { opacity: 0, height: 0, transition: { duration: 0 } }
                    : animationsEnabled
                      ? { opacity: 0, height: 0, scale: 0.98, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }
                      : { opacity: 0, height: 0, transition: { duration: 0 } }
                  }
                  transition={!animationsEnabled || isDragActive
                    ? { duration: 0 }
                    : { duration: 0.2, ease: [0.22, 0.68, 0, 1] }
                  }
                  style={{ overflow: isDragActive ? 'visible' : 'hidden' }}
                >
                  <TaskCard task={task} highlightColor={isTaskOver ? column.color : null} isDragActive={isDragActive} onEdit={onEditTask} onDelete={onDeleteTask} />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>
          {tasks.length === 0 && (
            <div className="column-empty">
              <p>{t('column.noTasks')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
