import type { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { deleteAttachmentsByTask } from './attachmentStore';

const STORAGE_KEY = 'kanban-tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

export function getTasks(): Task[] {
  return loadTasks();
}

export function getTasksByColumn(columnId: string): Task[] {
  return loadTasks()
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.order - b.order);
}

export function addTask(
  title: string,
  description: string,
  priority: Task['priority'],
  columnId: string,
  tags: string[] = [],
  startDate?: string,
  dueDate?: string,
  subtasks?: { id: string; title: string; done: boolean }[],
  estimate?: string,
): Task {
  const tasks = loadTasks();
  const columnTasks = tasks.filter((t) => t.columnId === columnId);
  const newTask: Task = {
    id: uuidv4(),
    title,
    description,
    priority,
    columnId,
    order: columnTasks.length,
    createdAt: new Date().toISOString(),
    tags,
    startDate,
    dueDate,
    subtasks,
    estimate,
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null {
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(tasks);
  return tasks[idx];
}

export function deleteTask(id: string): boolean {
  const tasks = loadTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  deleteAttachmentsByTask(id).catch(() => {});
  return true;
}

export function deleteTasksByColumn(columnId: string): void {
  const tasks = loadTasks();
  const toDelete = tasks.filter((t) => t.columnId === columnId);
  toDelete.forEach((t) => deleteAttachmentsByTask(t.id).catch(() => {}));
  saveTasks(tasks.filter((t) => t.columnId !== columnId));
}

export function reorderInColumn(columnId: string, taskIds: string[]): void {
  const tasks = loadTasks();
  taskIds.forEach((id, index) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.order = index;
      task.columnId = columnId;
    }
  });
  saveTasks(tasks);
}
