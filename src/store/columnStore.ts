import type { Column } from '../types';
import { DEFAULT_COLUMNS, TITLE_MAX_LENGTH } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'kanban-columns';
const STORAGE_KEY_COLLAPSED = 'kanban-column-collapsed';

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLLAPSED);
    if (raw === null) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveCollapsed(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY_COLLAPSED, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save column collapsed state:', err);
  }
}

export function getColumnCollapsed(columnId: string): boolean {
  const map = loadCollapsed();
  return map[columnId] === true;
}

export function setColumnCollapsed(columnId: string, collapsed: boolean): void {
  const map = loadCollapsed();
  map[columnId] = collapsed;
  saveCollapsed(map);
}

function loadColumns(): Column[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_COLUMNS;
    return parsed;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

function saveColumns(columns: Column[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch (err) {
    console.error('Failed to save columns to localStorage:', err);
  }
}

export function getColumns(): Column[] {
  return loadColumns();
}

export function addColumn(title: string, color: string, isDone?: boolean): Column {
  const columns = loadColumns();
  const newColumn: Column = {
    id: uuidv4(),
    title: title.slice(0, TITLE_MAX_LENGTH),
    color,
    ...(isDone ? { isDone: true } : {}),
  };
  columns.push(newColumn);
  saveColumns(columns);
  return newColumn;
}

export function updateColumn(id: string, updates: Partial<Omit<Column, 'id'>>): Column | null {
  const columns = loadColumns();
  const idx = columns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const applied = { ...columns[idx], ...updates };
  if (typeof applied.title === 'string') applied.title = applied.title.slice(0, TITLE_MAX_LENGTH);
  columns[idx] = applied;
  saveColumns(columns);
  return columns[idx];
}

export function deleteColumn(id: string): boolean {
  const columns = loadColumns();
  const filtered = columns.filter((c) => c.id !== id);
  if (filtered.length === columns.length) return false;
  saveColumns(filtered);
  const collapsed = loadCollapsed();
  if (collapsed[id] !== undefined) {
    delete collapsed[id];
    saveCollapsed(collapsed);
  }
  return true;
}

export function reorderColumns(columnIds: string[]): void {
  const columns = loadColumns();
  const reordered = columnIds
    .map((id) => columns.find((c) => c.id === id))
    .filter((c): c is Column => c !== undefined);
  saveColumns(reordered);
}
