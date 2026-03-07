import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Pipette } from 'lucide-react';

// --- Color conversions (hex <-> RGB <-> HSL) ---
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace(/^#/, '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

function normalizeHex(hex: string): string {
  const m = hex.replace(/^#/, '').match(/^([0-9a-f]{3})$/i);
  if (m) {
    const [a, b, c] = m[1];
    return `#${a}${a}${b}${b}${c}${c}`;
  }
  const m6 = hex.replace(/^#/, '').match(/^([0-9a-f]{6})$/i);
  return m6 ? `#${m6[1]}` : '#000000';
}

const POPOVER_TITLE = 'Color picker';

interface ColorPickerPopoverProps {
  value: string;
  onChange: (color: string) => void;
  id?: string;
  label?: string;
  /** When set, presets are not shown in the popover; use with renderTrigger to show presets in the parent (e.g. modal). */
  open?: boolean;
  onClose?: () => void;
  /** Called when the user requests to open the custom picker (e.g. clicks the custom swatch). Use to set open to true in controlled mode. */
  onOpenRequest?: () => void;
  /** Ref for the element that opens the popover (e.g. custom swatch button). Used for positioning when open/onClose are provided. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** When provided, replaces the default trigger; call onOpen() to open the custom picker popover. */
  renderTrigger?: (props: { onOpen: () => void }) => React.ReactNode;
}

export function ColorPickerPopover({ value, onChange, id, label, open: controlledOpen, onClose, onOpenRequest, anchorRef, renderTrigger }: ColorPickerPopoverProps) {
  const normalized = normalizeHex(value);
  const rgb = hexToRgb(normalized);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onClose !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback((v: boolean) => {
    if (isControlled) { if (!v) onClose?.(); }
    else setInternalOpen(v);
  }, [isControlled, onClose]);

  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const slBoxRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'sl' | 'hue' | null>(null);

  const handleOpen = useCallback(() => {
    if (isControlled) onOpenRequest?.();
    else setInternalOpen(true);
  }, [isControlled, onOpenRequest]);

  useLayoutEffect(() => {
    if (!open) {
      setPopoverPosition(null);
      return;
    }
    const el = (anchorRef?.current ?? wrapRef.current) as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopoverPosition({
      left: rect.left,
      top: rect.top - 6,
    });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (wrapRef.current && !wrapRef.current.contains(target) && !target.closest('.color-picker-popover')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, setOpen]);

  const setFromHsl = useCallback((h: number, s: number, l: number) => {
    const { r, g, b } = hslToRgb(h, s, l);
    onChange(rgbToHex(r, g, b));
  }, [onChange]);

  const setFromRgb = useCallback((r: number, g: number, b: number) => {
    onChange(rgbToHex(r, g, b));
  }, [onChange]);

  // Saturation / Lightness box interaction
  const handleSlMove = useCallback((clientX: number, clientY: number) => {
    const el = slBoxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const s = x * 100;
    const l = (1 - y) * 100;
    setFromHsl(hsl.h, s, l);
  }, [hsl.h, setFromHsl]);

  const handleHueMove = useCallback((clientX: number) => {
    const el = hueBarRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const h = x * 360;
    setFromHsl(h, hsl.s, hsl.l);
  }, [hsl.s, hsl.l, setFromHsl]);

  useEffect(() => {
    if (dragging === null) return;
    const onMove = (e: MouseEvent) => {
      if (dragging === 'sl') handleSlMove(e.clientX, e.clientY);
      else if (dragging === 'hue') handleHueMove(e.clientX);
    };
    const onUp = () => setDragging(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [dragging, handleSlMove, handleHueMove]);

  const handleEyedropper = async () => {
    if (typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper === 'undefined') return;
    try {
      const eyeDropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) onChange(result.sRGBHex);
    } catch {
      // User cancelled or unsupported
    }
  };

  const hueGradient = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
  const slBackground = `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hsl.h}, 100%, 50%))`;

  const popoverContent = open && popoverPosition && (
    <div
      className="color-picker-popover color-picker-popover-fixed color-picker-popover-above"
      role="dialog"
      aria-label={POPOVER_TITLE}
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
    >
      <div className="color-picker-popover-title">{POPOVER_TITLE}</div>

      {/* Saturation / Lightness square */}
      <div
        ref={slBoxRef}
        className="color-picker-sl-box"
        style={{ background: slBackground }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.preventDefault();
            setDragging('sl');
            handleSlMove(e.clientX, e.clientY);
          }
        }}
        onClick={(e) => {
          handleSlMove(e.clientX, e.clientY);
        }}
        role="application"
        aria-label="Saturation and lightness"
      >
        <span
          className="color-picker-sl-handle"
          style={{
            left: `${hsl.s}%`,
            top: `${100 - hsl.l}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Hue strip + swatch + eyedropper */}
      <div className="color-picker-bar-row">
        <button
          type="button"
          className="color-picker-eyedropper-btn"
          onClick={handleEyedropper}
          aria-label="Pick color from screen"
          title="Pick color from screen"
        >
          <Pipette size={16} />
        </button>
        <span
          className="color-picker-preview-swatch"
          style={{ backgroundColor: normalized }}
          aria-hidden
        />
        <div
          ref={hueBarRef}
          className="color-picker-hue-bar"
          style={{ background: hueGradient }}
          onMouseDown={(e) => {
            if (e.button === 0) {
              e.preventDefault();
              setDragging('hue');
              handleHueMove(e.clientX);
            }
          }}
          onClick={(e) => {
            handleHueMove(e.clientX);
          }}
          role="slider"
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsl.h)}
        >
          <span
            className="color-picker-hue-handle"
            style={{ left: `${(hsl.h / 360) * 100}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* RGB inputs */}
      <div className="color-picker-rgb-row">
        {(['R', 'G', 'B'] as const).map((channel, i) => (
          <div key={channel} className="color-picker-rgb-field">
            <input
              type="number"
              min={0}
              max={255}
              value={[rgb.r, rgb.g, rgb.b][i]}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isNaN(v)) return;
                const next = [rgb.r, rgb.g, rgb.b] as [number, number, number];
                next[i] = Math.max(0, Math.min(255, v));
                setFromRgb(next[0], next[1], next[2]);
              }}
              className="color-picker-rgb-input"
              aria-label={`${channel} value`}
            />
            <span className="color-picker-rgb-label">{channel}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="color-picker-wrap" ref={wrapRef}>
      {renderTrigger ? (
        renderTrigger({ onOpen: handleOpen })
      ) : (
        <>
          {label && <label htmlFor={id}>{label}</label>}
          <button
            type="button"
            id={id}
            className="color-picker-trigger"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={POPOVER_TITLE}
          >
            <span className="color-picker-trigger-swatch" style={{ backgroundColor: normalized }} />
          </button>
        </>
      )}
      {typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </div>
  );
}
