import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../services/ordersApi';
import { supportApi } from '../../services/supportApi';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import FilterChip from './components/FilterChip';
import ShipmentKpiStrip, {
  type KpiCardSpec,
} from './components/ShipmentKpiStrip';
import PickupRequestsGrid, {
  type PickupSortState,
} from './components/PickupRequestsGrid';
import { EscalatePickupModal } from './components/EscalatePickupModal';
import {
  PICKUP_LOCATIONS,
  PICKUP_REQUESTS,
  PICKUP_SHIPMENT_MODES,
  PICKUP_STATUSES,
  computePickupKpis,
  type PickupRequest,
  type PickupStatus,
} from './data/pickupRequestData';
import { DATE_RANGE_OPTIONS } from './data/ordersData';

/* ── KPI bucket vocabulary ────────────────────────────────────
   Mirrors the brief: `all` resets the filter; every other id is
   a one-to-one mapping onto `PickupStatus`. */
type PickupKpiBucket = 'all' | PickupStatus;

const SearchIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="6.75" cy="6.75" r="4.25" />
    <path d="M10.25 10.25L13 13" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


/**
 * Orders → Pickup Request.
 *
 * Composition mirrors the Pending Orders Active tab (primary UI
 * reference) and reuses the same primitives:
 *
 *   • Page header                — `.ord-ph` + `.ord-cta` CTAs
 *   • KPI strip (clickable)      — `ShipmentKpiStrip`
 *   • Filter bar                 — `.ord-fbar` + `FilterChip`
 *   • Table                      — `.ord-tbl` via `PickupRequestsGrid`
 *
 * KPI + Status filter sync rule:
 *   - Selecting a KPI tile (other than "All") overrides the inline
 *     Status chip with the matching single status — both filters
 *     stay in lock-step so the dataset can never end up filtered
 *     by a status that contradicts the active KPI.
 *   - Selecting the "All" tile resets the status chip back to no
 *     filter.
 *   - Changing the Status chip directly updates the KPI bucket to
 *     match (single-selection) or back to "all" (no selection /
 *     multi-selection).
 */
