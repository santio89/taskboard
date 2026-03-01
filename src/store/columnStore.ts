import type { Column } from '../types';
import { DEFAULT_COLUMNS } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'kanban-columns';

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

export function addColumn(title: string, color: string): Column {
  const columns = loadColumns();
  const newColumn: Column = {
    id: uuidv4(),
    title,
    color,
  };
  columns.push(newColumn);
  saveColumns(columns);
  return newColumn;
}

export function updateColumn(id: string, updates: Partial<Omit<Column, 'id'>>): Column | null {
  const columns = loadColumns();
  const idx = columns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  columns[idx] = { ...columns[idx], ...updates };
  saveColumns(columns);
  return columns[idx];
}

export function deleteColumn(id: string): boolean {
  const columns = loadColumns();
  const filtered = columns.filter((c) => c.id !== id);
  if (filtered.length === columns.length) return false;
  saveColumns(filtered);
  return true;
}

export function reorderColumns(columnIds: string[]): void {
  const columns = loadColumns();
  const reordered = columnIds
    .map((id) => columns.find((c) => c.id === id))
    .filter((c): c is Column => c !== undefined);
  saveColumns(reordered);
}
