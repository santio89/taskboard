import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'above' | 'below';
  className?: string;
}

export function Tooltip({ text, children, position = 'below', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (!text) return;
    showTimeoutRef.current = setTimeout(() => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const padding = 6;
      setCoords({
        left: rect.left + rect.width / 2,
        top: position === 'above' ? rect.top - padding : rect.bottom + padding,
      });
      setVisible(true);
    }, 400);
  }, [text, position]);

  const hide = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
  }, []);

  const tooltipEl = visible && text && (
    <div
      className="tooltip-portal"
      style={{
        position: 'fixed',
        left: coords.left,
        top: coords.top,
        transform: position === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
        marginTop: position === 'above' ? -4 : 0,
      }}
    >
      {text}
    </div>
  );

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        title=""
        className={className}
        style={{ display: 'inline-block' }}
      >
        {children}
      </span>
      {typeof document !== 'undefined' && createPortal(tooltipEl, document.body)}
    </>
  );
}
