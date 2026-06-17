import React, { useState } from 'react';

export interface FilterChip {
  id: string;
  label: string;
  /** Inserts a vertical divider before this chip */
  dividerBefore?: boolean;
}

interface FilterBarProps {
  chips: FilterChip[];
  /** Initially-selected chip id (defaults to the first chip) */
  defaultActiveId?: string;
  onFilterChange?: (id: string) => void;
}

/**
 * Compact horizontal filter pill row. Single-select for now — the source
 * dashboard only highlights one pill per row. Selection lives locally
 * because no real filtering is wired up yet.
 */
export const FilterBar: React.FC<FilterBarProps> = ({ chips, defaultActiveId, onFilterChange }) => {
  const [activeId, setActiveId] = useState<string>(defaultActiveId ?? chips[0]?.id ?? '');

  return (
    <div className="fbar">
      <div className="fb-lbl">Filters</div>
      <div className="fdiv" />
      {chips.map((c) => (
        <React.Fragment key={c.id}>
          {c.dividerBefore && <div className="fdiv" />}
          <button
            type="button"
            className={`fc ${activeId === c.id ? 'on' : ''}`}
            onClick={() => {
              setActiveId(c.id);
              if (onFilterChange) onFilterChange(c.id);
            }}
          >
            {c.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FilterBar;
