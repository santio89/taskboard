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
  isDone?: boolean;
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', color: '#6b7280' },
  { id: 'todo', title: 'To Do', color: '#7c3aed' },
  { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'review', title: 'Review', color: '#8b5cf6' },
  { id: 'done', title: 'Done', color: '#10b981', isDone: true },
];

export const PRESET_COLUMNS: Column[] = [
  { id: 'preset-backlog', title: 'Backlog', color: '#6b7280' },
  { id: 'preset-todo', title: 'To Do', color: '#7c3aed' },
  { id: 'preset-in-progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'preset-review', title: 'Review', color: '#8b5cf6' },
  { id: 'preset-done', title: 'Done', color: '#10b981', isDone: true },
  { id: 'preset-blocked', title: 'Blocked', color: '#ef4444' },
  { id: 'preset-qa', title: 'QA', color: '#06b6d4' },
  { id: 'preset-deployed', title: 'Deployed', color: '#14b8a6', isDone: true },
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

/** 19 preset colors for the color picker: default column colors + full spectrum. 20th slot in UI is "custom" (pipette). 2 rows of 10. */
export const COLOR_PICKER_PRESETS: string[] = [
  /* Row 1: red → orange → yellow → lime → green */
  '#6b7280', /* grey - Backlog */
  '#ef4444', /* red */
  '#f97316', /* orange */
  '#f59e0b', /* amber - In Progress */
  '#eab308', /* yellow */
  '#84cc16', /* lime */
  '#22c55e', /* green */
  '#10b981', /* emerald - Done */
  '#14b8a6', /* teal */
  '#06b6d4', /* cyan */
  /* Row 2: blue → violet → purple → pink */
  '#0ea5e9', /* sky */
  '#3b82f6', /* blue */
  '#6366f1', /* indigo */
  '#8b5cf6', /* violet - Review */
  '#7c3aed', /* purple - To Do */
  '#a855f7', /* purple light */
  '#d946ef', /* fuchsia */
  '#ec4899', /* pink */
  '#f43f5e', /* rose */
];
