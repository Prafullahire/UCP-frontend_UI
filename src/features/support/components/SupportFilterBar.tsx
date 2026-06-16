import React, { useEffect, useRef, useState } from 'react';

export interface DropdownChoice {
  id: string;
  label: string;
}

interface DropdownChipProps {
  /** Selected option id (or `null` if nothing is selected). */
  value: string | null;
  defaultLabel: string;
  options: DropdownChoice[];
  /** Open dropdown to the right of the chip rather than left. */
  alignRight?: boolean;
  /** Whether to enable the search input. */
  searchable?: boolean;
  /** Whether the chip should appear active even with no value (used by date). */
  activeWhenSet?: boolean;
  onPick: (id: string, label: string) => void;
}

/**
 * Inline single-select dropdown used by the support filter strip. Uses the
 * same `.fc/.fc-dd` look-and-feel as the dashboard filter bar so visual
 * language stays consistent across modules.
 */
export const DropdownChip: React.FC<DropdownChipProps> = ({
  value,
  defaultLabel,
  options,
  alignRight,
  searchable,
  activeWhenSet = true,
  onPick,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const selected = options.find((o) => o.id === value) ?? null;
  const display = selected?.label ?? defaultLabel;
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const isOn = activeWhenSet && (selected !== null || open);

  return (
    <div className="sup-fc-wrap" style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className={`sup-fc ${isOn ? 'on' : ''}`}
        onClick={() => setOpen((p) => !p)}
      >
        <span>{display}</span>
        <span className="sup-fc-chev">▾</span>
      </button>
      {open && (
        <div className={`sup-fc-dd ${alignRight ? 'right' : ''}`}>
          {searchable && (
            <div className="sup-fc-dd-search">
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <div className="sup-fc-dd-body">
            {filtered.length === 0 ? (
              <div className="sup-fc-dd-empty">No results</div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.id}
                  className={`sup-fc-dd-i ${o.id === value ? 'on' : ''}`}
                  onClick={() => {
                    onPick(o.id, o.label);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface SupportFilterState {
  dateRange: 'last30' | 'custom';
  subCategory: string | null;
  status: string | null;
  sort: 'new' | 'old';
}

interface SupportFilterBarProps {
  state: SupportFilterState;
  onChange: (next: SupportFilterState) => void;
  subCategoryOptions: DropdownChoice[];
  statusOptions: DropdownChoice[];
}

/**
 * Pill-style filter row. Single-source of truth for filter state lives in
 * the parent (`SupportPage`) — this component only emits onChange.
 */
export const SupportFilterBar: React.FC<SupportFilterBarProps> = ({
  state,
  onChange,
  subCategoryOptions,
  statusOptions,
}) => {
  const dateOptions: DropdownChoice[] = [
    { id: 'last30', label: 'Last 30 days' },
    { id: 'custom', label: 'Custom date range' },
  ];

  const sortOptions: DropdownChoice[] = [
    { id: 'new', label: 'New to Old' },
    { id: 'old', label: 'Old to New' },
  ];

  return (
      <div className="sup-fbar">
      <div className="fb-lbl">Filters</div>
      <div className="fdiv" />

      <DropdownChip
        value={state.dateRange}
        defaultLabel="Date range"
        options={dateOptions}
        onPick={(id) => onChange({ ...state, dateRange: id as 'last30' | 'custom' })}
      />

      <DropdownChip
        value={state.subCategory}
        defaultLabel="Sub Category"
        options={subCategoryOptions}
        searchable
        onPick={(id) => onChange({ ...state, subCategory: id })}
      />

      <DropdownChip
        value={state.status}
        defaultLabel="Select Status"
        options={statusOptions}
        searchable
        onPick={(id) => onChange({ ...state, status: id })}
      />

      {(state.subCategory || state.status || state.sort !== 'new' || state.dateRange !== 'last30') && (
        <button
          type="button"
          onClick={() => onChange({ dateRange: 'last30', subCategory: null, status: null, sort: 'new' })}
          style={{
            background: 'none', border: 'none', color: 'var(--red)', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer', padding: '0 8px', textDecoration: 'underline'
          }}
        >
          Clear Filters
        </button>
      )}

      <div className="sup-fc-r">
        <DropdownChip
          value={state.sort}
          defaultLabel="Sort"
          options={sortOptions}
          alignRight
          onPick={(id) => onChange({ ...state, sort: id as 'new' | 'old' })}
        />
      </div>
    </div>
  );
};

export default SupportFilterBar;
