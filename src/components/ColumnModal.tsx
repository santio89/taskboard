import { useState, useRef, useEffect } from 'react';
import type { Column } from '../types';
import { COLUMN_COLORS, TITLE_MAX_LENGTH } from '../types';
import { X, Pipette } from 'lucide-react';

interface ColumnModalProps {
  isOpen: boolean;
  column: Column | null;
  onSave: (title: string, color: string) => void;
  onClose: () => void;
}

export function ColumnModal({ isOpen, column, onSave, onClose }: ColumnModalProps) {
  const [title, setTitle] = useState(() => column?.title ?? '');
  const [color, setColor] = useState(() => column?.color ?? COLUMN_COLORS[0]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    onSave(title.trim(), color);
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
            <label>Color</label>
            <div className="color-picker">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${c === color ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <label className="color-swatch custom-color-swatch" style={{ backgroundColor: color }}>
                <Pipette size={14} />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="color-input-hidden"
                />
              </label>
            </div>
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
