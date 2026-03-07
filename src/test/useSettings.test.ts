import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../hooks/useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-lang');
    document.documentElement.classList.remove('no-animations');
  });

  it('returns default settings', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      language: 'en',
      animationsEnabled: true,
    });
  });

  it('reads stored settings from localStorage', () => {
    localStorage.setItem('kanban-settings', JSON.stringify({ language: 'es', animationsEnabled: false }));
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.language).toBe('es');
    expect(result.current.settings.animationsEnabled).toBe(false);
  });

  it('merges partial stored settings with defaults', () => {
    localStorage.setItem('kanban-settings', JSON.stringify({ language: 'es' }));
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.language).toBe('es');
    expect(result.current.settings.animationsEnabled).toBe(true);
  });

  it('updates language', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ language: 'es' }));
    expect(result.current.settings.language).toBe('es');
  });

  it('updates animationsEnabled', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ animationsEnabled: false }));
    expect(result.current.settings.animationsEnabled).toBe(false);
  });

  it('persists settings to localStorage', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ language: 'es' }));
    const stored = JSON.parse(localStorage.getItem('kanban-settings')!);
    expect(stored.language).toBe('es');
  });

  it('sets data-lang attribute on document', () => {
    const { result } = renderHook(() => useSettings());
    expect(document.documentElement.getAttribute('data-lang')).toBe('en');
    act(() => result.current.updateSettings({ language: 'es' }));
    expect(document.documentElement.getAttribute('data-lang')).toBe('es');
  });

  it('toggles no-animations class on document', () => {
    const { result } = renderHook(() => useSettings());
    expect(document.documentElement.classList.contains('no-animations')).toBe(false);
    act(() => result.current.updateSettings({ animationsEnabled: false }));
    expect(document.documentElement.classList.contains('no-animations')).toBe(true);
    act(() => result.current.updateSettings({ animationsEnabled: true }));
    expect(document.documentElement.classList.contains('no-animations')).toBe(false);
  });
});
