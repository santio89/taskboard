import { useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'es';

export interface Settings {
  language: Language;
  animationsEnabled: boolean;
}

const SETTINGS_KEY = 'kanban-settings';

const DEFAULTS: Settings = {
  language: 'en',
  animationsEnabled: true,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return { ...DEFAULTS };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-lang', settings.language);
    document.documentElement.classList.toggle('no-animations', !settings.animationsEnabled);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, updateSettings };
}
