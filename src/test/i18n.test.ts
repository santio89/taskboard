import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLanguage } from '../utils/i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('returns English translation by default', () => {
    expect(t('header.settings')).toBe('Settings');
  });

  it('returns Spanish translation after switching language', () => {
    setLanguage('es');
    expect(t('header.settings')).toBe('Ajustes');
  });

  it('returns the key itself when translation is missing', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('translates settings keys correctly', () => {
    expect(t('settings.theme')).toBe('Theme');
    expect(t('settings.language')).toBe('Language');
    expect(t('settings.animations')).toBe('Animations');
    expect(t('settings.animationsEnabled')).toBe('Yes');
    expect(t('settings.animationsDisabled')).toBe('No');
  });

  it('translates settings keys to Spanish', () => {
    setLanguage('es');
    expect(t('settings.theme')).toBe('Tema');
    expect(t('settings.language')).toBe('Idioma');
    expect(t('settings.animations')).toBe('Animaciones');
    expect(t('settings.animationsEnabled')).toBe('Sí');
    expect(t('settings.animationsDisabled')).toBe('No');
  });

  it('translates analytics keys', () => {
    expect(t('analytics.basic')).toBe('Basic analytics');
    expect(t('analytics.advanced')).toBe('Advanced analytics');
    setLanguage('es');
    expect(t('analytics.basic')).toBe('Analíticas básicas');
    expect(t('analytics.advanced')).toBe('Analíticas avanzadas');
  });

  it('translates header keys', () => {
    expect(t('header.transfer')).toBe('Transfer');
    expect(t('header.exportBoard')).toBe('Export board');
    expect(t('header.importBoard')).toBe('Import board');
    setLanguage('es');
    expect(t('header.transfer')).toBe('Transferir');
    expect(t('header.exportBoard')).toBe('Exportar tablero');
    expect(t('header.importBoard')).toBe('Importar tablero');
  });
});
