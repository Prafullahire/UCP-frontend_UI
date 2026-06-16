import React, { useEffect, useMemo, useState } from 'react';
import {
  PICKUP_STATUS_META,
  type PickupRequest,
} from '../data/pickupRequestData';

/**
 * Sortable column keys for the Pickup Requests grid. Mirrors the
 * sort-key pattern used by `OrdersGrid` / `ShipmentsGrid` so headers
 * cycle asc → desc → off identically across the Orders module.
 */
export type PickupSortKey =
  | 'index'
  | 'manifestId'
  | 'createdDate'
  | 'courier'
  | 'ordersCount'
  | 'status'
  | 'warehouse';

export type SortDir = 'asc' | 'desc';

export interface PickupSortState {
  key: PickupSortKey;
  dir: SortDir;
}

interface PickupRequestsGridProps {
  rows: PickupRequest[];
  sort: PickupSortState | null;
  onSortChange: (next: PickupSortState | null) => void;
  /** Fires on the "Export" (download manifest) icon click. */
  onExport: (row: PickupRequest) => void;
  /** Fires on the "Escalate" button click. */
  onEscalate: (row: PickupRequest) => void;
  /** Fires when manifest ID is clicked */
  onManifestClick?: (row: PickupRequest) => void;
}

interface ColumnSpec {
  key: PickupSortKey;
  label: string;
  /** When true, the column header is non-interactive (no asc/desc cycle). */
  staticHeader?: boolean;
}

/* Column set mirrors the supplied reference screenshot — the "#" column
   stays static (row index) while every other header drives sorting. */
const COLUMNS: ColumnSpec[] = [
  { key: 'index',       label: '#',                  staticHeader: true },
  { key: 'manifestId',  label: 'MANIFEST ID' },
  { key: 'createdDate', label: 'CREATED' },
  { key: 'courier',     label: 'COURIER' },
  { key: 'ordersCount', label: 'NUMBER OF ORDERS' },
  { key: 'status',      label: 'STATUS' },
  { key: 'warehouse',   label: 'WAREHOUSE' },
];

/* ── Icon glyphs (sized to fit the row action area) ───────────── */
const DownloadIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2v8M4.5 7L8 10.5 11.5 7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12.5h10" strokeLinecap="round" />
  </svg>
);

/** Shared sort comparator — `null` returns rows untouched. */
function sortRows(rows: PickupRequest[], sort: PickupSortState | null): PickupRequest[] {
  if (!sort || sort.key === 'index') return rows;
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (sort.key) {
      case 'manifestId':  return a.manifestId.localeCompare(b.manifestId) * dir;
      case 'createdDate': return (a.createdDate + a.createdTime).localeCompare(b.createdDate + b.createdTime) * dir;
      case 'courier':     return a.courier.localeCompare(b.courier) * dir;
      case 'ordersCount': return (a.ordersCount - b.ordersCount) * dir;
      case 'status':      return a.status.localeCompare(b.status) * dir;
      case 'warehouse':   return a.warehouse.localeCompare(b.warehouse) * dir;
      default:            return 0;
    }
  });
}

/**
 * Pickup Requests grid — re-uses the shared `.ord-tbl` table recipe so
 * the visual language matches the Pending grid / Shipments grid pixel
 * for pixel. The row action column hosts the two existing platform
 * primitives requested by the brief:
 *
 *   • Export — icon button styled with `.ord-icobtn` (same as the
 *     header download / bulk update buttons on the Orders page).
 *   • Escalate — secondary CTA styled with `.ord-cta.ord-cta-s` (same
 *     secondary button family used by the "+ Reverse Order" CTA in
 *     the Orders page header).
 */
export const PickupRequestsGrid: React.FC<PickupRequestsGridProps> = ({
  rows,
  sort,
  onSortChange,
  onExport,
  onEscalate,
  onManifestClick,
}) => {
  const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);

  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [rows, sort]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const handleSort = (col: ColumnSpec) => {
    if (col.staticHeader) return;
    if (!sort || sort.key !== col.key) {
      onSortChange({ key: col.key, dir: 'asc' });
      return;
    }
    if (sort.dir === 'asc') {
      onSortChange({ key: col.key, dir: 'desc' });
      return;
    }
    onSortChange(null);
  };

  return (
    <div className="ord-grid">
      <div className="ord-grid-scroll">
        <table className="ord-tbl">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const isActive = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={`${c.staticHeader ? '' : 'sortable'} ${isActive ? 'on' : ''}`}
                    onClick={() => handleSort(c)}
                    aria-sort={
                      isActive
                        ? sort!.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <span className="ord-th-i">
                      {c.label}
                      {!c.staticHeader && (
                        <span className="ord-th-arr" aria-hidden="true">
                          {isActive ? (sort!.dir === 'asc' ? '▲' : '▼') : ''}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--ink3)',
                    fontSize: 12,
                  }}
                >
                  No pickup requests match the current filters.
                </td>
              </tr>
            ) : (
              paginated.map((r, idx) => {
                const meta = PICKUP_STATUS_META[r.status];
                return (
                  <tr key={r.manifestId}>
                    <td>
                      <div className="ord-meta" style={{ color: 'var(--ink2)', fontWeight: 500 }}>
                        {idx + 1}
                      </div>
                    </td>
                    <td>
                      <a
                        className="ord-id"
                        onClick={(e) => {
                          e.preventDefault();
                          onManifestClick?.(r);
                        }}
                        href="#"
                      >
                        {r.manifestId}
                      </a>
                    </td>
                    <td>
                      <div className="ord-date" style={{ fontWeight: 500, color: 'var(--ink)' }}>
                        {r.createdDate}
                      </div>
                      <div className="ord-meta">{r.createdTime}</div>
                    </td>
                    <td>
                      <div className="ord-name" style={{ marginBottom: 0 }}>{r.courier}</div>
                    </td>
                    <td>
                      <div className="ord-pay-amt" style={{ fontSize: 13 }}>
                        {r.ordersCount}
                      </div>
                    </td>
                    <td>
                      <span className={`ord-status ${meta.variant}`}>
                        {meta.label.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="ord-name" style={{ marginBottom: 0 }}>{r.warehouse}</div>
                    </td>
                    <td>
                      <div className="ord-act-cell">
                        <button
                          type="button"
                          className="ord-icobtn"
                          title="Export manifest"
                          aria-label={`Export manifest ${r.manifestId}`}
                          onClick={() => onExport(r)}
                        >
                          {DownloadIcon}
                        </button>
                        <button
                          type="button"
                          className="ord-cta ord-cta-s ord-cta-sm"
                          onClick={() => onEscalate(r)}
                        >
                          Escalate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer — same recipe used by every other Orders grid */}
      <div className="ord-foot">
        <span>Items per page: {ITEMS_PER_PAGE}</span>
        <div className="ord-foot-pgw">
          <button 
            type="button" 
            className="ord-foot-pgb icon" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button 
              key={page} 
              type="button" 
              className={`ord-foot-pgb ${currentPage === page ? 'on' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button 
            type="button" 
            className="ord-foot-pgb icon" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickupRequestsGrid;
