import { describe, it, expect, beforeEach } from 'vitest';
import * as columnStore from '../store/columnStore';
import { DEFAULT_COLUMNS } from '../types';

describe('columnStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default columns when none stored', () => {
    const columns = columnStore.getColumns();
    expect(columns).toEqual(DEFAULT_COLUMNS);
  });

  it('adds a column', () => {
    localStorage.setItem('kanban-columns', '[]');
    const col = columnStore.addColumn('New Col', '#ff0000');
    expect(col.id).toBeTruthy();
    expect(col.title).toBe('New Col');
    expect(col.color).toBe('#ff0000');

    const columns = columnStore.getColumns();
    expect(columns).toHaveLength(1);
  });

  it('updates a column', () => {
    localStorage.setItem('kanban-columns', '[]');
    const col = columnStore.addColumn('Original', '#000');
    const updated = columnStore.updateColumn(col.id, { title: 'Renamed', color: '#fff' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Renamed');
    expect(updated!.color).toBe('#fff');
  });

  it('returns null when updating non-existent column', () => {
    expect(columnStore.updateColumn('fake-id', { title: 'X' })).toBeNull();
  });

  it('deletes a column', () => {
    localStorage.setItem('kanban-columns', '[]');
    const col = columnStore.addColumn('To Delete', '#000');
    expect(columnStore.deleteColumn(col.id)).toBe(true);
    expect(columnStore.getColumns()).toHaveLength(0);
  });

  it('returns false when deleting non-existent column', () => {
    localStorage.setItem('kanban-columns', '[]');
    expect(columnStore.deleteColumn('fake')).toBe(false);
  });

  it('reorders columns', () => {
    localStorage.setItem('kanban-columns', '[]');
    const c1 = columnStore.addColumn('A', '#111');
    const c2 = columnStore.addColumn('B', '#222');
    const c3 = columnStore.addColumn('C', '#333');

    columnStore.reorderColumns([c3.id, c1.id, c2.id]);
    const cols = columnStore.getColumns();
    expect(cols[0].title).toBe('C');
    expect(cols[1].title).toBe('A');
    expect(cols[2].title).toBe('B');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('kanban-columns', '{broken json');
    const columns = columnStore.getColumns();
    expect(columns).toEqual(DEFAULT_COLUMNS);
  });

  it('handles non-array localStorage value gracefully', () => {
    localStorage.setItem('kanban-columns', '42');
    expect(columnStore.getColumns()).toEqual(DEFAULT_COLUMNS);
  });
});