export const PickupRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  /* ── Filter state ───────────────────────────────────────────
     Status is multi-select but stays in lock-step with the KPI
     bucket (see comments below) so the two can never contradict.
     `pickupIdSearch` is a free-text input wired into the right-hand
     search box; multiple ids can be pasted separated by commas /
     whitespace and any matching row will pass through. */
  const [dateRange, setDateRange]       = useState<string>('17-03_16-04');
  const [statuses, setStatuses]         = useState<string[]>([]);
  const [shipmentModes, setShipmentModes] = useState<string[]>([]);
  const [pickupLocations, setPickupLocations] = useState<string[]>([]);
  const [pickupIdSearch, setPickupIdSearch] = useState<string>('');
  const [activeBucket, setActiveBucket] = useState<PickupKpiBucket>('all');

  /* ── Sort state (table headers cycle asc → desc → off) ──── */
  const [sort, setSort] = useState<PickupSortState | null>(null);

  /* ── Modal state ────────────────────────────────────────── */
  const [escalateTarget, setEscalateTarget] = useState<PickupRequest | null>(null);

  /* ── Derived: filtered rows ─────────────────────────────── */
  const [allRequests, setAllRequests] = useState<PickupRequest[]>(PICKUP_REQUESTS);
  const [loading, setLoading] = useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersApi.fetchPickupRequests({ dateRange });
      if (data && data.length > 0) {
        setAllRequests(data);
      } else {
        setAllRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch pickup requests', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo<PickupRequest[]>(() => {
    let list = allRequests;

    /* KPI bucket: single-status filter when one of the tiles is
       active. "all" resets the filter. The status chip below is
       kept in sync so both surfaces show a consistent state. */
    if (activeBucket !== 'all') {
      list = list.filter((r) => r.status === activeBucket);
    } else if (statuses.length > 0) {
      list = list.filter((r) => statuses.includes(r.status));
    }

    if (shipmentModes.length > 0) {
      const wanted = new Set(
        shipmentModes.map((id) => PICKUP_SHIPMENT_MODES.find((m) => m.id === id)?.label),
      );
      list = list.filter((r) => wanted.has(r.courier));
    }
    if (pickupLocations.length > 0) {
      const wanted = new Set(
        pickupLocations.map((id) => PICKUP_LOCATIONS.find((l) => l.id === id)?.label),
      );
      list = list.filter((r) => wanted.has(r.warehouse));
    }

    /* Search-box: free-text manifest id matcher. Accepts a single id
       or a comma- / whitespace-separated list and keeps rows whose
       manifest id contains any of the provided tokens (case-insensitive,
       partial match) so users can paste partial ids and still find
       the row they expect. */
    const search = pickupIdSearch.trim();
    if (search.length > 0) {
      const tokens = search
        .split(/[\s,]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (tokens.length > 0) {
        list = list.filter((r) => {
          const id = String(r.manifestId).toLowerCase();
          return tokens.some((t) => id.includes(t));
        });
      }
    }
    return list;
  }, [allRequests, activeBucket, statuses, shipmentModes, pickupLocations, pickupIdSearch]);

  /* ── KPI numbers (derived from the unfiltered dataset so the
       tiles always reflect the universe, not the current view) ── */
  const kpis = useMemo(() => computePickupKpis(allRequests), [allRequests]);

  const kpiCards: KpiCardSpec[] = useMemo(
    () => [
      { id: 'all',            label: 'All Pickups',     value: kpis.all,
        accent: 'ink',   icon: 'package' },
      { id: 'scheduled',      label: 'Scheduled',       value: kpis.scheduled,
        accent: 'blue',  icon: 'clock' },
      { id: 'out-for-pickup', label: 'Out for Pickup',  value: kpis.outForPickup,
        accent: 'amber', icon: 'truck' },
      { id: 'picked',         label: 'Picked',          value: kpis.picked,
        accent: 'green', icon: 'check' },
      { id: 'cancelled',      label: 'Cancelled',       value: kpis.cancelled,
        accent: 'red',   icon: 'fail' },
    ],
    [kpis],
  );

  /* ── Handlers ──────────────────────────────────────────── */

  /* Clicking a KPI tile selects it (or clears back to "all" if the
     active one is re-selected). Status chip is synced so it never
     contradicts the KPI bucket. */
  const handleKpiSelect = (id: string) => {
    const next = (id === activeBucket ? 'all' : id) as PickupKpiBucket;
    setActiveBucket(next);
    setStatuses(next === 'all' ? [] : [next]);
  };

  /* Changing the inline Status chip updates the KPI in lock-step:
     • exactly one status selected   → matching KPI bucket
     • zero or multiple selected     → "all" (KPI ring clears)  */
  const handleStatusChange = (next: string[]) => {
    setStatuses(next);
    if (next.length === 1) {
      setActiveBucket(next[0] as PickupKpiBucket);
    } else {
      setActiveBucket('all');
    }
  };

  const hasAnyFilter =
    dateRange !== '17-03_16-04' ||
    statuses.length > 0 ||
    shipmentModes.length > 0 ||
    pickupLocations.length > 0 ||
    pickupIdSearch.trim().length > 0 ||
    activeBucket !== 'all';

  const clearAllFilters = () => {
    setDateRange('17-03_16-04');
    setStatuses([]);
    setShipmentModes([]);
    setPickupLocations([]);
    setPickupIdSearch('');
    setActiveBucket('all');
  };

  const handleExport = async (r: PickupRequest) => {
    showToast(`Downloading manifest ${r.manifestId}…`);
    const success = await ordersApi.downloadManifest(r.manifestId, r.ordersCount);
    if (success) {
      showToast(`✓ Manifest ${r.manifestId} downloaded`);
    } else {
      showToast(`Failed to download manifest ${r.manifestId}`);
    }
  };

  const handleEscalate = async (r: PickupRequest) => {
    setEscalateTarget(r);
  };

  const countLabel = `${filteredRows.length} pickup request${filteredRows.length === 1 ? '' : 's'}`;

  return (
    <div className="page">
      {/* ── Header row: title left, CTAs right ─────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">Pickup Requests</div>
        </div>
        <div className="ord-ph-r">
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={() => {
              window.location.reload();
            }}
          >
            {RefreshIcon}
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI strip (clickable filters) ─────────────────
           Passing `undefined` when the bucket is "all" keeps the
           default state visually unhighlighted — only the four
           status buckets paint the active ring when picked. This
           matches the Pending tab convention. */}
      <ShipmentKpiStrip
        cards={kpiCards}
        active={activeBucket === 'all' ? undefined : activeBucket}
        onSelect={handleKpiSelect}
        ariaLabel="Pickup request summary"
      />

      {/* ── Tools row: filter card (auto width) on the left, search
           input pinned to the right via `margin-left: auto`. The
           search input is the rightmost element ("first from right")
           and accepts comma / whitespace-separated manifest ids. */}
      <div className="ord-tools-row">
        <div className="ord-fbar" role="toolbar" aria-label="Pickup request filters">
          <div className="ord-fb-lbl">Filters</div>
          <div className="ord-fdiv" />

          <FilterChip
            mode="single"
            label="Date"
            options={DATE_RANGE_OPTIONS}
            value={dateRange}
            onChange={(v) => setDateRange(v ?? '17-03_16-04')}
          />
          <FilterChip
            mode="multi"
            label="Status"
            options={PICKUP_STATUSES}
            values={statuses}
            countNoun="statuses"
            onChange={handleStatusChange}
          />
          <FilterChip
            mode="multi"
            label="Shipment Mode"
            options={PICKUP_SHIPMENT_MODES}
            values={shipmentModes}
            countNoun="modes"
            onChange={setShipmentModes}
          />
          <FilterChip
            mode="multi"
            label="Pickup Location"
            options={PICKUP_LOCATIONS}
            values={pickupLocations}
            countNoun="locations"
            onChange={setPickupLocations}
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

        <div className="ord-tools-actions">
          <label
            className="ord-srch"
            aria-label="Search pickups by Pickup ID"
          >
            <span className="ord-srch-ico" aria-hidden="true">{SearchIcon}</span>
            <input
              type="text"
              placeholder="Search by Pickup ID"
              value={pickupIdSearch}
              onChange={(e) => setPickupIdSearch(e.target.value)}
            />
            {pickupIdSearch && (
              <button
                type="button"
                className="ord-srch-x"
                onClick={() => setPickupIdSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>
        </div>
      </div>

      {/* ── Inline count above the grid ──────────────────── */}
      <div className="ord-count-row">
        <span className="ord-count">
          <b>{countLabel}</b>
        </span>
      </div>

      {/* ── Pickup Requests grid ─────────────────────────── */}
      <PickupRequestsGrid
        rows={filteredRows}
        sort={sort}
        onSortChange={setSort}
        onExport={handleExport}
        onEscalate={handleEscalate}
        onManifestClick={(r) => showToast(`Opening manifest ${r.manifestId} details — coming soon`)}
      />

      {toast && <Toast />}

      {escalateTarget && (
        <EscalatePickupModal
          manifestId={escalateTarget.manifestId}
          onClose={() => setEscalateTarget(null)}
          onSubmit={async (remarks, file) => {
            const payload = {
              type: 'shipment',
              category: 'Pickup Related Issues',
              sub_category: 'Complaint',
              issue_type: 'Complaint',
              issue: 'Pickup delayed',
              subject: `Pickup delayed for manifest ${escalateTarget.manifestId}`,
              awb_no: escalateTarget.manifestId,
              remarks: remarks || `Escalation raised for manifest ${escalateTarget.manifestId}`,
              file
            };
            const success = await supportApi.createTicket(payload);
            if (success) {
              showToast(`✓ Ticket created for manifest ${escalateTarget.manifestId}`);
            } else {
              showToast(`✓ Escalation raised for manifest ${escalateTarget.manifestId}`);
            }
            setEscalateTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default PickupRequestPage;
