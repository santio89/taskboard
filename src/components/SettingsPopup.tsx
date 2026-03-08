import type { Settings, Language } from '../hooks/useSettings';
import type { Theme } from '../hooks/useTheme';
import { t } from '../utils/i18n';

interface SettingsPopupProps {
  settings: Settings;
  theme: Theme;
  onUpdate: (patch: Partial<Settings>) => void;
  onThemeChange: (theme: Theme) => void;
}

export function SettingsPopup({ settings, theme, onUpdate, onThemeChange }: SettingsPopupProps) {
  return (
    <div className="settings-popup">
      <div className="settings-popup-title">{t('settings.title')}</div>

      <div className="settings-popup-row">
        <span className="settings-popup-label">{t('settings.theme')}</span>
        <div className="settings-lang-group">
          <button
            type="button"
            className={`settings-lang-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => onThemeChange('dark')}
          >
            {t('settings.themeDark')}
          </button>
          <button
            type="button"
            className={`settings-lang-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => onThemeChange('light')}
          >
            {t('settings.themeLight')}
          </button>
        </div>
      </div>

      <div className="settings-popup-row">
        <span className="settings-popup-label">{t('settings.language')}</span>
        <div className="settings-lang-group">
          <button
            type="button"
            className={`settings-lang-btn ${settings.language === 'en' ? 'active' : ''}`}
            onClick={() => onUpdate({ language: 'en' as Language })}
          >
            Eng
          </button>
          <button
            type="button"
            className={`settings-lang-btn ${settings.language === 'es' ? 'active' : ''}`}
            onClick={() => onUpdate({ language: 'es' as Language })}
          >
            Esp
          </button>
        </div>
      </div>

      <div className="settings-popup-row">
        <span className="settings-popup-label">{t('settings.animations')}</span>
        <div className="settings-lang-group">
          <button
            type="button"
            className={`settings-lang-btn ${settings.animationsEnabled ? 'active' : ''}`}
            onClick={() => onUpdate({ animationsEnabled: true })}
          >
            {t('settings.animationsEnabled')}
          </button>
          <button
            type="button"
            className={`settings-lang-btn ${!settings.animationsEnabled ? 'active' : ''}`}
            onClick={() => onUpdate({ animationsEnabled: false })}
          >
            {t('settings.animationsDisabled')}
          </button>
        </div>
      </div>
    </div>
  );
}
