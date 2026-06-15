import React, { useEffect, useState } from 'react';
import {
  AGE_STATUSES,
  CHANNELS,
  DATE_RANGE_OPTIONS,
  DEFAULT_TAGS,
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
import type { OrdersFilterState } from './OrdersFilterBar';

/**
 * Filter "kind" enum — used to declare which slots are already chips on
 * the page (and therefore should be hidden inside the drawer) and which
 * remain in the drawer as overflow.
 */
type FilterKind =
  | 'date'
  | 'pickup'
  | 'payment'
  | 'channel'
  | 'ageStatus'
  | 'transport'
  | 'shipmentStatus'
  | 'tags'
  | 'multiOrderId';

/**
 * Per-tab chip slots. Mirrors `OrdersFilterBar`'s tab → chip composition
 * so the drawer can hide whatever the page already exposes.
 */
const CHIP_SLOTS: Record<OrderTabId, FilterKind[]> = {
  'pending':         ['date', 'pickup', 'channel', 'payment', 'ageStatus'],
  'ready-to-ship':   ['date'],
  'ready-to-pickup': ['date', 'pickup', 'shipmentStatus', 'transport', 'payment'],
  'in-transit':      ['date', 'shipmentStatus', 'pickup', 'transport'],
  'delivered':       ['date', 'pickup', 'transport', 'payment', 'shipmentStatus'],
  'rto':             ['date', 'pickup', 'transport', 'payment', 'shipmentStatus'],
  'all':             ['date', 'pickup', 'transport', 'payment', 'shipmentStatus'],
};

/**
 * Per-tab relevant filters. Age status is only meaningful on Pending;
 * Shipment status applies to every lifecycle tab. Tags + Multi-order-id
 * are universal.
 */
const RELEVANT_FILTERS: Record<OrderTabId, FilterKind[]> = {
  'pending':         ['date', 'pickup', 'payment', 'channel', 'ageStatus', 'tags', 'multiOrderId'],
  'ready-to-ship':   ['date', 'pickup', 'payment', 'channel', 'transport', 'shipmentStatus', 'tags', 'multiOrderId'],
  'ready-to-pickup': ['date', 'pickup', 'payment', 'channel', 'transport', 'shipmentStatus', 'tags', 'multiOrderId'],
  'in-transit':      ['date', 'pickup', 'payment', 'channel', 'transport', 'shipmentStatus', 'tags', 'multiOrderId'],
  'delivered':       ['date', 'pickup', 'payment', 'channel', 'transport', 'shipmentStatus', 'tags', 'multiOrderId'],
  'rto':             ['date', 'pickup', 'payment', 'channel', 'transport', 'shipmentStatus', 'tags', 'multiOrderId'],
  'all':             ['date', 'pickup', 'payment', 'channel', 'transport', 'shipmentStatus', 'tags', 'multiOrderId'],
};

/** Shipment-status option lists keyed by tab — drawer surfaces only the
 *  statuses relevant to the active lifecycle stage. */
const SHIPMENT_STATUS_OPTS: Record<OrderTabId, FilterOption[]> = {
  'pending':         [],
  'ready-to-ship':   ALL_SHIPMENT_STATUSES.filter((o) => o.id === 'ready-to-ship'),
  'ready-to-pickup': READY_TO_PICKUP_STATUSES,
  'in-transit':      IN_TRANSIT_STATUSES,
  'delivered':       DELIVERED_STATUSES,
  'rto':             RTO_STATUSES,
  'all':             ALL_SHIPMENT_STATUSES,
};

interface MoreFiltersDrawerProps {
  /** Active tab — used to decide which sections to render. */
  tab: OrderTabId;
  state: OrdersFilterState;
  onClose: () => void;
  onApply: (next: OrdersFilterState) => void;
  onReset: () => void;
  /** Custom tag pool — falls back to DEFAULT_TAGS when omitted. */
  availableTags?: string[];
}

/** Generic pill multi-toggle used several times in the drawer body. */
const PillMulti: React.FC<{
  options: FilterOption[];
  values: string[];
  onToggle: (id: string) => void;
}> = ({ options, values, onToggle }) => (
  <div className="ord-df-options">
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        className={`ord-df-opt ${values.includes(o.id) ? 'on' : ''}`}
        onClick={() => onToggle(o.id)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/**
 * Right-side filter drawer. Renders only the filter sections that are
 * (a) relevant to the active tab AND (b) not already exposed as a chip
 * on the page — so the drawer is true overflow rather than a duplicate
 * of the chip bar. Tags + multi-order-id search are always shown since
 * they never live on the chip bar.
 */
export const MoreFiltersDrawer: React.FC<MoreFiltersDrawerProps> = ({
  tab,
  state,
  onClose,
  onApply,
  onReset,
  availableTags = DEFAULT_TAGS,
}) => {
  const [local, setLocal] = useState<OrdersFilterState>(state);

  useEffect(() => setLocal(state), [state]);

  /* Build the set of sections to render: relevant ∖ chips. */
  const chipSlots = new Set(CHIP_SLOTS[tab]);
  const show = (kind: FilterKind) =>
    RELEVANT_FILTERS[tab].includes(kind) && !chipSlots.has(kind);

  const toggle =
    <K extends 'pickupLocations' | 'channels' | 'tags' | 'shipmentStatuses'>(key: K) =>
    (id: string) => {
      const arr = local[key] as string[];
      const next = arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id];
      setLocal({ ...local, [key]: next });
    };

  const tagOptions: FilterOption[] = availableTags.map((t) => ({ id: t, label: t }));

  /* The date chip on In-Transit uses a different option set (EDD periods)
     vs the others (calendar windows). Mirror that in the drawer too. */
  const dateOptions = tab === 'in-transit' ? EDD_RANGE_OPTIONS : DATE_RANGE_OPTIONS;
  const dateLabel: Record<OrderTabId, string> = {
    pending:           'Date range',
    'ready-to-ship':   'Date range',
    'ready-to-pickup': 'Manifested date',
    'in-transit':      'Estimated delivery date',
    delivered:         'Date of delivery',
    rto:               'RTO date',
    all:               'Date range',
  };

  return (
    <div className="ord-drawer-ov" role="dialog" aria-modal="true" aria-label="All filters">
      <div className="ord-drawer">
        <div className="ord-drawer-hdr">
          <div>
            <div className="ord-drawer-title">All Filters</div>
            <div className="ord-drawer-sub">Refine the order list with the complete filter set</div>
          </div>
          <button type="button" className="ord-modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ord-drawer-body">
          {show('date') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">{dateLabel[tab]}</div>
              <PillMulti
                options={dateOptions}
                values={[local.dateRange]}
                onToggle={(id) => setLocal({ ...local, dateRange: id })}
              />
            </section>
          )}

          {show('pickup') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Pickup locations</div>
              <PillMulti
                options={PICKUP_LOCATIONS}
                values={local.pickupLocations}
                onToggle={toggle('pickupLocations')}
              />
            </section>
          )}

          {show('payment') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Payment mode</div>
              <PillMulti
                options={PAYMENT_MODES}
                values={local.paymentMode ? [local.paymentMode] : []}
                onToggle={(id) =>
                  setLocal({ ...local, paymentMode: local.paymentMode === id ? null : id })
                }
              />
            </section>
          )}

          {show('channel') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Channel</div>
              <PillMulti
                options={CHANNELS}
                values={local.channels}
                onToggle={toggle('channels')}
              />
            </section>
          )}

          {show('ageStatus') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Order status</div>
              <PillMulti
                options={AGE_STATUSES}
                values={local.status ? [local.status] : []}
                onToggle={(id) =>
                  setLocal({ ...local, status: local.status === id ? null : id })
                }
              />
            </section>
          )}

          {show('transport') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Transport mode</div>
              <PillMulti
                options={TRANSPORT_MODES}
                values={local.transportMode ? [local.transportMode] : []}
                onToggle={(id) =>
                  setLocal({ ...local, transportMode: local.transportMode === id ? null : id })
                }
              />
            </section>
          )}

          {show('shipmentStatus') && SHIPMENT_STATUS_OPTS[tab].length > 0 && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Shipment status</div>
              <PillMulti
                options={SHIPMENT_STATUS_OPTS[tab]}
                values={local.shipmentStatuses}
                onToggle={toggle('shipmentStatuses')}
              />
            </section>
          )}

          {show('tags') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Tags</div>
              <PillMulti
                options={tagOptions}
                values={local.tags}
                onToggle={toggle('tags')}
              />
            </section>
          )}

          {show('multiOrderId') && (
            <section className="ord-df-sec">
              <div className="ord-df-sec-lbl">Multi order ID search</div>
              <textarea
                className="ord-df-textarea"
                placeholder="Paste order IDs separated by comma or newline..."
                value={local.orderIdSearch}
                onChange={(e) => setLocal({ ...local, orderIdSearch: e.target.value })}
              />
            </section>
          )}
        </div>

        <div className="ord-drawer-ft">
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            Reset all
          </button>
          <button
            type="button"
            className="ord-cta ord-cta-p"
            onClick={() => {
              onApply(local);
              onClose();
            }}
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoreFiltersDrawer;
