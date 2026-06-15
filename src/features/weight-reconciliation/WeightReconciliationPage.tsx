<<<<<<< HEAD
import React, { useMemo, useState, useEffect } from 'react';
=======
import React, { useMemo, useState } from 'react';
>>>>>>> 225cb97 (changes on 15th June morning)
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import FilterChip from '../orders/components/FilterChip';
import WrKpiStrip from './components/WrKpiStrip';
import WrTable from './components/WrTable';
import WrAcceptModal from './components/WrAcceptModal';
import WrRejectModal, {
  type WrRejectPayload,
} from './components/WrRejectModal';
import {
  WR_APPLIED_SLABS,
  WR_CHARGED_OPTIONS,
  WR_DATE_RANGE_OPTIONS,
  WR_KPI_COUNTS,
<<<<<<< HEAD
=======
  WR_RECORDS,
>>>>>>> 225cb97 (changes on 15th June morning)
  WR_STATUS_OPTIONS,
  liveCounts,
  recordUiStatus,
} from './data/weightReconciliationData';
import type {
  WrBucket,
  WrChargedFlag,
  WrKpiCounts,
  WrRecord,
  WrRowState,
  WrSlabId,
  WrUiStatus,
} from './types';
<<<<<<< HEAD
import { weightReconciliationApi } from '../../services/weightReconciliationApi';
=======
>>>>>>> 225cb97 (changes on 15th June morning)

/* ── Icon glyphs (page header + toolbar) ─────────────────────────── */
const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LearnIcon = (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="6" cy="6" r="5" />
    <path d="M6 4v2.5M6 8h.01" strokeLinecap="round" />
  </svg>
);
const ExportIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M7 9.5V2M4 6.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12h10" strokeLinecap="round" />
  </svg>
);
const BulkAcceptIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 7l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CalendarIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="2" width="12" height="11" rx="2" />
    <path d="M1 6h12M5 1v2M9 1v2" strokeLinecap="round" />
  </svg>
);
const ScaleIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M7 2v10M3 4h8M5 12h4" strokeLinecap="round" />
    <path d="M2 8c0 0 .5-3 2-3s2 3 2 3-.5 1.5-2 1.5S2 8 2 8z" strokeLinejoin="round" />
    <path d="M8 8c0 0 .5-3 2-3s2 3 2 3-.5 1.5-2 1.5S8 8 8 8z" strokeLinejoin="round" />
  </svg>
);
const ChargedIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M2 5h10M2 9h10" strokeLinecap="round" />
    <rect x="1" y="3" width="12" height="8" rx="1.5" />
  </svg>
);
const StatusIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="7" cy="7" r="5" />
    <path d="M7 4.5v3l2 1" strokeLinecap="round" />
  </svg>
);
const InfoTriangleIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3.5M8 10h.01" strokeLinecap="round" />
  </svg>
);

/* ── Tab spec — 5 buckets that mirror the KPI strip ──────────────── */
interface TabSpec {
  id: WrBucket;
  label: string;
}
const TABS: TabSpec[] = [
  { id: 'all',      label: 'All' },
  { id: 'action',   label: 'Action Required' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'open',     label: 'Open Disputes' },
  { id: 'closed',   label: 'Closed Disputes' },
];

/**
 * Map a row's state to its KPI bucket. `null` means the seller has not
 * yet acted, which is what the "Action Required" tab / KPI surfaces.
 */
const stateToBucket = (state: WrRowState): Exclude<WrBucket, 'all'> => {
  if (state === null) return 'action';
  return state;
};

/**
 * Weight Reconciliation — top-level page.
 *
 * Owns:
 *  • Active KPI bucket (drives the priority filter — also bound to the
 *    active tab so the two stay in lockstep)
 *  • Filter state (date range / applied slab / charged flag)
 *  • Selection set (checkbox column + bulk Accept)
 *  • Row state map — accepted / disputed / closed (in-session only)
 *  • Modal stack — Confirm Accept + Reject (Raise Dispute)
 *  • Toast notifications via the shared `useReportsStore`
 */
