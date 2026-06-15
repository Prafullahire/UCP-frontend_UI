import React from 'react';
import FilterChip from './FilterChip';
import {
  AGE_STATUSES,
  CHANNELS,
  DATE_RANGE_OPTIONS,
  EDD_RANGE_OPTIONS,
  PAYMENT_MODES,
  PICKUP_LOCATIONS,
} from '../data/ordersData';
import {
  ALL_SHIPMENT_STATUSES,
  DELIVERED_STATUSES,
  IN_TRANSIT_STATUSES,
  READY_TO_PICKUP_STATUSES,
  RTO_STATUSES,
  TRANSPORT_MODES,
} from '../data/shipmentsData';
import type { FilterOption, OrderTabId } from '../types';

/**
 * Unified filter state shared by the Pending tab + every Shipment tab.
 * Each tab uses a subset of the fields — unused slots remain at their
 * defaults so the More Filters drawer can still surface them globally.
 */
export interface OrdersFilterState {
  dateRange: string;
  pickupLocations: string[];
  paymentMode: string | null;
  channels: string[];
  /** Pending tab only — order age (NEW / OLD). */
  status: string | null;
  /** Shipment lifecycle statuses (multi-select). */
  shipmentStatuses: string[];
  /** Transport mode (single-select). */
  transportMode: string | null;
  /** Extra filters added via the "More filters" drawer */
  tags: string[];
  /** Raw text the user typed in the "multi order id" box (comma/newline separated) */
  orderIdSearch: string;
}

/** Backwards-compat alias retained while callers migrate. */
export type PendingFilterState = OrdersFilterState;

export const initialPendingFilters: OrdersFilterState = {
  dateRange: '17-03_16-04',
  pickupLocations: [],
  paymentMode: null,
  channels: [],
  status: null,
  shipmentStatuses: [],
  transportMode: null,
  tags: [],
  orderIdSearch: '',
};

interface OrdersFilterBarProps {
  tab: OrderTabId;
  state: OrdersFilterState;
  onChange: (next: OrdersFilterState) => void;
  onMoreFiltersClick: () => void;
  onClear: () => void;
}

const FilterIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
  </svg>
);

/** True if any user-controlled filter has a non-default value. */
function hasAnyFilter(s: OrdersFilterState): boolean {
  return (
    s.dateRange !== initialPendingFilters.dateRange ||
    s.pickupLocations.length > 0 ||
    s.paymentMode !== null ||
    s.channels.length > 0 ||
    s.status !== null ||
    s.shipmentStatuses.length > 0 ||
    s.transportMode !== null ||
    s.tags.length > 0 ||
    s.orderIdSearch.trim() !== ''
  );
}

/**
 * Per-tab date chip configuration. Different tabs re-frame the same
 * underlying `dateRange` field with their own label + option set —
 * Pending uses the calendar windows in `DATE_RANGE_OPTIONS`, In-Transit
 * uses the period-relative buckets in `EDD_RANGE_OPTIONS`, etc.
 */
const DATE_CHIP_CONFIG: Record<OrderTabId, { label: string; options: FilterOption[] }> = {
  pending:           { label: 'Date',       options: DATE_RANGE_OPTIONS },
  'ready-to-ship':   { label: 'Date',       options: DATE_RANGE_OPTIONS },
  'ready-to-pickup': { label: 'Manifested', options: DATE_RANGE_OPTIONS },
  'in-transit':      { label: 'EDD',        options: EDD_RANGE_OPTIONS },
  delivered:         { label: 'DOD',        options: DATE_RANGE_OPTIONS },
  rto:               { label: 'RTO Date',   options: DATE_RANGE_OPTIONS },
  all:               { label: 'Date',       options: DATE_RANGE_OPTIONS },
};

/**
 * Filter bar — patterned on `support_prototype_v7b.html` `.fbar`:
 * a single rounded card holding the "Filters" label, divider, per-tab
 * chip dropdowns, the "More Filters" trigger and a "Clear" action.
 *
 * Chip composition is driven by `tab` so adding a new lifecycle tab
 * only requires a new clause inside this component — no markup or
 * styling fork required.
 */
