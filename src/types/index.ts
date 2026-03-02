export type Priority = 'low' | 'medium' | 'high';

/** Max length for task titles and column titles */
export const TITLE_MAX_LENGTH = 256;

/** Max length for tags and time estimate */
export const TAG_AND_ESTIMATE_MAX_LENGTH = 64;

/** Max length for a single tag */
export const TAG_MAX_LENGTH = 32;

/** Max length for task description */
export const DESCRIPTION_MAX_LENGTH = 4096;

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  columnId: string;
  order: number;
  createdAt: string;
  tags: string[];
  startDate?: string;
  dueDate?: string;
  subtasks?: Subtask[];
  estimate?: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280' },
  { id: 'todo', title: 'To Do', color: '#7c3aed' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'review', title: 'Review', color: '#8b5cf6' },
  { id: 'done', title: 'Done', color: '#10b981' },
];

export const PRESET_COLUMNS: Column[] = [
  { id: 'preset-backlog', title: 'Backlog', color: '#6b7280' },
  { id: 'preset-todo', title: 'To Do', color: '#7c3aed' },
  { id: 'preset-in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'preset-review', title: 'Review', color: '#8b5cf6' },
  { id: 'preset-done', title: 'Done', color: '#10b981' },
  { id: 'preset-blocked', title: 'Blocked', color: '#ef4444' },
  { id: 'preset-qa', title: 'QA', color: '#06b6d4' },
  { id: 'preset-deployed', title: 'Deployed', color: '#14b8a6' },
  { id: 'preset-design', title: 'Design', color: '#ec4899' },
  { id: 'preset-ideas', title: 'Ideas', color: '#f97316' },
  { id: 'preset-bugs', title: 'Bugs', color: '#ef4444' },
  { id: 'preset-ready', title: 'Ready', color: '#84cc16' },
];

export const COLUMN_COLORS = [
  '#6b7280', '#ef4444', '#f59e0b', '#10b981',
  '#3b82f6', '#7c3aed', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];
