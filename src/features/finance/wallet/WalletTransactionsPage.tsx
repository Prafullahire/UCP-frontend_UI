import React, { useMemo, useState, useEffect } from 'react';
import Toast from '../../../components/ui/Toast';
import { useReportsStore } from '../../../store/useReportsStore';
import FilterChip from '../../orders/components/FilterChip';
import ShipmentKpiStrip, {
  type KpiCardSpec,
} from '../../orders/components/ShipmentKpiStrip';
import {
  WALLET_DATE_RANGE_OPTIONS,
  WALLET_RECHARGE_TYPES,
  WALLET_TRANSACTIONS,
  computeWalletKpis,
  formatRupees,
  type WalletTransaction,
} from './data/walletTransactionsData';
import { walletApi } from '../../../services/walletApi';

/* ── Sort state ────────────────────────────────────────────────
   Mirrors the asc → desc → off cycle used by every grid in the
   Orders module so the interaction stays consistent. */
type WalletSortKey =
  | 'id'
  | 'date'
  | 'awb'
  | 'description'
  | 'amount'
  | 'availableBalance';

type SortDir = 'asc' | 'desc';

interface WalletSortState {
  key: WalletSortKey;
  dir: SortDir;
}

interface ColumnSpec {
  key: WalletSortKey;
  label: string;
  /** Right-aligned (used by the two numeric columns) */
  align?: 'right';
}

const COLUMNS: ColumnSpec[] = [
  { key: 'id',               label: 'TRANSACTION ID' },
  { key: 'date',             label: 'TRANSACTION DATE' },
  { key: 'awb',              label: 'AWB NUMBER' },
  { key: 'description',      label: 'DESCRIPTION' },
  { key: 'amount',           label: 'AMOUNT (₹)',            align: 'right' },
  { key: 'availableBalance', label: 'AVAILABLE BALANCE (₹)', align: 'right' },
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

const RechargeIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1.5" y="3" width="11" height="8" rx="1.5" />
    <path d="M1.5 6.2h11" strokeLinecap="round" />
    <path d="M4 9h2.5" strokeLinecap="round" />
  </svg>
);

const DownloadIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M7 9.5V2M4 6.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12h10" strokeLinecap="round" />
  </svg>
);

/** Pure sort comparator — `null` returns the dataset untouched. */
function sortRows(
  rows: WalletTransaction[],
  sort: WalletSortState | null,
): WalletTransaction[] {
  if (!sort) return rows;
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (sort.key) {
      case 'id':          return String(a.id).localeCompare(String(b.id)) * dir;
      case 'date':        return (a.date + a.time).localeCompare(b.date + b.time) * dir;
      case 'awb':         return (a.awb ?? '').localeCompare(b.awb ?? '') * dir;
      case 'description': return a.description.localeCompare(b.description) * dir;
      case 'amount':      return (a.amount - b.amount) * dir;
      case 'availableBalance':
        return (a.availableBalance - b.availableBalance) * dir;
      default:            return 0;
    }
  });
}

/**
 * Finance → Wallet → Wallet Transactions.
 *
 * Composition mirrors the Pickup Request page (the closest analogue
 * in the project) and reuses the same primitives:
 *
 *   • Breadcrumb                  — `.ic-breadcrumb*` (Information Center recipe)
 *   • Page header + title         — `.ord-ph*`
 *   • KPI strip (4 tiles)         — `ShipmentKpiStrip`
 *   • Filter bar                  — `.ord-fbar` + `FilterChip` + `.ord-srch`
 *   • Table                       — shared `.ord-tbl` recipe
 *
 * Filter order (left → right, per the brief):
 *   1. Search  (AWB Number + Transaction ID, single input, FIRST PILL)
 *   2. Date Range
 *   3. Recharge Type
 *
 * The search input is pinned as the first filter pill on the extreme
 * left and stays first on every responsive layout.
 */
