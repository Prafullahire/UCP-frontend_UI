import React, { useMemo, useState,useEffect} from 'react';
import Toast from '../../../components/ui/Toast';
import { useReportsStore } from '../../../store/useReportsStore';
import FilterChip from '../../orders/components/FilterChip';
import ShipmentKpiStrip, {
  type KpiCardSpec,
} from '../../orders/components/ShipmentKpiStrip';
import {
  REMITTANCE_DATE_RANGE_OPTIONS,
  REMITTANCE_STATUSES,
  REMITTANCE_STATUS_META,
  REMITTANCES,
  computeRemittanceKpis,
  formatRupeesCompact,
  type RemittanceRecord,
} from './data/remittancesData';
import { remittanceApi } from '../../../services/remittanceApi';

/* ── Sort state ────────────────────────────────────────────────
   Mirrors the asc → desc → off cycle used by every grid in the
   platform so the interaction stays consistent. */
type RemittanceSortKey =
  | 'id'
  | 'codAmount'
  | 'status'
  | 'paymentDate'
  | 'freightDeductions'
  | 'remittanceAmount'
  | 'paymentRef';

type SortDir = 'asc' | 'desc';

interface RemittanceSortState {
  key: RemittanceSortKey;
  dir: SortDir;
}

interface ColumnSpec {
  key: RemittanceSortKey;
  label: string;
  /** Right-aligned (used by every numeric / amount column) */
  align?: 'right';
  /** Some columns aren't useful to sort by (e.g. download) */
  sortable?: boolean;
}

const COLUMNS: ColumnSpec[] = [
  { key: 'id',                label: 'REMITTANCE ID#',     sortable: true  },
  { key: 'codAmount',         label: 'COD AMOUNT',         sortable: true, align: 'right' },
  { key: 'status',            label: 'STATUS',             sortable: true  },
  { key: 'paymentDate',       label: 'PAYMENT DATE',       sortable: true  },
  { key: 'freightDeductions', label: 'FREIGHT DEDUCTIONS', sortable: true, align: 'right' },
  { key: 'remittanceAmount',  label: 'REMITTANCE AMOUNT',  sortable: true, align: 'right' },
  { key: 'paymentRef',        label: 'PAYMENT REF#',       sortable: true  },
];

const SearchIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="6.75" cy="6.75" r="4.25" />
    <path d="M10.25 10.25L13 13" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="2" width="12" height="11" rx="2" />
    <path d="M1 6h12M5 1v2M9 1v2" strokeLinecap="round" />
  </svg>
);

const StatusIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="7" cy="7" r="5.5" />
    <path d="M4.5 7l2 2 3-3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M7 9.5V2M4 6.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12h10" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Pure sort comparator — `null` returns the dataset untouched. */
function sortRows(
  rows: RemittanceRecord[],
  sort: RemittanceSortState | null,
): RemittanceRecord[] {
  if (!sort) return rows;
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (sort.key) {
      case 'id':
        return a.id.localeCompare(b.id) * dir;
      case 'codAmount':
        return (a.codAmount - b.codAmount) * dir;
      case 'status':
        return a.status.localeCompare(b.status) * dir;
      case 'paymentDate':
        return (
          parsePaymentDateKey(a.paymentDate).localeCompare(
            parsePaymentDateKey(b.paymentDate),
          ) * dir
        );
      case 'freightDeductions':
        return (a.freightDeductions - b.freightDeductions) * dir;
      case 'remittanceAmount':
        return (a.remittanceAmount - b.remittanceAmount) * dir;
      case 'paymentRef':
        return (a.paymentRef ?? '').localeCompare(b.paymentRef ?? '') * dir;
      default:
        return 0;
    }
  });
}

/* Same parser used internally by the data layer — duplicated here so the
   page can sort by date without exporting a private helper. Kept tiny on
   purpose; full date parsing lives outside the scope of this screen. */
function parsePaymentDateKey(display: string): string {
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  };
  const match = display.match(/^(\w+)\s+(\d+),\s+(\d+)$/);
  if (!match) return display;
  const [, mName, d, y] = match;
  const m = months[mName.toLowerCase()] ?? '00';
  return `${y}-${m}-${d.padStart(2, '0')}`;
}

