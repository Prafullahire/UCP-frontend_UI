import React, { useMemo, useState } from 'react';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import NdrKpiStrip from './components/NdrKpiStrip';
import NdrFilterBar, {
  hasAnyNdrFilter,
  initialNdrFilters,
  type NdrFilterState,
} from './components/NdrFilterBar';
import NdrActiveFilters from './components/NdrActiveFilters';
import NdrTable from './components/NdrTable';
import NdrViewDetailsDrawer from './components/NdrViewDetailsDrawer';
import NdrReattemptModal, {
  type ReattemptPayload,
} from './components/NdrReattemptModal';
import NdrUpdateDetailsModal, {
  type UpdateDetailsPayload,
} from './components/NdrUpdateDetailsModal';
import NdrBulkUpdateModal, {
  type BulkUpdateSummary,
} from './components/NdrBulkUpdateModal';
import { ndrApi } from '../../services/ndrApi';
import type { NdrKpiBucket, NdrRecord } from './types';

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path
      d="M12 1.5v4H8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
const BulkUploadIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M7 9V2M4 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11h10" strokeLinecap="round" />
    <path d="M2 9v2a1 1 0 001 1h8a1 1 0 001-1V9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * NDR (Non-Delivery Report) module — top-level page.
 *
 * Owns:
 *  • Active KPI bucket (drives the priority filter)
 *  • Filter state (date / reason / attempts / channel / …)
 *  • Selection set (checkbox column + bulk actions)
 *  • Expansion state — one row expanded at a time
 *  • Modal stack: View Details drawer, Re-attempt modal, Update Details modal
 *  • Toast notifications via the shared `useReportsStore`
 */
