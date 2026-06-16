import React from 'react';
import FilterChip from '../../orders/components/FilterChip';
import {
  NDR_ATTEMPT_BUCKETS,
  NDR_CHANNELS,
  NDR_DATE_RANGE_OPTIONS,
  NDR_PAYMENT_MODES,
  NDR_REASONS,
  NDR_SHIPMENT_TYPES,
} from '../data/ndrData';

/** Snapshot of every active NDR filter. Lifted state lives on `NdrPage`. */
export interface NdrFilterState {
  dateRange: string | null;
  reason: string | null;
  attempts: string | null;
  shipmentType: string | null;
  paymentMode: string | null;
  channel: string | null;
}

export const initialNdrFilters: NdrFilterState = {
  dateRange: 'last30',
  reason: null,
  attempts: null,
  shipmentType: null,
  paymentMode: null,
  channel: null,
};

/** True when any chip is active (drives the "Clear all" button). */
export function hasAnyNdrFilter(s: NdrFilterState): boolean {
  return (
    s.dateRange !== 'last30' ||
    s.reason !== null ||
    s.attempts !== null ||
    s.shipmentType !== null ||
    s.paymentMode !== null ||
    s.channel !== null
  );
}

const CalendarIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="2" width="12" height="11" rx="2" />
    <path d="M1 6h12M5 1v2M9 1v2" strokeLinecap="round" />
  </svg>
);
const InfoIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="7" cy="7" r="5.5" />
    <path d="M7 4.5v3M7 9h.01" strokeLinecap="round" />
  </svg>
);
const ArrowsIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M2 7h10M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PlaneIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M2 11L7 2l5 9H2z" strokeLinejoin="round" />
  </svg>
);
const PayIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="3" width="12" height="9" rx="2" />
    <path d="M1 7h12M4 10h2" strokeLinecap="round" />
  </svg>
);
const ChannelIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="2" width="12" height="10" rx="2" />
    <path d="M1 6h12" strokeLinecap="round" />
    <path d="M5 9.5h4" strokeLinecap="round" />
  </svg>
);

interface NdrFilterBarProps {
  state: NdrFilterState;
  onChange: (next: NdrFilterState) => void;
  onClear: () => void;
}

/**
 * NDR filter bar — mirrors `.fbar` in `ui-source/screens/ndr-v1.html`.
 *
 * Reuses the shared `FilterChip` for every dropdown filter so the
 * visual + a11y behaviour stays in lockstep with the Orders module.
 * The "Days since attempt" chip is the only bespoke control — a
 * number input embedded inside a `.ord-fc` shell.
 */
export const NdrFilterBar: React.FC<NdrFilterBarProps> = ({ state, onChange, onClear }) => {
  const set = <K extends keyof NdrFilterState>(key: K, value: NdrFilterState[K]) =>
    onChange({ ...state, [key]: value });

  const canClear = hasAnyNdrFilter(state);

  return (
    <div className="ord-fbar" role="toolbar" aria-label="NDR filters">
      <div className="ord-fb-lbl">Filters</div>
      <div className="ord-fdiv" />

      <FilterChip
        mode="single"
        label="Date range"
        icon={CalendarIcon}
        options={NDR_DATE_RANGE_OPTIONS}
        value={state.dateRange}
        onChange={(v) => set('dateRange', v)}
      />

      <FilterChip
        mode="single"
        label="NDR Reason"
        icon={InfoIcon}
        options={NDR_REASONS}
        value={state.reason}
        onChange={(v) => set('reason', v)}
      />

      <FilterChip
        mode="single"
        label="No. of attempts"
        icon={ArrowsIcon}
        options={NDR_ATTEMPT_BUCKETS}
        value={state.attempts}
        onChange={(v) => set('attempts', v)}
      />

      <div className="ord-fdiv" />

      <FilterChip
        mode="single"
        label="Shipment type"
        icon={PlaneIcon}
        options={NDR_SHIPMENT_TYPES}
        value={state.shipmentType}
        onChange={(v) => set('shipmentType', v)}
      />

      <FilterChip
        mode="single"
        label="Payment mode"
        icon={PayIcon}
        options={NDR_PAYMENT_MODES}
        value={state.paymentMode}
        onChange={(v) => set('paymentMode', v)}
      />

      <FilterChip
        mode="single"
        label="Channel"
        icon={ChannelIcon}
        options={NDR_CHANNELS}
        value={state.channel}
        onChange={(v) => set('channel', v)}
      />

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

export default NdrFilterBar;
