import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYYYYMMDD(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function getDaysInView(year: number, month: number): { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const today = toYYYYMMDD(new Date());
  const out: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // leading padding (previous month)
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLast = new Date(prevYear, prevMonth + 1, 0).getDate();
  for (let i = 0; i < startPad; i++) {
    const day = prevLast - startPad + 1 + i;
    const date = new Date(prevYear, prevMonth, day);
    out.push({
      date: toYYYYMMDD(date),
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: toYYYYMMDD(date) === today,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    out.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === today,
    });
  }

  const remaining = 42 - out.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let day = 1; day <= remaining; day++) {
    const date = new Date(nextYear, nextMonth, day);
    out.push({
      date: toYYYYMMDD(date),
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: toYYYYMMDD(date) === today,
    });
  }

  return out;
}

function formatDisplayDate(value: string): string {
  if (!value) return '';
  const d = parseYYYYMMDD(value);
  if (!d) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerPopoverProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Title shown inside the calendar popover (e.g. "Start date", "End date") */
  title?: string;
}

export function DatePickerPopover({ id, value, onChange, placeholder = 'Pick a date', label, title }: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = parseYYYYMMDD(value);
      if (d) return d;
    }
    return new Date();
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && value) {
      const d = parseYYYYMMDD(value);
      if (d) setViewDate(d);
    }
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open) {
      setPopoverPosition(null);
      return;
    }
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopoverPosition({
      left: rect.left,
      top: rect.top - 6,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.date-picker-popover')) setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const days = getDaysInView(viewYear, viewMonth);
  const selectedDate = value || null;

  const goPrev = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const goNext = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  const handleSelect = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  const handleToday = () => {
    onChange(toYYYYMMDD(new Date()));
    setOpen(false);
  };

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const popoverContent = open && popoverPosition && (
    <div
      className="date-picker-popover date-picker-popover-fixed date-picker-popover-above"
      role="dialog"
      aria-label="Choose date"
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
    >
      {title && <div className="date-picker-popover-title">{title}</div>}
      <div className="date-picker-header">
        <span className="date-picker-month-label">{monthLabel}</span>
        <div className="date-picker-nav">
          <button type="button" className="date-picker-nav-btn" onClick={goPrev} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="date-picker-nav-btn" onClick={goNext} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="date-picker-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w} className="date-picker-weekday">{w}</span>
        ))}
      </div>
      <div className="date-picker-grid">
        {days.map((cell) => (
          <button
            key={cell.date}
            type="button"
            className={`date-picker-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''} ${selectedDate === cell.date ? 'selected' : ''}`}
            onClick={() => handleSelect(cell.date)}
          >
            {cell.day}
          </button>
        ))}
      </div>
      <div className="date-picker-footer">
        <button type="button" className="date-picker-footer-btn" onClick={handleClear}>
          Clear
        </button>
        <button type="button" className="date-picker-footer-btn primary" onClick={handleToday}>
          Today
        </button>
      </div>
    </div>
  );

  return (
    <div className="date-picker-wrap" ref={wrapRef}>
      {label && <label htmlFor={id}>{label}</label>}
      <button
        type="button"
        id={id}
        className="date-picker-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarIcon size={16} className="date-picker-icon" />
        <span className={`date-picker-value ${!value ? 'placeholder' : ''}`} data-placeholder={placeholder}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
      </button>
      {typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </div>
  );
}