/**
 * Finance → Remittance.
 *
 * Composition mirrors the Wallet Transactions page (the closest
 * analogue in the Finance module) and reuses the same primitives:
 *
 *   • Breadcrumb                  — `.ic-breadcrumb*` (Information Center recipe)
 *   • Page header + title         — `.ord-ph*`
 *   • KPI strip (4 static tiles)  — `ShipmentKpiStrip`
 *   • Filter bar                  — `.ord-fbar` + `FilterChip` + `.ord-srch`
 *   • Table                       — shared `.ord-tbl` recipe + `.rem-tbl`
 *   • Pagination footer           — `.ord-foot` + `.wt-foot-l` / `.wt-pgsize`
 *
 * Filter order (left → right):
 *   1. Search          (Remittance Number, FIRST pill — pinned left)
 *   2. Date Range      (single-select chip)
 *   3. Remittance Status (single-select chip)
 *
 * The four KPI tiles are derived from the *unfiltered* dataset so the
 * summary cards always reflect the merchant's universe (lifetime
 * settled, last paid, next expected, total due) regardless of which
 * slice the grid is currently showing — that matches how the wallet's
 * "Current Available Balance" tile behaves and avoids surprising the
 * user when they narrow the view.
 */
export const RemittancesPage: React.FC = () => {
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  /* ── Filter state ───────────────────────────────────────── */
  const [search, setSearch]         = useState('');
  const [dateRange, setDateRange]   = useState<string>('last90');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  /* ── Data state ─────────────────────────────────────────── */
  const [remittances, setRemittances] = useState<RemittanceRecord[]>(REMITTANCES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRemittances = async () => {
      setIsLoading(true);
      try {
        const data = await remittanceApi.fetchRemittances({ dateRange, status: statusFilter });
        setRemittances(data || []);
      } catch (err) {
        console.error('Failed to fetch remittances from API:', err);
        setRemittances([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRemittances();
  }, [dateRange, statusFilter]);

  /* ── Sort + pagination ──────────────────────────────────── */
  const [sort, setSort] = useState<RemittanceSortState | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  /* ── KPI numbers (always computed against the FULL dataset
        so the summary tiles describe the merchant's universe, not
        the current view). ─────────────────────────────────── */
  const kpis = useMemo(() => computeRemittanceKpis(remittances), [remittances]);

  const kpiCards: KpiCardSpec[] = useMemo(
    () => [
      {
        id: 'remitted-till-date',
        label: 'Remitted Till Date',
        value: formatRupeesCompact(kpis.remittedTillDate),
        accent: 'ink',
        icon: 'package',
        staticTile: true,
      },
      {
        id: 'last-remittance',
        label: 'Last Remittance',
        value: formatRupeesCompact(kpis.lastRemittance),
        accent: 'green',
        icon: 'check',
        staticTile: true,
      },
      {
        id: 'next-remittance',
        label: 'Next Remittance (Expected)',
        value: formatRupeesCompact(kpis.nextRemittance),
        accent: 'blue',
        icon: 'clock',
        staticTile: true,
      },
      {
        id: 'total-due',
        label: 'Total Remittance Due',
        value: formatRupeesCompact(kpis.totalRemittanceDue),
        accent: 'amber',
        icon: 'total',
        staticTile: true,
      },
    ],
    [kpis],
  );

  /* ── Derived: filtered rows ─────────────────────────────── */
  const filteredRows = useMemo<RemittanceRecord[]>(() => {
    let list = remittances;

    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      /* Search matches Remittance Number, Payment Ref, and COD amount
         (digit-only queries) so operators can paste any of those values
         directly. Comma / whitespace separators let a batch of ids be
         dropped in at once. */
      const tokens = q
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      list = list.filter((r) => {
        const id = r.id.toLowerCase();
        const ref = (r.paymentRef ?? '').toLowerCase();
        return tokens.some((t) => id.includes(t) || ref.includes(t));
      });
    }
    return list;
  }, [remittances, statusFilter, search]);

  /* ── Sorted + paginated slice for the table ─────────────── */
  const sorted = useMemo(() => sortRows(filteredRows, sort), [filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sorted.length);
  const visibleRows = sorted.slice(startIndex, endIndex);

  /* ── Handlers ──────────────────────────────────────────── */
  const handleSort = (col: ColumnSpec) => {
    if (col.sortable === false) return;
    if (!sort || sort.key !== col.key) {
      setSort({ key: col.key, dir: 'asc' });
      return;
    }
    if (sort.dir === 'asc') {
      setSort({ key: col.key, dir: 'desc' });
      return;
    }
    setSort(null);
  };

  const hasAnyFilter =
    search.trim() !== '' ||
    dateRange !== 'last90' ||
    statusFilter !== null;

  const clearAllFilters = () => {
    setSearch('');
    setDateRange('last90');
    setStatusFilter(null);
    setPage(1);
  };

  const handleRowDownload = async (r: RemittanceRecord) => {
    if (r.status !== 'paid') {
      showToast(`Statement available once ${r.id} is settled`);
      return;
    }
    showToast(`Downloading remittance statement ${r.id}…`);
    try {
      await remittanceApi.downloadRemittance(r);
      showToast(`✅ Downloaded statement for ${r.id}`);
    } catch (err) {
      showToast(`❌ Failed to download statement for ${r.id}`);
    }
  };

  const handleExport = async () => {
    showToast('📥 Remittance report export started');
    try {
      await remittanceApi.exportRemittances({ dateRange, status: statusFilter }, sorted);
      showToast('✅ Report exported successfully');
    } catch (err) {
      showToast('❌ Failed to export report');
    }
  };

  return (
    <div className="page">
      {/* ── Breadcrumb (Information Center recipe) ────────── */}
      <div className="ic-breadcrumb" aria-label="Breadcrumb">
        <span
          role="link"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => showToast('Finance — coming soon')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showToast('Finance — coming soon');
            }
          }}
        >
          Finance
        </span>
        <span className="ic-breadcrumb-sep">›</span>
        <span className="ic-breadcrumb-current">Remittance</span>
      </div>

      {/* ── Header row: title left, CTAs right ─────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">Remittances</div>
        </div>
        <div className="ord-ph-r">
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={() => window.location.reload()}
          >
            <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
              {RefreshIcon}
            </span>
            Refresh
          </button>
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={handleExport}
            disabled={isLoading}
          >
            <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
              {DownloadIcon}
            </span>
            Export
          </button>
        </div>
      </div>

      {/* ── KPI summary (4 static tiles, derived from the universe) ── */}
      <ShipmentKpiStrip
        cards={kpiCards}
        ariaLabel="Remittance summary"
      />

      {/* ── Tools row: filter bar with search as FIRST pill on
            the extreme left. Date Range + Status chips follow,
            mirroring the Wallet Transactions filter recipe. ── */}
      <div className="ord-tools-row">
        <div className="ord-fbar" role="toolbar" aria-label="Remittance filters">
          <div className="ord-fb-lbl">Filters</div>
          <div className="ord-fdiv" />

          {/* 1. Search — FIRST pill, extreme-left. Single input that
                 matches BOTH Remittance Number + Payment Ref. */}
          <label
            className="ord-srch rem-srch"
            aria-label="Search by Remittance Number"
          >
            <span className="ord-srch-ico" aria-hidden="true">{SearchIcon}</span>
            <input
              type="text"
              placeholder="Search by Remittance Number"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="ord-srch-x"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          {/* 2. Date Range — single-select chip (existing component) */}
          <FilterChip
            mode="single"
            label="Date Range"
            icon={CalendarIcon}
            options={REMITTANCE_DATE_RANGE_OPTIONS}
            value={dateRange}
            onChange={(v) => {
              setDateRange(v ?? 'last90');
              setPage(1);
            }}
          />

          {/* 3. Remittance Status — single-select chip. `null` value
                 surfaces the "Show All" affordance via the placeholder
                 label, mirroring the Wallet Recharge Type chip. */}
          <FilterChip
            mode="single"
            label="Remittance Status"
            icon={StatusIcon}
            options={REMITTANCE_STATUSES}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          />

          <button
            type="button"
            className="ord-fb-clear"
            onClick={clearAllFilters}
            disabled={!hasAnyFilter}
          >
            Clear all
          </button>
        </div>
      </div>

      {/* ── Inline count above the grid ──────────────────── */}
      <div className="ord-count-row">
        <span className="ord-count">
          <b>
            {isLoading ? 'Loading...' : `${sorted.length} remittance${sorted.length === 1 ? '' : 's'}`}
          </b>
        </span>
      </div>

      {/* ── Remittance table ─────────────────────────────── */}
      <div className="ord-grid">
        <div className="ord-grid-scroll">
          <table className="ord-tbl rem-tbl">
            <thead>
              <tr>
                {COLUMNS.map((col) => {
                  const isActive = sort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`${col.sortable !== false ? 'sortable' : ''} ${isActive ? 'on' : ''}`}
                      style={col.align === 'right' ? { textAlign: 'right' } : undefined}
                      onClick={() => handleSort(col)}
                      aria-sort={
                        isActive
                          ? sort!.dir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <span
                        className="ord-th-i"
                        style={
                          col.align === 'right'
                            ? { justifyContent: 'flex-end' }
                            : undefined
                        }
                      >
                        {col.label}
                        <span className="ord-th-arr" aria-hidden="true">
                          {isActive ? (sort!.dir === 'asc' ? '▲' : '▼') : ''}
                        </span>
                      </span>
                    </th>
                  );
                })}
                {/* DOWNLOAD column — non-sortable action cell, mirrors
                    the supplied design's right-most icon column. */}
                <th style={{ textAlign: 'center', width: 86 }}>DOWNLOAD</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length + 1}
                    className="wt-empty"
                  >
                    <div className="wt-empty-title">No remittances found</div>
                    <div className="wt-empty-sub">
                      Try adjusting your filters or search query.
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => {
                  const meta = REMITTANCE_STATUS_META[r.status];
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="rem-id">{r.id}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="rem-amt">
                          {formatRupeesCompact(r.codAmount)}
                        </span>
                      </td>
                      <td>
                        <span className={`ord-status ${meta.variant}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <span className="rem-date">{r.paymentDate}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`rem-amt ${r.freightDeductions > 0 ? 'deduct' : 'zero'}`}
                        >
                          {r.freightDeductions === 0
                            ? '0'
                            : formatRupeesCompact(r.freightDeductions)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="rem-amt strong">
                          {formatRupeesCompact(r.remittanceAmount)}
                        </span>
                      </td>
                      <td>
                        {r.paymentRef ? (
                          <span className="rem-ref">{r.paymentRef}</span>
                        ) : (
                          <span className="rem-ref-empty">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="rem-dl-btn"
                          onClick={() => handleRowDownload(r)}
                          aria-label={`Download remittance ${r.id}`}
                          title={
                            r.status === 'paid'
                              ? `Download remittance ${r.id}`
                              : `Statement available after settlement`
                          }
                          disabled={r.status !== 'paid'}
                        >
                          {DownloadIcon}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ──────────────────────────── */}
        <div className="ord-foot">
          <div className="wt-foot-l">
            {sorted.length > 0 ? (
              <>
                Showing <b>{startIndex + 1} – {endIndex}</b> of <b>{sorted.length}</b>
              </>
            ) : (
              <>No results</>
            )}
            <span className="wt-pgsize">
              Items per page:&nbsp;
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Items per page"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </span>
          </div>
          <div className="ord-foot-pgw">
            <button
              type="button"
              className="ord-foot-pgb icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`ord-foot-pgb ${p === safePage ? 'on' : ''}`}
                onClick={() => setPage(p)}
                aria-current={p === safePage ? 'page' : undefined}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="ord-foot-pgb icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast />}
    </div>
  );
};

export default RemittancesPage;