export const WalletTransactionsPage: React.FC = () => {
  const showToast = useReportsStore((s) => s.showToast);
  const openWalletRecharge = useReportsStore((s) => s.openWalletRecharge);
  const toast = useReportsStore((s) => s.toast);

  /* ── Filter state ───────────────────────────────────────── */
  const [search, setSearch]             = useState('');
  const [dateRange, setDateRange]       = useState<string>('last30');
  const [rechargeType, setRechargeType] = useState<string | null>(null);

  /* ── Sort + pagination ──────────────────────────────────── */
  const [sort, setSort] = useState<WalletSortState | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiBalance, setApiBalance] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [txnData, balanceData] = await Promise.all([
          walletApi.fetchTransactions({ dateRange, rechargeType }),
          walletApi.fetchBalance()
        ]);
        setTransactions(txnData);
        setApiBalance(balanceData);
      } catch (err) {
        console.error('Failed to load wallet data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRange, rechargeType]);

  /* ── Derived: filtered rows ─────────────────────────────── */
  const filteredRows = useMemo<WalletTransaction[]>(() => {
    let list = transactions;

    if (rechargeType) {
      list = list.filter((r) => r.rechargeType === rechargeType);
    }

    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      /* Single search input matches BOTH transaction id and AWB number
         per the brief. Accepts a single value or a comma / whitespace
         separated list so operators can paste a batch of ids. */
      const tokens = q
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      list = list.filter((r) => {
        const id = String(r.id).toLowerCase();
        const awb = (r.awb ?? '').toLowerCase();
        return tokens.some((t) => id.includes(t) || awb.includes(t));
      });
    }
    return list;
  }, [rechargeType, search, transactions]);

  /* ── KPI numbers (always computed against the filtered view so
        the tiles describe the slice the user is looking at) ── */
  const kpis = useMemo(() => computeWalletKpis(filteredRows), [filteredRows]);
  
  if (apiBalance !== null) {
    kpis.availableBalance = apiBalance;
  }

  const kpiCards: KpiCardSpec[] = useMemo(
    () => [
      {
        id: 'credits', label: 'Total Credits',
        value: formatRupees(kpis.totalCredits),
        accent: 'green', icon: 'check', staticTile: true,
      },
      {
        id: 'debits', label: 'Total Debits',
        value: formatRupees(kpis.totalDebits),
        accent: 'red', icon: 'fail', staticTile: true,
      },
      {
        id: 'count', label: 'Total Transactions',
        value: kpis.totalTransactions,
        accent: 'blue', icon: 'total', staticTile: true,
      },
      {
        id: 'balance', label: 'Current Available Balance',
        value: formatRupees(kpis.availableBalance),
        accent: 'ink', icon: 'package', staticTile: true,
      },
    ],
    [kpis],
  );

  /* ── Sorted + paginated slice for the table ─────────────── */
  const sorted = useMemo(() => sortRows(filteredRows, sort), [filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sorted.length);
  const visibleRows = sorted.slice(startIndex, endIndex);

  /* ── Handlers ──────────────────────────────────────────── */
  const handleSort = (col: ColumnSpec) => {
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
    dateRange !== 'last30' ||
    rechargeType !== null;

  const clearAllFilters = () => {
    setSearch('');
    setDateRange('last30');
    setRechargeType(null);
    setPage(1);
  };

  const handleAwbClick = (r: WalletTransaction) => {
    if (!r.awb) return;
    showToast(`Opening shipment ${r.awb} — coming soon`);
  };

  const handleExport = () => {
    if (filteredRows.length === 0) {
      showToast('No data to export');
      return;
    }
    const headers = ['TRANSACTION ID', 'TRANSACTION DATE', 'AWB NUMBER', 'DESCRIPTION', 'AMOUNT (₹)', 'AVAILABLE BALANCE (₹)'];
    const rows = filteredRows.map(r => [
      r.id,
      `"${r.date} ${r.time}"`,
      r.awb || '',
      `"${r.description}"`,
      r.amount,
      r.availableBalance
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wallet_transactions_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    showToast('📥 Wallet transactions export completed');
  };

  return (
    <div className="page">
      {/* ── Breadcrumb (Information Center recipe) ───────────
           Wallet Transactions has been merged into the Wallet entry,
           so the breadcrumb collapses to "Finance › Wallet" — the
           page itself is the Wallet view. */}
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
        <span className="ic-breadcrumb-current">Wallet</span>
      </div>

      {/* ── Header row: title left, CTAs right ─────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">Wallet Transactions</div>
        </div>
        <div className="ord-ph-r">
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={handleExport}
            disabled={loading}
          >
            <span style={{ display: 'inline-flex', width: 14, height: 14 }}>
              {DownloadIcon}
            </span>
            Export
          </button>
          <button
            type="button"
            className="ord-cta ord-cta-p"
            onClick={openWalletRecharge}
          >
            + Recharge Wallet
          </button>
        </div>
      </div>

      {/* ── KPI summary (4 tiles, derived from the current view) ── */}
      <ShipmentKpiStrip
        cards={kpiCards}
        ariaLabel="Wallet summary"
      />

      {/* ── Tools row: filter bar with search as FIRST pill on
            the extreme left. Recharge Type chip uses the shared
            FilterChip's single-select mode. ──────────────────── */}
      <div className="ord-tools-row">
        <div className="ord-fbar" role="toolbar" aria-label="Wallet transactions filters">
          <div className="ord-fb-lbl">Filters</div>
          <div className="ord-fdiv" />

          {/* 1. Search — FIRST pill, extreme-left. Single input that
                 searches BOTH AWB Number + Transaction ID. Matches the
                 same .ord-srch height (30px) used by .ord-fc chips so it
                 sits flush in the filter bar visual rhythm. */}
          <label
            className="ord-srch wt-srch"
            aria-label="Search by AWB Number or Transaction ID"
          >
            <span className="ord-srch-ico" aria-hidden="true">{SearchIcon}</span>
            <input
              type="text"
              placeholder="Search AWB Number or Transaction ID"
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
            options={WALLET_DATE_RANGE_OPTIONS}
            value={dateRange}
            onChange={(v) => {
              setDateRange(v ?? 'last30');
              setPage(1);
            }}
          />

          {/* 3. Recharge Type — single-select chip. The chip itself
                 surfaces "Show All" via its neutral (null) state which
                 matches the brief's `Show All` placeholder option. */}
          <FilterChip
            mode="single"
            label="Recharge Type"
            icon={RechargeIcon}
            options={WALLET_RECHARGE_TYPES}
            value={rechargeType}
            onChange={(v) => {
              setRechargeType(v);
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
            {sorted.length} transaction{sorted.length === 1 ? '' : 's'}
          </b>
        </span>
      </div>

      {/* ── Transaction table ─────────────────────────────── */}
      <div className="ord-grid">
        <div className="ord-grid-scroll">
          <table className="ord-tbl wt-tbl">
            <thead>
              <tr>
                {COLUMNS.map((col) => {
                  const isActive = sort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`sortable ${isActive ? 'on' : ''}`}
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
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="wt-empty"
                  >
                    <div className="wt-empty-title">No transactions found</div>
                    <div className="wt-empty-sub">
                      Try adjusting your filters or search query.
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => {
                  const isCredit = r.amount >= 0;
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="wt-id">{r.id}</span>
                      </td>
                      <td>
                        <div className="ord-date" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                          {r.date}
                        </div>
                        <div className="ord-meta">{r.time}</div>
                      </td>
                      <td>
                        {r.awb ? (
                          <button
                            type="button"
                            className="wt-awb"
                            onClick={() => handleAwbClick(r)}
                          >
                            {r.awb}
                          </button>
                        ) : (
                          <span className="wt-awb-empty">—</span>
                        )}
                      </td>
                      <td>
                        <div className="wt-desc">{r.description}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`wt-amt ${isCredit ? 'credit' : 'debit'}`}>
                          {formatRupees(r.amount, { showSign: true })}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`wt-bal ${r.availableBalance < 0 ? 'neg' : ''}`}
                        >
                          {formatRupees(r.availableBalance)}
                        </span>
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

export default WalletTransactionsPage;
