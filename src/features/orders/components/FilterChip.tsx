import React, { useEffect, useRef, useState } from 'react';
import type { FilterOption } from '../types';

interface BaseProps {
  label: string;
  /** Optional leading icon (e.g. calendar / filter) */
  icon?: React.ReactNode;
  alignRight?: boolean;
}

/* ──────────────────────────── Single-select chip ──────────────────────────── */

interface SingleProps extends BaseProps {
  options: FilterOption[];
  value: string | null;
  /** Render mode: single-select */
  mode: 'single';
  onChange: (id: string | null) => void;
}

/* ──────────────────────────── Multi-select chip ──────────────────────────── */

interface MultiProps extends BaseProps {
  options: FilterOption[];
  values: string[];
  /** Render mode: multi-select */
  mode: 'multi';
  onChange: (values: string[]) => void;
  /** Label for the singular option count, e.g. "location" → "Pickup: 2 locations" */
  countNoun?: string;
}

type FilterChipProps = SingleProps | MultiProps;

/**
 * Inline filter pill used on the Orders page. Supports both single- and
 * multi-select via the `mode` prop so the call-site stays terse:
 *
 *     <FilterChip mode="single" label="Pickup" options={…} value={…} onChange={…} />
 *     <FilterChip mode="multi"  label="Channel" options={…} values={…} onChange={…} />
 */
export const FilterChip: React.FC<FilterChipProps> = (props) => {
  const { label, icon, alignRight, options } = props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const isMulti = props.mode === 'multi';
  const selectedCount = isMulti ? props.values.length : props.value ? 1 : 0;
  /* Multi-select: any selection turns the chip on.
     Single-select: only when the value is one of the current options
     (handles tab swaps where the underlying field is shared but the
     option set differs — e.g. dateRange used by both Date + EDD). */
  const isOn = isMulti
    ? props.values.length > 0
    : !!props.value && !!options.find((o) => o.id === props.value);

  const display = (() => {
    if (isMulti) {
      if (props.values.length === 0) return label;
      if (props.values.length === 1) {
        const opt = options.find((o) => o.id === props.values[0]);
        return `${label}: ${opt?.label ?? props.values[0]}`;
      }
      const noun = props.countNoun ?? 'selected';
      return `${label}: ${props.values.length} ${noun}`;
    }
    const selected = options.find((o) => o.id === props.value);
    return selected ? `${label}: ${selected.label}` : label;
  })();

  const togglePick = (id: string) => {
    if (props.mode === 'multi') {
      const next = props.values.includes(id)
        ? props.values.filter((v) => v !== id)
        : [...props.values, id];
      props.onChange(next);
    } else {
      props.onChange(props.value === id ? null : id);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`ord-fc ${isOn ? 'on' : ''}`}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon && <span className="ord-fc-ico">{icon}</span>}
        <span>{display}</span>
        <span className="ord-fc-chev">▾</span>
      </button>

      {open && (
        <div className={`ord-dd ${alignRight ? 'right' : ''}`} role="listbox">
          <div className="ord-dd-body">
            {options.map((opt) => {
              const checked = isMulti
                ? props.values.includes(opt.id)
                : props.value === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`ord-dd-i ${checked ? 'on' : ''}`}
                  onClick={() => togglePick(opt.id)}
                  role="option"
                  aria-selected={checked}
                >
                  {isMulti && <span className="cb" aria-hidden="true" />}
                  <span>{opt.label}</span>
                </div>
              );
            })}
          </div>
          {isMulti && selectedCount > 0 && (
            <div className="ord-dd-ft">
              <button
                type="button"
                className="lk"
                onClick={() => props.onChange([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="lk p"
                onClick={() => setOpen(false)}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterChip;