export const NdrPage: React.FC = () => {
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  const [activeBucket, setActiveBucket] = useState<NdrKpiBucket>('all');
  const [filters, setFilters] = useState<NdrFilterState>(initialNdrFilters);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [viewDetailsFor, setViewDetailsFor] = useState<NdrRecord | null>(null);
  const [reattemptFor, setReattemptFor] = useState<NdrRecord | null>(null);
  const [updateDetailsFor, setUpdateDetailsFor] = useState<NdrRecord | null>(null);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);

  const [records, setRecords] = useState<NdrRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ndrApi.fetchNdrList(filters);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch NDR data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const kpiCounts = useMemo(() => {
    return {
      all: records.length,
      critical: records.filter(r => r.priority === 'critical').length,
      seller: records.filter(r => r.priority === 'seller').length,
      none: records.filter(r => r.priority === 'none').length,
    };
  }, [records]);

  /* ─── Derived data: apply KPI bucket + every active filter ─── */
  const filteredRecords = useMemo<NdrRecord[]>(() => {
    let list = records;

    if (activeBucket !== 'all') {
      list = list.filter((r) => r.priority === activeBucket);
    }
    if (filters.reason) {
      list = list.filter((r) => r.reasonId === filters.reason);
    }
    if (filters.attempts) {
      if (filters.attempts === '3+') {
        list = list.filter((r) => r.attemptCount >= 3);
      } else {
        const want = parseInt(filters.attempts, 10);
        list = list.filter((r) => r.attemptCount === want);
      }
    }
    if (filters.shipmentType) {
      list = list.filter((r) => r.transportMode === filters.shipmentType);
    }
    if (filters.paymentMode) {
      list = list.filter((r) => r.paymentMode === filters.paymentMode);
    }
    if (filters.channel) {
      list = list.filter((r) => r.channel === filters.channel);
    }
    return list;
  }, [records, activeBucket, filters]);

  /* ─── Selection helpers ──────────────────────────────────── */
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
      filteredRecords.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  /* ─── KPI selection — clicking active bucket again clears it ─ */
  const handleKpiSelect = (bucket: NdrKpiBucket) => {
    setActiveBucket((prev) => (prev === bucket && prev !== 'all' ? 'all' : bucket));
    setExpandedId(null);
  };

  const clearFilters = () => {
    setFilters(initialNdrFilters);
    showToast('Filters cleared');
  };

  /* ─── Row-level action handlers ──────────────────────────── */
  const handleViewDetails = (r: NdrRecord) => setViewDetailsFor(r);
  const handleReattempt = (r: NdrRecord) => setReattemptFor(r);
  const handleUpdateDetails = (r: NdrRecord) => setUpdateDetailsFor(r);
  const handleHold = (r: NdrRecord) =>
    showToast(`Order ${r.orderId} held for 48 hrs`);
  const handleRto = (r: NdrRecord) =>
    showToast(`RTO initiated for ${r.orderId}`);
  const handleOrderClick = (r: NdrRecord) => setViewDetailsFor(r);

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      showToast('No records to export');
      return;
    }
    showToast('Preparing export...');
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Reason', 'Priority', 'Payment Mode', 'Attempts', 'Transport Mode', 'Seller Action', 'Seller Remarks'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => [
        r.orderId,
        `"${r.attemptDate}"`,
        `"${r.customerName}"`,
        r.customerPhone,
        `"${r.deliveryAddress.replace(/"/g, '""')}"`,
        `"${r.reason}"`,
        r.priority,
        r.paymentMode,
        r.attemptCount,
        r.transportMode,
        '', // Seller Action blank for user to fill
        ''  // Seller Remarks blank for user to fill
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ndr_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${filteredRecords.length} records successfully`);
  };

  /* ─── Modal callbacks ────────────────────────────────────── */
  const confirmReattempt = (p: ReattemptPayload) => {
    const r = records.find((x) => x.id === p.recordId);
    setReattemptFor(null);
    showToast(
      `✓ Re-attempt scheduled for ${r?.orderId ?? p.recordId} on ${p.date}${p.priority ? ' · Priority flagged' : ''
      }`,
    );
  };
  const confirmUpdateDetails = (p: UpdateDetailsPayload) => {
    const r = records.find((x) => x.id === p.recordId);
    setUpdateDetailsFor(null);
    showToast(`✓ Details updated and re-attempt confirmed for ${r?.orderId ?? p.recordId}`);
  };

  const visibleCount = filteredRecords.length;
  const totalForBucket = kpiCounts[activeBucket];
  const showingLabel = hasAnyNdrFilter(filters)
    ? `${visibleCount} NDR records matching your filters`
    : `${totalForBucket} NDR records for last 30 days`;

  return (
    <div className="page">
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">NDR Management</div>
          <button type="button" className="ndr-learn">
            {LearnIcon}
            Learn More
          </button>
        </div>
        <div className="ord-ph-r">
          <span className="ndr-ph-meta">
            {kpiCounts.all} Orders for Last 30 days
          </span>
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={() => {
              showToast('🔄 Refreshing NDR list…');
              fetchRecords();
            }}
          >
            {RefreshIcon}
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <NdrKpiStrip
        counts={kpiCounts}
        active={activeBucket}
        onSelect={handleKpiSelect}
      />

      {/* ── Tools row: filter bar (auto-width) ←→ Export + Bulk ── */}
      <div className="ord-tools-row">
        <NdrFilterBar
          state={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
        <div className="ord-tools-actions">
          <button
            type="button"
            className="ord-cta ord-cta-s ndr-cta-sm"
            onClick={handleExport}
          >
            {ExportIcon}
            Export
          </button>
          <button
            type="button"
            className="ord-cta ord-cta-s ndr-cta-sm"
            onClick={() => setBulkUpdateOpen(true)}
          >
            {BulkUploadIcon}
            Bulk NDR Update
          </button>
        </div>
      </div>

      {/* ── Active filter chips (when any) + count above the grid ── */}
      <NdrActiveFilters
        state={filters}
        onChange={setFilters}
        onClearAll={clearFilters}
      />
      <div className="ord-count-row">
        <span className="ord-count">
          Showing <b>{showingLabel}</b>
        </span>
      </div>

      {/* ── Records table ────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading NDR data...</div>
      ) : (
        <NdrTable
          records={filteredRecords}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          expandedId={expandedId}
          onToggleExpand={toggleExpand}
          onOrderClick={handleOrderClick}
          onReattempt={handleReattempt}
          onUpdateDetails={handleUpdateDetails}
          onHold={handleHold}
          onRto={handleRto}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* ── Overlays ────────────────────────────────────────── */}
      {viewDetailsFor && (
        <NdrViewDetailsDrawer
          record={viewDetailsFor}
          onClose={() => setViewDetailsFor(null)}
          onReattempt={(r) => {
            setViewDetailsFor(null);
            setReattemptFor(r);
          }}
        />
      )}
      {reattemptFor && (
        <NdrReattemptModal
          record={reattemptFor}
          onClose={() => setReattemptFor(null)}
          onConfirm={confirmReattempt}
        />
      )}
      {updateDetailsFor && (
        <NdrUpdateDetailsModal
          record={updateDetailsFor}
          onClose={() => setUpdateDetailsFor(null)}
          onConfirm={confirmUpdateDetails}
        />
      )}
      {bulkUpdateOpen && (
        <NdrBulkUpdateModal
          onClose={() => setBulkUpdateOpen(false)}
          onCompleted={(s: BulkUpdateSummary) =>
            showToast(
              `✓ ${s.processed} processed · ${s.skipped} skipped · ${s.errors} error${s.errors !== 1 ? 's' : ''}`,
            )
          }
        />
      )}

      {toast && <Toast />}
    </div>
  );
};

export default NdrPage;
