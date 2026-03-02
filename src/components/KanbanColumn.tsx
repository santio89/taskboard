import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, Column } from '../types';
import { TaskCard } from './TaskCard';
import { Tooltip } from './Tooltip';
import { Plus, GripHorizontal, Trash2, Scan, ChevronDown } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  isTaskOver?: boolean;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (id: string) => void;
}

export function KanbanColumn({ column, tasks, isTaskOver, onAddTask, onEditTask, onDeleteTask, onEditColumn, onDeleteColumn }: KanbanColumnProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `column-drop-${column.id}` });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: { type: 'column', column },
  });

  const style = {
    transform: CSS.Translate.toString(transform) ?? 'translate3d(0, 0, 0)',
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
          <button className="column-drag-handle" {...listeners} aria-label="Drag to reorder column">
            <GripHorizontal size={14} />
          </button>
          <span className="column-dot" style={{ backgroundColor: column.color, boxShadow: `0 0 6px ${column.color}bf, 0 0 10px ${column.color}66` }} />
          <Tooltip text={column.title} position="below">
            <h3 className="column-title">{column.title}</h3>
          </Tooltip>
          <span className="column-count">{tasks.length}</span>
          <button className={`column-collapse-btn ${collapsed ? 'collapsed' : ''}`} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="column-header-actions">
          <button
            className="icon-btn has-tooltip"
            onClick={() => onEditColumn(column)}
            aria-label="Open column"
            data-tooltip="Open column"
          >
            <Scan size={13} />
          </button>
          <button
            className="icon-btn danger has-tooltip"
            onClick={() => onDeleteColumn(column.id)}
            aria-label="Delete column"
            data-tooltip="Delete column"
          >
            <Trash2 size={13} />
          </button>
          <button className="icon-btn add-btn has-tooltip" onClick={() => onAddTask(column.id)} aria-label="Add task" data-tooltip="Add task">
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className={`column-body ${collapsed ? 'collapsed' : ''}`}>
        <div ref={setDroppableRef} className="column-tasks">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} highlightColor={isTaskOver ? column.color : null} onEdit={onEditTask} onDelete={onDeleteTask} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="column-empty">
              <p>No tasks yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