export const OrdersFilterBar: React.FC<OrdersFilterBarProps> = ({
  tab,
  state,
  onChange,
  onMoreFiltersClick,
  onClear,
}) => {
  const canClear = hasAnyFilter(state);

  /* Convenience setters keep the JSX terse without sacrificing clarity. */
  const set = <K extends keyof OrdersFilterState>(key: K, value: OrdersFilterState[K]) =>
    onChange({ ...state, [key]: value });

  const dateChipCfg = DATE_CHIP_CONFIG[tab];
  const DateChip = (
    <FilterChip
      mode="single"
      label={dateChipCfg.label}
      options={dateChipCfg.options}
      value={state.dateRange}
      onChange={(v) => set('dateRange', v ?? '17-03_16-04')}
    />
  );

  const PickupChip = (
    <FilterChip
      mode="multi"
      label="Pickup"
      options={PICKUP_LOCATIONS}
      values={state.pickupLocations}
      countNoun="locations"
      onChange={(values) => set('pickupLocations', values)}
    />
  );

  const PaymentChip = (
    <FilterChip
      mode="single"
      label="Payment"
      options={PAYMENT_MODES}
      value={state.paymentMode}
      onChange={(v) => set('paymentMode', v)}
    />
  );

  const TransportChip = (
    <FilterChip
      mode="single"
      label="Transport"
      options={TRANSPORT_MODES}
      value={state.transportMode}
      onChange={(v) => set('transportMode', v)}
    />
  );

  /* Per-tab status chip. Each tab uses a different option list so the
     dropdown surfaces only the statuses relevant to that lifecycle stage. */
  const statusChipFor = (tabId: OrderTabId): React.ReactNode | null => {
    if (tabId === 'ready-to-pickup') {
      return (
        <FilterChip
          mode="multi"
          label="Status"
          options={READY_TO_PICKUP_STATUSES}
          values={state.shipmentStatuses}
          countNoun="statuses"
          onChange={(values) => set('shipmentStatuses', values)}
        />
      );
    }
    if (tabId === 'in-transit') {
      return (
        <FilterChip
          mode="multi"
          label="Status"
          options={IN_TRANSIT_STATUSES}
          values={state.shipmentStatuses}
          countNoun="statuses"
          onChange={(values) => set('shipmentStatuses', values)}
        />
      );
    }
    if (tabId === 'delivered') {
      return (
        <FilterChip
          mode="multi"
          label="Status"
          options={DELIVERED_STATUSES}
          values={state.shipmentStatuses}
          countNoun="statuses"
          onChange={(values) => set('shipmentStatuses', values)}
        />
      );
    }
    if (tabId === 'rto') {
      return (
        <FilterChip
          mode="multi"
          label="Status"
          options={RTO_STATUSES}
          values={state.shipmentStatuses}
          countNoun="statuses"
          onChange={(values) => set('shipmentStatuses', values)}
        />
      );
    }
    if (tabId === 'all') {
      return (
        <FilterChip
          mode="multi"
          label="Status"
          options={ALL_SHIPMENT_STATUSES}
          values={state.shipmentStatuses}
          countNoun="statuses"
          onChange={(values) => set('shipmentStatuses', values)}
        />
      );
    }
    return null;
  };

  return (
    <div className="ord-fbar" role="toolbar" aria-label="Order filters">
      <div className="ord-fb-lbl">Filters</div>
      <div className="ord-fdiv" />

      {DateChip}

      {tab === 'pending' && (
        <>
          {PickupChip}
          <FilterChip
            mode="multi"
            label="Channel"
            options={CHANNELS}
            values={state.channels}
            countNoun="channels"
            onChange={(values) => set('channels', values)}
          />
          {PaymentChip}
          <FilterChip
            mode="single"
            label="Status"
            options={AGE_STATUSES}
            value={state.status}
            onChange={(v) => set('status', v)}
          />
        </>
      )}

      {tab === 'ready-to-pickup' && (
        <>
          {PickupChip}
          {statusChipFor('ready-to-pickup')}
          {TransportChip}
          {PaymentChip}
        </>
      )}

      {tab === 'in-transit' && (
        <>
          {statusChipFor('in-transit')}
          {PickupChip}
          {TransportChip}
        </>
      )}

      {tab === 'delivered' && (
        <>
          {PickupChip}
          {TransportChip}
          {PaymentChip}
          {statusChipFor('delivered')}
        </>
      )}

      {tab === 'rto' && (
        <>
          {PickupChip}
          {TransportChip}
          {PaymentChip}
          {statusChipFor('rto')}
        </>
      )}

      {tab === 'all' && (
        <>
          {PickupChip}
          {TransportChip}
          {PaymentChip}
          {statusChipFor('all')}
        </>
      )}

      {/* `ready-to-ship` deliberately exposes only the Date + More Filters
          combo per the brief. */}

      <button type="button" className="ord-fc" onClick={onMoreFiltersClick}>
        <span className="ord-fc-ico">{FilterIcon}</span>
        <span>More Filters</span>
      </button>

      <button
        type="button"
        className="ord-fb-clear"
        onClick={onClear}
        disabled={!canClear}
      >
        Clear all
      </button>
    </div>
  );
};

export default OrdersFilterBar;
