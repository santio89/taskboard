import { describe, it, expect, beforeEach } from 'vitest';
import * as taskStore from '../store/taskStore';

describe('taskStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no tasks exist', () => {
    expect(taskStore.getTasks()).toEqual([]);
  });

  it('adds a task and retrieves it', () => {
    const task = taskStore.addTask('Test Task', 'Description', 'medium', 'col-1');
    expect(task.id).toBeTruthy();
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Description');
    expect(task.priority).toBe('medium');
    expect(task.columnId).toBe('col-1');
    expect(task.order).toBe(0);
    expect(task.tags).toEqual([]);
    expect(task.createdAt).toBeTruthy();

    const tasks = taskStore.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
  });

  it('adds task with optional fields', () => {
    const subtasks = [{ id: 'sub-1', title: 'Subtask 1', done: false }];
    const task = taskStore.addTask(
      'Full Task', 'Desc', 'high', 'col-1',
      ['tag1', 'tag2'], '2026-01-01', '2026-02-01', subtasks, '2h'
    );
    expect(task.tags).toEqual(['tag1', 'tag2']);
    expect(task.startDate).toBe('2026-01-01');
    expect(task.dueDate).toBe('2026-02-01');
    expect(task.subtasks).toEqual(subtasks);
    expect(task.estimate).toBe('2h');
  });

  it('increments order for tasks in same column', () => {
    taskStore.addTask('Task 1', '', 'low', 'col-1');
    const task2 = taskStore.addTask('Task 2', '', 'low', 'col-1');
    expect(task2.order).toBe(1);
  });

  it('updates a task', () => {
    const task = taskStore.addTask('Original', '', 'low', 'col-1');
    const updated = taskStore.updateTask(task.id, { title: 'Updated', priority: 'high' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
    expect(updated!.priority).toBe('high');
    expect(updated!.description).toBe('');
  });

  it('returns null when updating non-existent task', () => {
    const result = taskStore.updateTask('nonexistent', { title: 'Nope' });
    expect(result).toBeNull();
  });

  it('deletes a task', () => {
    const task = taskStore.addTask('To Delete', '', 'low', 'col-1');
    expect(taskStore.deleteTask(task.id)).toBe(true);
    expect(taskStore.getTasks()).toHaveLength(0);
  });

  it('returns false when deleting non-existent task', () => {
    expect(taskStore.deleteTask('nonexistent')).toBe(false);
  });

  it('deletes tasks by column', () => {
    taskStore.addTask('Task A', '', 'low', 'col-1');
    taskStore.addTask('Task B', '', 'low', 'col-1');
    taskStore.addTask('Task C', '', 'low', 'col-2');

    taskStore.deleteTasksByColumn('col-1');
    const remaining = taskStore.getTasks();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].columnId).toBe('col-2');
  });

  it('gets tasks by column sorted by order', () => {
    taskStore.addTask('First', '', 'low', 'col-1');
    taskStore.addTask('Second', '', 'low', 'col-1');
    taskStore.addTask('Other', '', 'low', 'col-2');

    const col1Tasks = taskStore.getTasksByColumn('col-1');
    expect(col1Tasks).toHaveLength(2);
    expect(col1Tasks[0].title).toBe('First');
    expect(col1Tasks[1].title).toBe('Second');
  });

  it('reorders tasks in column', () => {
    const t1 = taskStore.addTask('First', '', 'low', 'col-1');
    const t2 = taskStore.addTask('Second', '', 'low', 'col-1');
    const t3 = taskStore.addTask('Third', '', 'low', 'col-1');

    taskStore.reorderInColumn('col-1', [t3.id, t1.id, t2.id]);

    const tasks = taskStore.getTasksByColumn('col-1');
    expect(tasks[0].title).toBe('Third');
    expect(tasks[1].title).toBe('First');
    expect(tasks[2].title).toBe('Second');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('kanban-tasks', 'not valid json{{{');
    expect(taskStore.getTasks()).toEqual([]);
  });

  it('handles non-array localStorage value gracefully', () => {
    localStorage.setItem('kanban-tasks', '"a string"');
    expect(taskStore.getTasks()).toEqual([]);
  });
});