export const WeightReconciliationPage: React.FC = () => {
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  /* ─── KPI bucket + tab ──────────────────────────────────── */
  const [activeBucket, setActiveBucket] = useState<WrBucket>('all');

  /* ─── Filters ───────────────────────────────────────────── */
  const [dateRange, setDateRange] = useState<string>('last30');
  const [slabFilter, setSlabFilter] = useState<WrSlabId | null>(null);
  const [chargedFilter, setChargedFilter] = useState<WrChargedFlag | null>(null);
  /* Granular status filter — only available on the All tab. The other
     tabs are already constrained by their lifecycle bucket. */
  const [statusFilter, setStatusFilter] = useState<WrUiStatus | null>(null);

<<<<<<< HEAD
  /* ─── API State ─────────────────────────────────────────── */
  const [apiRecords, setApiRecords] = useState<WrRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /* ─── Selection + per-row state (mutated as the seller acts) ─ */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowStates, setRowStates] = useState<Record<string, WrRowState>>({});
=======
  /* ─── Selection + per-row state (mutated as the seller acts) ─ */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowStates, setRowStates] = useState<Record<string, WrRowState>>(() => {
    const seed: Record<string, WrRowState> = {};
    WR_RECORDS.forEach((r) => { seed[r.id] = r.state; });
    return seed;
  });
>>>>>>> 225cb97 (changes on 15th June morning)

  /* ─── Modal stack ───────────────────────────────────────── */
  const [acceptFor, setAcceptFor] = useState<WrRecord | null>(null);
  const [rejectFor, setRejectFor] = useState<WrRecord | null>(null);

