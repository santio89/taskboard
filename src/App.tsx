import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent, CollisionDetection, DropAnimation } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, Column, Priority, Subtask } from './types';
import { KanbanColumn } from './components/KanbanColumn';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { ColumnModal } from './components/ColumnModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PresetsModal } from './components/PresetsModal';
import { useTheme } from './hooks/useTheme';
import * as taskStore from './store/taskStore';
import * as columnStore from './store/columnStore';
import * as attachmentStore from './store/attachmentStore';
import { SearchBar } from './components/SearchBar';
import { fireConfetti } from './utils/confetti';
import { AnalyticsModal } from './components/AnalyticsModal';
import { ToastContainer } from './components/Toast';
import { showToast } from './utils/toast';
import { Sun, Moon, Plus, Columns3, LayoutTemplate, Download, Upload, BarChart3 } from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(() => taskStore.getTasks());
  const [columns, setColumns] = useState<Column[]>(() => columnStore.getColumns());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [dragSourceColumnId, setDragSourceColumnId] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [presetsModalOpen, setPresetsModalOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: 'Delete', onConfirm: () => {} });

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    columns.forEach((c) => (map[c.id] = []));
    const sorted = [...tasks].sort((a, b) => a.order - b.order);
    const lowerSearch = search.toLowerCase();
    sorted.forEach((t) => {
      if (map[t.columnId] === undefined) return;
      if (priorityFilter && t.priority !== priorityFilter) return;
      if (lowerSearch) {
        const matchTitle = t.title.toLowerCase().includes(lowerSearch);
        const matchDesc = t.description.toLowerCase().includes(lowerSearch);
        const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(lowerSearch));
        if (!matchTitle && !matchDesc && !matchTag) return;
      }
      map[t.columnId].push(t);
    });
    return map;
  }, [tasks, columns, search, priorityFilter]);

  const refreshTasks = useCallback(() => setTasks(taskStore.getTasks()), []);
  const refreshColumns = useCallback(() => setColumns(columnStore.getColumns()), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const dropAnimation: DropAnimation = {
    duration: 250,
    easing: 'cubic-bezier(0.22, 0.68, 0, 1)',
  };

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      if (activeColumn) {
        const filtered = {
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (c) => (c.id as string).startsWith('column-') && !(c.id as string).startsWith('column-drop-'),
          ),
        };
        return closestCenter(filtered);
      }
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) return pointerCollisions;
      return rectIntersection(args);
    },
    [activeColumn],
  );

  // --- Task handlers ---
  const handleAddTask = (columnId: string) => {
    setEditingTask(null);
    setDefaultColumnId(columnId);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setConfirmState({
      open: true,
      title: 'Delete Task',
      message: `This will permanently delete "${task?.title}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        taskStore.deleteTask(id);
        refreshTasks();
        setConfirmState((s) => ({ ...s, open: false }));
      },
    });
  };

  const handleSaveTask = async (data: {
    title: string;
    description: string;
    priority: Priority;
    columnId: string;
    tags: string[];
    startDate?: string;
    dueDate?: string;
    subtasks?: Subtask[];
    estimate?: string;
    pendingFiles?: File[];
  }) => {
    try {
      if (editingTask) {
        taskStore.updateTask(editingTask.id, data);
      } else {
        const newTask = taskStore.addTask(data.title, data.description, data.priority, data.columnId, data.tags, data.startDate, data.dueDate, data.subtasks, data.estimate);
        if (data.pendingFiles) {
          for (const file of data.pendingFiles) {
            await attachmentStore.addAttachment(newTask.id, file);
          }
        }
      }
      refreshTasks();
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch {
      showToast('Failed to save task', 'error');
    }
  };

  // --- Column handlers ---
  const handleOpenAddColumn = () => {
    setEditingColumn(null);
    setColumnModalOpen(true);
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    setColumnModalOpen(true);
  };

  const handleSaveColumn = (title: string, color: string) => {
    if (editingColumn) {
      columnStore.updateColumn(editingColumn.id, { title, color });
    } else {
      columnStore.addColumn(title, color);
    }
    refreshColumns();
    setColumnModalOpen(false);
    setEditingColumn(null);
  };

  const handleDeleteColumn = (id: string) => {
    const col = columns.find((c) => c.id === id);
    const taskCount = tasksByColumn[id]?.length ?? 0;
    const message = taskCount > 0
      ? `This will permanently delete "${col?.title}" and its ${taskCount} task(s). This action cannot be undone.`
      : `This will permanently delete the "${col?.title}" column. This action cannot be undone.`;
    setConfirmState({
      open: true,
      title: 'Delete Column',
      message,
      confirmLabel: 'Delete',
      onConfirm: () => {
        taskStore.deleteTasksByColumn(id);
        columnStore.deleteColumn(id);
        refreshColumns();
        refreshTasks();
        setConfirmState((s) => ({ ...s, open: false }));
      },
    });
  };

  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));

  const handleAddPresets = (presets: { title: string; color: string }[]) => {
    presets.forEach(({ title, color }) => columnStore.addColumn(title, color));
    refreshColumns();
    setPresetsModalOpen(false);
  };

  // --- Export/Import ---
  const handleExport = () => {
    const data = { tasks, columns, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-board-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (!data || typeof data !== 'object') {
            showToast('Invalid file format', 'error');
            return;
          }
          const hasColumns = data.columns && Array.isArray(data.columns);
          const hasTasks = data.tasks && Array.isArray(data.tasks);
          if (!hasColumns && !hasTasks) {
            showToast('No valid board data found in file', 'error');
            return;
          }
          if (hasColumns) {
            localStorage.setItem('kanban-columns', JSON.stringify(data.columns));
          }
          if (hasTasks) {
            localStorage.setItem('kanban-tasks', JSON.stringify(data.tasks));
          }
          refreshColumns();
          refreshTasks();
          showToast('Board imported successfully', 'success');
        } catch {
          showToast('Invalid file format', 'error');
        }
      };
      reader.onerror = () => {
        showToast('Failed to read file', 'error');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // --- Drag handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    setOverColumnId(null);
    if (activeId.startsWith('column-')) {
      const colId = activeId.replace('column-', '');
      const col = columns.find((c) => c.id === colId);
      setActiveColumn(col ?? null);
      setActiveTask(null);
    } else {
      const task = tasks.find((t) => t.id === activeId);
      setActiveTask(task ?? null);
      setActiveColumn(null);
      setDragSourceColumnId(task?.columnId ?? null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || activeColumn) {
      setOverColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (!activeTaskData) return;

    let targetColumnId: string | undefined;

    if (overId.startsWith('column-drop-')) {
      targetColumnId = overId.replace('column-drop-', '');
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      targetColumnId = overTask?.columnId;
    }

    setOverColumnId(targetColumnId ?? null);

    if (!targetColumnId || activeTaskData.columnId === targetColumnId) return;

    const overTask = tasks.find((t) => t.id === overId);

    setTasks((prev) => {
      const without = prev.filter((t) => t.id !== activeId);
      const colTasks = without
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order);

      const overIndex = overTask
        ? colTasks.findIndex((t) => t.id === overTask.id)
        : colTasks.length;
      const insertAt = overIndex === -1 ? colTasks.length : overIndex;

      colTasks.splice(insertAt, 0, { ...activeTaskData, columnId: targetColumnId! });
      colTasks.forEach((t, i) => (t.order = i));

      const otherTasks = without.filter((t) => t.columnId !== targetColumnId);
      return [...otherTasks, ...colTasks];
    });
  };

  const resolveColumnId = (rawId: string): string => {
    if (rawId.startsWith('column-drop-')) return rawId.slice('column-drop-'.length);
    if (rawId.startsWith('column-')) return rawId.slice('column-'.length);
    return rawId;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setOverColumnId(null);

    if (activeColumn) {
      setActiveColumn(null);
      if (!over) return;
      const activeColId = resolveColumnId(active.id as string);
      const overColId = resolveColumnId(over.id as string);
      if (activeColId !== overColId) {
        const oldIdx = columns.findIndex((c) => c.id === activeColId);
        const newIdx = columns.findIndex((c) => c.id === overColId);
        if (oldIdx !== -1 && newIdx !== -1) {
          const reordered = arrayMove(columns, oldIdx, newIdx);
          columnStore.reorderColumns(reordered.map((c) => c.id));
          refreshColumns();
        }
      }
      return;
    }

    const sourceColId = dragSourceColumnId;
    setActiveTask(null);
    setDragSourceColumnId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      persistCurrentState();
      checkConfetti(activeId, sourceColId);
      return;
    }

    const activeTaskData = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (activeTaskData && overTask && activeTaskData.columnId === overTask.columnId) {
      const columnId = activeTaskData.columnId;
      const columnTasks = tasksByColumn[columnId];
      const oldIdx = columnTasks.findIndex((t) => t.id === activeId);
      const newIdx = columnTasks.findIndex((t) => t.id === overId);

      if (oldIdx !== -1 && newIdx !== -1) {
        const reordered = arrayMove(columnTasks, oldIdx, newIdx);
        const ids = reordered.map((t) => t.id);
        taskStore.reorderInColumn(columnId, ids);
        refreshTasks();
        checkConfetti(activeId, sourceColId);
        return;
      }
    }

    persistCurrentState();
    checkConfetti(activeId, sourceColId);
  };

  const DONE_KEYWORDS = ['done', 'complete', 'completed', 'deployed', 'finished', 'resolved', 'closed'];

  const isDoneColumn = (colId: string): boolean => {
    const col = columns.find((c) => c.id === colId);
    if (!col) return false;
    return DONE_KEYWORDS.some((kw) => col.title.toLowerCase().includes(kw));
  };

  const checkConfetti = (taskId: string, sourceColId: string | null) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && sourceColId && task.columnId !== sourceColId && isDoneColumn(task.columnId)) {
      fireConfetti();
    }
  };

  const persistCurrentState = () => {
    const columnGroups: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!columnGroups[t.columnId]) columnGroups[t.columnId] = [];
      columnGroups[t.columnId].push(t);
    });
    Object.entries(columnGroups).forEach(([colId, colTasks]) => {
      const sorted = colTasks.sort((a, b) => a.order - b.order);
      taskStore.reorderInColumn(colId, sorted.map((t) => t.id));
    });
    refreshTasks();
  };

  useEffect(() => {
    const isAnyModalOpen = () => taskModalOpen || columnModalOpen || presetsModalOpen || confirmState.open || analyticsOpen;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      if (e.key === 'Escape') {
        if (isAnyModalOpen()) {
          setTaskModalOpen(false);
          setEditingTask(null);
          setColumnModalOpen(false);
          setEditingColumn(null);
          setPresetsModalOpen(false);
          setAnalyticsOpen(false);
          setConfirmState((s) => ({ ...s, open: false }));
          return;
        }
        if (searchExpanded) {
          setSearch('');
          setSearchExpanded(false);
          (target as HTMLElement).blur?.();
          return;
        }
      }

      if (isAnyModalOpen() || isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        if (columns.length > 0) {
          setEditingTask(null);
          setDefaultColumnId(columns[0].id);
          setTaskModalOpen(true);
        }
      } else if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      } else if (e.key === '/' ) {
        e.preventDefault();
        setSearchExpanded(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [taskModalOpen, columnModalOpen, presetsModalOpen, confirmState.open, analyticsOpen, searchExpanded, columns, toggleTheme]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8b5cf6"/>
                <stop offset="100%" stopColor="#6d28d9"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logo-g)"/>
            <rect x="6" y="8" width="5" height="16" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="13.5" y="6" width="5" height="20" rx="1.5" fill="white"/>
            <rect x="21" y="10" width="5" height="14" rx="1.5" fill="white" opacity="0.9"/>
          </svg>
          <h1>TASKBOARD</h1>
        </div>
        <SearchBar
          search={search}
          onSearchChange={setSearch}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          expanded={searchExpanded}
          onExpandedChange={setSearchExpanded}
        />
        <div className="header-right">
          <span className="task-count">{tasks.length} tasks</span>
          <button className="btn btn-secondary btn-sm has-tooltip" onClick={() => setAnalyticsOpen(true)} aria-label="Analytics" data-tooltip="Analytics">
            <BarChart3 size={16} />
          </button>
          <div className="btn-group">
            <button className="btn btn-secondary btn-sm has-tooltip" onClick={handleExport} aria-label="Export board" data-tooltip="Export">
              <Download size={16} />
            </button>
            <button className="btn btn-secondary btn-sm has-tooltip" onClick={handleImport} aria-label="Import board" data-tooltip="Import">
              <Upload size={16} />
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setPresetsModalOpen(true)}>
            <LayoutTemplate size={15} /> Presets
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAddColumn}>
            <Plus size={16} /> Add Column
          </button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="board-container">
        {columns.length === 0 ? (
          <div className="empty-board">
            <div className="empty-board-icon">
              <Columns3 size={48} />
            </div>
            <h2>No columns yet</h2>
            <p>Create your first column to start organizing tasks.</p>
            <div className="empty-board-actions">
              <button className="btn btn-secondary" onClick={() => setPresetsModalOpen(true)}>
                <LayoutTemplate size={18} /> Add Presets
              </button>
              <button className="btn btn-primary" onClick={handleOpenAddColumn}>
                <Plus size={18} /> Custom Column
              </button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((c) => `column-${c.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              <div className={`board${activeTask || activeColumn ? ' board-dragging' : ''}`}>
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    tasks={tasksByColumn[column.id] ?? []}
                    isTaskOver={overColumnId === column.id}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onEditColumn={handleEditColumn}
                    onDeleteColumn={handleDeleteColumn}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={dropAnimation}>
              {activeTask && (
                <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
              )}
              {activeColumn && (
                <div
                  className="kanban-column column-overlay"
                  style={{
                    borderColor: activeColumn.color,
                    boxShadow: `0 0 0 1px ${activeColumn.color}88, 0 0 16px ${activeColumn.color}33`,
                  }}
                >
                  <div className="column-header">
                    <div className="column-title-group">
                      <span className="column-dot" style={{ backgroundColor: activeColumn.color }} />
                      <h3 className="column-title">{activeColumn.title}</h3>
                      <span className="column-count">{tasksByColumn[activeColumn.id]?.length ?? 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {taskModalOpen && (
        <TaskModal
          isOpen={taskModalOpen}
          task={editingTask}
          defaultColumnId={defaultColumnId || columns[0]?.id || ''}
          columns={columns}
          onSave={handleSaveTask}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {columnModalOpen && (
        <ColumnModal
          isOpen={columnModalOpen}
          column={editingColumn}
          onSave={handleSaveColumn}
          onClose={() => {
            setColumnModalOpen(false);
            setEditingColumn(null);
          }}
        />
      )}

      {presetsModalOpen && (
        <PresetsModal
          isOpen={presetsModalOpen}
          onAdd={handleAddPresets}
          onClose={() => setPresetsModalOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <AnalyticsModal
        isOpen={analyticsOpen}
        tasks={tasks}
        columns={columns}
        onClose={() => setAnalyticsOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
