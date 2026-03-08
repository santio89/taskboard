import { useState, useRef, useEffect } from 'react';
import type { Column } from '../types';
import { COLOR_PICKER_PRESETS, TITLE_MAX_LENGTH } from '../types';
import { X, Pipette } from 'lucide-react';
import { ColorPickerPopover } from './ColorPickerPopover';
import { t } from '../utils/i18n';

function normalizeHex(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^([0-9a-f]{3})$/i);
  if (m) {
    const [a, b, c] = m[1];
    return `#${a}${a}${b}${b}${c}${c}`;
  }
  const m6 = hex.replace(/^#/, '').match(/^([0-9a-f]{6})$/i);
  return m6 ? `#${m6[1]}` : '#000000';
}

function hexToRgba(hex: string, alpha: number): string {
  const n = normalizeHex(hex).replace(/^#/, '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ColumnModalProps {
  isOpen: boolean;
  column: Column | null;
  onSave: (title: string, color: string, isDone: boolean) => void;
  onClose: () => void;
}

export function ColumnModal({ isOpen, column, onSave, onClose }: ColumnModalProps) {
  const [title, setTitle] = useState(() => column?.title ?? '');
  const [color, setColor] = useState(() => column?.color ?? COLOR_PICKER_PRESETS[0]);
  const [isDone, setIsDone] = useState(() => column?.isDone ?? false);
  const [error, setError] = useState('');
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const customSwatchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Column name is required');
      return;
    }
    setError('');
    onSave(title.trim(), color, isDone);
  };

  const isEditing = column !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Column' : 'New Column'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${error ? 'has-error' : ''}`}>
            <label htmlFor="col-title">Name</label>
            <input
              ref={inputRef}
              id="col-title"
              type="text"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Blocked, QA, Deployed..."
            />
            {error && <span className="field-error">{error}</span>}
          </div>

          <div className="form-group">
            <ColorPickerPopover
              id="col-color"
              value={color}
              onChange={setColor}
              open={customPickerOpen}
              onClose={() => setCustomPickerOpen(false)}
              onOpenRequest={() => setCustomPickerOpen(true)}
              anchorRef={customSwatchRef}
              renderTrigger={({ onOpen }) => (
                <>
                  <label htmlFor="col-color">Color</label>
                  <div className="color-picker-modal-grid">
                    <button
                      ref={customSwatchRef}
                      type="button"
                      className="color-picker-modal-custom"
                      style={{
                        backgroundColor: normalizeHex(color),
                        ['--custom-picker-shadow' as string]: `0 2px 10px ${hexToRgba(color, 0.55)}`,
                        ['--custom-picker-shadow-hover' as string]: `0 2px 14px ${hexToRgba(color, 0.7)}`,
                      }}
                      onClick={onOpen}
                      aria-label="Custom color"
                      title="Custom color"
                    >
                      <Pipette size={16} className="color-picker-modal-custom-icon" />
                    </button>
                    {COLOR_PICKER_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-picker-modal-swatch ${normalizeHex(c) === normalizeHex(color) ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(normalizeHex(c))}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </>
              )}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isDone}
                onChange={(e) => setIsDone(e.target.checked)}
              />
              <span>{t('column.markDone')}</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Add Column'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