<<<<<<< HEAD
  /* ─── Fetch API Records ─────────────────────────────────── */
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await weightReconciliationApi.fetchRecords({
        dateRange,
        slabFilter,
        chargedFilter,
        statusFilter: activeBucket === 'all' ? statusFilter : null
      });
      setApiRecords(data);
    } catch (e) {
      console.error(e);
      showToast('Failed to load weight reconciliation records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateRange, slabFilter, chargedFilter, activeBucket, statusFilter]);

  /* ─── Records with the live state map applied ───────────── */
  const records = useMemo<WrRecord[]>(() => {
    return apiRecords.map((r) => ({ ...r, state: rowStates[r.id] !== undefined ? rowStates[r.id] : (r.state ?? null) }));
  }, [apiRecords, rowStates]);
=======
  /* ─── Records with the live state map applied ───────────── */
  const records = useMemo<WrRecord[]>(() => {
    return WR_RECORDS.map((r) => ({ ...r, state: rowStates[r.id] ?? null }));
  }, [rowStates]);
>>>>>>> 225cb97 (changes on 15th June morning)

  /* ─── Apply bucket + filters ────────────────────────────── */
  const filteredRecords = useMemo<WrRecord[]>(() => {
    let list = records;

    if (activeBucket !== 'all') {
      list = list.filter((r) => stateToBucket(r.state) === activeBucket);
    }
    /* Status filter only applies on the All tab — the other tabs are
       already pre-filtered by their lifecycle bucket. */
    if (activeBucket === 'all' && statusFilter) {
      list = list.filter((r) => recordUiStatus(r) === statusFilter);
    }
    if (slabFilter) {
      list = list.filter((r) => r.slabBucket === slabFilter);
    }
    if (chargedFilter) {
      list = list.filter((r) =>
        chargedFilter === 'yes' ? r.charges.chargedToWallet : !r.charges.chargedToWallet,
      );
    }
    return list;
  }, [records, activeBucket, statusFilter, slabFilter, chargedFilter]);

<<<<<<< HEAD
  /* ─── KPI counts (dynamically calculated based on API response) ── */
  const counts = useMemo<WrKpiCounts>(() => {
    const next: WrKpiCounts = { all: 0, action: 0, open: 0, accepted: 0, closed: 0 };
    next.all = records.length;
    for (const r of records) {
      if (r.state === null) next.action += 1;
      else if (r.state === 'open') next.open += 1;
      else if (r.state === 'accepted') next.accepted += 1;
      else if (r.state === 'closed') next.closed += 1;
    }
    return next;
  }, [records]);
=======
  /* ─── KPI counts (base counters + live overrides for this session) ── */
  const counts = useMemo<WrKpiCounts>(() => liveCounts(records), [records]);
>>>>>>> 225cb97 (changes on 15th June morning)

  /* ─── Selection helpers ─────────────────────────────────── */
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allOnPage = filteredRecords.every((r) => prev.has(r.id));
      if (allOnPage) {
        const next = new Set(prev);
        filteredRecords.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      /* Bulk Accept only applies to rows that still need action — never
         re-include rows already accepted / closed / under review. */
      filteredRecords
        .filter((r) => r.state === null)
        .forEach((r) => next.add(r.id));
      return next;
    });
  };

  /* ─── KPI selection — clicking active bucket again clears it ─ */
  const handleKpiSelect = (bucket: WrBucket) => {
    setActiveBucket((prev) => (prev === bucket && prev !== 'all' ? 'all' : bucket));
    setSelected(new Set());
  };

  const handleTabChange = (id: WrBucket) => {
    setActiveBucket(id);
    setSelected(new Set());
    /* Drop the All-tab Status filter when leaving the All tab — it
       would otherwise be a no-op (other tabs are bucket-constrained)
       but visually look stale on the filter strip. */
    if (id !== 'all') setStatusFilter(null);
  };

  /* ─── Filters ───────────────────────────────────────────── */
  const hasAnyFilter =
    dateRange !== 'last30' ||
    slabFilter !== null ||
    chargedFilter !== null ||
    statusFilter !== null;
  const clearFilters = () => {
    setDateRange('last30');
    setSlabFilter(null);
    setChargedFilter(null);
    setStatusFilter(null);
    showToast('Filters cleared');
  };

  /* ─── Row action handlers ───────────────────────────────── */
  const handleAccept = (r: WrRecord) => setAcceptFor(r);
  const handleReject = (r: WrRecord) => setRejectFor(r);
  const handleAwbClick = (r: WrRecord) =>
    showToast(`Tracking AWB ${r.awb}…`);
  const handleOrderClick = (r: WrRecord) =>
    showToast(`Opening order ${r.orderId}…`);

  /* ─── Modal callbacks ───────────────────────────────────── */
  const confirmAccept = (r: WrRecord) => {
    setRowStates((prev) => ({ ...prev, [r.id]: 'accepted' }));
    setAcceptFor(null);
    showToast(`✓ Weight charge accepted for ${r.orderId}`);
  };
  const confirmReject = (p: WrRejectPayload) => {
    const r = records.find((x) => x.id === p.recordId);
    setRowStates((prev) => ({ ...prev, [p.recordId]: 'open' }));
    setRejectFor(null);
    showToast(
      `✓ Dispute raised for ${r?.orderId ?? p.recordId} — XpressBees team will review within 48 hours`,
    );
  };

  /* ─── Bulk Accept ───────────────────────────────────────── */
  const bulkAccept = () => {
    if (selected.size === 0) return;
    setRowStates((prev) => {
      const next = { ...prev };
      selected.forEach((id) => {
        if (next[id] === null || next[id] === undefined) next[id] = 'accepted';
      });
      return next;
    });
    showToast(`✓ ${selected.size} order${selected.size !== 1 ? 's' : ''} accepted`);
    setSelected(new Set());
  };

  /* ─── Header copy ───────────────────────────────────────── */
  const visibleCount = filteredRecords.length;
  const showingLabel =
    activeBucket === 'all'
      ? `${WR_KPI_COUNTS.all} records for last 30 days`
      : `${visibleCount} record${visibleCount === 1 ? '' : 's'} matching this view`;

  /* Action-required banner shows only on the Action Required / All tabs
     when there are still seller actions pending today. */
  const urgentToday = records.filter(
    (r) => r.state === null && r.daysLeft === 0,
  ).length;

  return (
    <div className="page">
      {/* ── Page header ───────────────────────────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">Weight Reconciliation</div>
          <button type="button" className="ndr-learn">
            {LearnIcon}
            Learn More
          </button>
        </div>
        <div className="ord-ph-r">
          <span className="ndr-ph-meta">
            {WR_KPI_COUNTS.all} records for last 30 days
          </span>
          <button
            type="button"
            className="ord-cta ord-cta-s"
<<<<<<< HEAD
            onClick={() => {
              showToast('🔄 Refreshing reconciliation list…');
              fetchRecords();
            }}
=======
            onClick={() => showToast('🔄 Refreshing reconciliation list…')}
>>>>>>> 225cb97 (changes on 15th June morning)
          >
            {RefreshIcon}
            Refresh
          </button>
        </div>
      </div>

      {/* ── Info banner — surfaces the dispute window deadline ── */}
      {urgentToday > 0 && (
        <div className="wr-info-banner">
          {InfoTriangleIcon}
          <div className="wr-info-banner-txt">
            <b>Weight dispute window is 7 days.</b> Rows showing{' '}
            <span style={{ color: 'var(--red)', fontWeight: 700 }}>
              0 day(s) left
            </span>{' '}
            will auto-accept today. <b>{urgentToday} order{urgentToday === 1 ? '' : 's'}</b>{' '}
            need your action before midnight.
          </div>
        </div>
      )}

      {/* ── KPI cards (5 buckets) ─────────────────────────── */}
      <WrKpiStrip
        counts={counts}
        active={activeBucket}
        onSelect={handleKpiSelect}
      />

      {/* ── Tab strip — bound to the same bucket as the KPI cards ── */}
      <div className="ord-tabs" role="tablist" aria-label="Weight reconciliation lifecycle">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeBucket === t.id}
            className={`ord-tab ${activeBucket === t.id ? 'on' : ''}`}
            onClick={() => handleTabChange(t.id)}
          >
            {t.label}
            <span className={`wr-tab-cnt ${activeBucket === t.id ? 'on' : ''}`}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tools row: filters (left) + actions (right) ──── */}
      <div className="ord-tools-row">
        <div className="ord-fbar" role="toolbar" aria-label="Weight reconciliation filters">
          <div className="ord-fb-lbl">Filters</div>
          <div className="ord-fdiv" />

          <FilterChip
            mode="single"
            label="Date Range"
            icon={CalendarIcon}
            options={WR_DATE_RANGE_OPTIONS}
            value={dateRange}
            onChange={(v) => setDateRange(v ?? 'last30')}
          />
          {activeBucket === 'all' && (
            <FilterChip
              mode="single"
              label="Status"
              icon={StatusIcon}
              options={WR_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(v) => setStatusFilter((v as WrUiStatus | null) ?? null)}
            />
          )}
          <FilterChip
            mode="single"
            label="Applied Slab"
            icon={ScaleIcon}
            options={WR_APPLIED_SLABS}
            value={slabFilter}
            onChange={(v) => setSlabFilter((v as WrSlabId | null) ?? null)}
          />
          <FilterChip
            mode="single"
            label="Charged"
            icon={ChargedIcon}
            options={WR_CHARGED_OPTIONS}
            value={chargedFilter}
            onChange={(v) => setChargedFilter((v as WrChargedFlag | null) ?? null)}
          />

          <button
            type="button"
            className="ord-fb-clear"
            onClick={clearFilters}
            disabled={!hasAnyFilter}
          >
            Clear all
          </button>
        </div>

        <div className="ord-tools-actions">
          {selected.size > 0 && (
            <button
              type="button"
              className="ord-cta ord-cta-s ndr-cta-sm"
              onClick={bulkAccept}
            >
              {BulkAcceptIcon}
              Accept Selected ({selected.size})
            </button>
          )}
          <button
            type="button"
            className="ord-cta ord-cta-s ndr-cta-sm"
