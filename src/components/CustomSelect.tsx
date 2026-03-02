import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** When true, option labels use 2-line clamp + tooltip on hover (e.g. for column names) */
  showOptionTooltip?: boolean;
}

export function CustomSelect({ id, value, options, onChange, showOptionTooltip = false }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        id={id}
        className={`custom-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={14} className={`chevron ${open ? 'rotated' : ''}`} />
      </button>
      {open && (
        <ul className="custom-select-menu">
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {showOptionTooltip ? (
                <Tooltip text={opt.label} position="below">
                  <span className="custom-select-option-label">{opt.label}</span>
                </Tooltip>
              ) : (
                opt.label
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
