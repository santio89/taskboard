import { useState } from 'react';
import { PRESET_COLUMNS } from '../types';
import { X } from 'lucide-react';
import { t } from '../utils/i18n';

interface PresetsModalProps {
  isOpen: boolean;
  onAdd: (presets: { title: string; color: string; isDone?: boolean }[]) => void;
  onClose: () => void;
}

export function PresetsModal({ isOpen, onAdd, onClose }: PresetsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    const toAdd = PRESET_COLUMNS
      .filter((p) => selected.has(p.id))
      .map(({ title, color, isDone }) => ({ title, color, isDone }));
    if (toAdd.length > 0) onAdd(toAdd);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-presets" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('presets.title')}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="presets-hint">{t('presets.hint')}</p>

        <div className="presets-grid">
          {PRESET_COLUMNS.map((preset) => {
            const isSelected = selected.has(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggle(preset.id)}
              >
                <span className="preset-dot" style={{ backgroundColor: preset.color }} />
                <span className="preset-label">{preset.title}</span>
              </button>
            );
          })}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('modal.cancel')}</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selected.size === 0}
            onClick={handleSubmit}
          >
            {selected.size > 0
              ? `${t('presets.add')} ${selected.size} ${selected.size === 1 ? t('presets.columnSingular') : t('presets.columnPlural')}`
              : t('presets.addColumns')}
          </button>
        </div>
      </div>
    </div>
  );
}