<<<<<<< HEAD
            onClick={async () => {
              showToast('Exporting reconciliation data…');
              try {
                await weightReconciliationApi.exportRecords({
                  dateRange,
                  slabFilter,
                  chargedFilter,
                  statusFilter: activeBucket === 'all' ? statusFilter : null
                }, filteredRecords);
                showToast('✓ Export completed');
              } catch (e) {
                showToast('Failed to export data');
              }
            }}
=======
            onClick={() => showToast('Exporting reconciliation data…')}
>>>>>>> 225cb97 (changes on 15th June morning)
          >
            {ExportIcon}
            Export
          </button>
        </div>
      </div>

      {/* ── Inline count above the grid ────────────────── */}
      <div className="ord-count-row">
        <span className="ord-count">
          Showing <b>{showingLabel}</b>
        </span>
      </div>

      {/* ── Records table ─────────────────────────────── */}
      <WrTable
        records={filteredRecords}
        selected={selected}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onAwbClick={handleAwbClick}
        onOrderClick={handleOrderClick}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      {/* ── Overlays ──────────────────────────────────── */}
      {acceptFor && (
        <WrAcceptModal
          record={acceptFor}
          onClose={() => setAcceptFor(null)}
          onConfirm={confirmAccept}
        />
      )}
      {rejectFor && (
        <WrRejectModal
          record={rejectFor}
          onClose={() => setRejectFor(null)}
          onConfirm={confirmReject}
        />
      )}

      {toast && <Toast />}
    </div>
  );
};

export default WeightReconciliationPage;
