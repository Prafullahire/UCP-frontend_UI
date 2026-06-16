import React, { useEffect, useMemo, useState } from 'react';
import RowActionsMenu from './RowActionsMenu';
import { SHIPMENT_STATUS_META } from '../data/shipmentsData';
import type { Shipment, OrderTabId } from '../types';

/**
 * Sortable columns supported across every shipment tab. The header row
 * exposes a subset of these depending on the active tab — sort logic
 * shares one comparator so behaviour stays consistent.
 */
export type ShipmentSortKey =
  | 'id'
  | 'customer'
  | 'address'
  | 'payment'
  | 'manifested'
  | 'shipping'
  | 'pdd'
  | 'days'
  | 'delivery'
  | 'status';

export type SortDir = 'asc' | 'desc';

export interface ShipmentSortState {
  key: ShipmentSortKey;
  dir: SortDir;
}

interface ShipmentsGridProps {
  /** Active tab — drives the column set + row CTA. */
  tab: Exclude<OrderTabId, 'pending'>;
  shipments: Shipment[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onPrintInvoice: (s: Shipment) => void;
  onEditOrder: (s: Shipment) => void;
  onAddTag: (s: Shipment) => void;
  onCloneOrder: (s: Shipment) => void;
  onCancelOrder: (s: Shipment) => void;
  onOrderIdClick: (s: Shipment) => void;
  /** Fires on the row-level primary CTA (e.g. "Mark Ready") */
  onPrimaryAction?: (s: Shipment) => void;
  /** Fires on the "Download PO" link in the Delivered tab */
  onDownloadPO?: (s: Shipment) => void;
  sort: ShipmentSortState | null;
  onSortChange: (next: ShipmentSortState | null) => void;
  showSelectionBanner?: boolean;
  onSelectAllPages?: () => void;
}

interface ColumnSpec {
  key: ShipmentSortKey;
  label: string;
}

/** Header configuration per tab — mirrors the supplied screenshots exactly. */
const COLUMNS_BY_TAB: Record<Exclude<OrderTabId, 'pending'>, ColumnSpec[]> = {
  'ready-to-ship': [
    { key: 'id',          label: 'ORDER DETAILS' },
    { key: 'manifested',  label: 'MANIFESTED' },
    { key: 'address',     label: 'ADDRESS DETAILS' },
    { key: 'shipping',    label: 'SHIPPING DETAILS' },
    { key: 'payment',     label: 'PAYMENT' },
    { key: 'status',      label: 'STATUS' },
  ],
  'ready-to-pickup': [
    { key: 'id',          label: 'ORDER DETAILS' },
    { key: 'manifested',  label: 'MANIFESTED' },
    { key: 'address',     label: 'ADDRESS DETAILS' },
    { key: 'shipping',    label: 'SHIPPING DETAILS' },
    { key: 'payment',     label: 'PAYMENT' },
    { key: 'status',      label: 'STATUS' },
  ],
  'in-transit': [
    { key: 'id',          label: 'ORDER DETAILS' },
    { key: 'customer',    label: 'CUSTOMER DETAILS' },
    { key: 'address',     label: 'ADDRESS DETAILS' },
    { key: 'pdd',         label: 'PDD' },
    { key: 'payment',     label: 'PAYMENT' },
    { key: 'days',        label: 'DAYS IN TRANSIT' },
    { key: 'status',      label: 'STATUS' },
  ],
  delivered: [
    { key: 'id',          label: 'ORDER DETAILS' },
    { key: 'customer',    label: 'CUSTOMER DETAILS' },
    { key: 'address',     label: 'ADDRESS DETAILS' },
    { key: 'delivery',    label: 'DELIVERY DATE' },
    { key: 'payment',     label: 'PAYMENT' },
    { key: 'shipping',    label: 'PURCHASE ORDER' },
    { key: 'status',      label: 'STATUS' },
  ],
  rto: [
    { key: 'id',          label: 'ORDER DETAILS' },
    { key: 'customer',    label: 'CUSTOMER DETAILS' },
    { key: 'address',     label: 'ADDRESS DETAILS' },
    { key: 'manifested',  label: 'RTO INITIATED' },
    { key: 'payment',     label: 'PAYMENT' },
    { key: 'status',      label: 'STATUS' },
  ],
  all: [
    { key: 'id',          label: 'ORDER DETAILS' },
    { key: 'customer',    label: 'CUSTOMER DETAILS' },
    { key: 'address',     label: 'ADDRESS DETAILS' },
    { key: 'shipping',    label: 'SHIPPING DETAILS' },
    { key: 'payment',     label: 'PAYMENT' },
    { key: 'status',      label: 'STATUS' },
  ],
};

const PhoneIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M3.5 4.5l1-2 2 2-1 1.5a8 8 0 003.5 3.5L10.5 8.5l2 2-2 1c-3 0-7-4-7-7z" strokeLinejoin="round" />
  </svg>
);
const DownloadIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M2.5 13.5h11" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Shared sort comparator — null returns `shipments` untouched. */
function sortShipments(rows: Shipment[], sort: ShipmentSortState | null): Shipment[] {
  if (!sort) return rows;
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (sort.key) {
      case 'id':         return a.id.localeCompare(b.id) * dir;
      case 'customer':   return a.customer.name.localeCompare(b.customer.name) * dir;
      case 'address':    return a.delivery.city.localeCompare(b.delivery.city) * dir;
      case 'payment':    return (a.payment.amount - b.payment.amount) * dir;
      case 'manifested': return (a.manifestedDate ?? '').localeCompare(b.manifestedDate ?? '') * dir;
      case 'pdd':        return (a.pddDate ?? '').localeCompare(b.pddDate ?? '') * dir;
      case 'days':       return ((a.daysInTransit ?? 0) - (b.daysInTransit ?? 0)) * dir;
      case 'delivery':   return (a.deliveryDate ?? '').localeCompare(b.deliveryDate ?? '') * dir;
      case 'shipping':   return (a.shippingCourier ?? '').localeCompare(b.shippingCourier ?? '') * dir;
      case 'status':     return a.status.localeCompare(b.status) * dir;
      default:           return 0;
    }
  });
}

/* ── Cell renderers ───────────────────────────────────────────────────────
 * Pulled out for readability — each one returns the inner contents of a
 * single <td>. Re-uses the same `.ord-*` typography classes as the
 * Pending grid so visual styling stays identical. */

const OrderDetailsCell: React.FC<{
  s: Shipment;
  onClick: () => void;
  /** When true, render a "View Details" hyperlink below the AWB/channel
   *  meta. Used by the All Orders tab to surface the read-only
   *  OrderDetailsDrawer entry point. */
  showViewDetailsLink?: boolean;
}> = ({ s, onClick, showViewDetailsLink }) => (
  <>
    <a
      className="ord-id"
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {s.id}
    </a>
    <div className="ord-meta" style={{ marginTop: 2 }}>
      AWB# <span className="ch">{s.awb}</span>
    </div>
    <div className="ord-meta" style={{ marginTop: 4 }}>
      Channel : <span className="ch">{s.channel}</span>
    </div>
    {showViewDetailsLink && (
      <a
        href="#"
        className="ord-view-details"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        View Details
      </a>
    )}
  </>
);

const CustomerCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-name">{s.customer.name}</div>
    <div className="ord-phone">
      {PhoneIcon} {s.customer.phone}
    </div>
    <div className="ord-meta" style={{ marginTop: 4 }}>
      {s.customer.city},{s.customer.pin}
    </div>
  </>
);

const ManifestedCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-date" style={{ fontWeight: 500, color: 'var(--ink)' }}>
      {s.manifestedDate ?? '—'}
    </div>
    {s.manifestedTime && <div className="ord-meta">{s.manifestedTime}</div>}
  </>
);

const RtoInitiatedCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-date" style={{ fontWeight: 500, color: 'var(--ink)' }}>
      {s.rtoInitiatedDate ?? '—'}
    </div>
    {s.rtoReason && <div className="ord-meta" style={{ marginTop: 4 }}>{s.rtoReason}</div>}
  </>
);

const AddressCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-addr-from">{s.pickup.city} ({s.pickup.pin})</div>
    <div className="ord-addr-arrow">TO</div>
    <div className="ord-addr-to">{s.delivery.city} ({s.delivery.pin})</div>
  </>
);

const ShippingCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-prod-name">
      {s.shippingCourier ?? '—'}{' '}
      {s.shippingWeight && <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>{s.shippingWeight}</span>}
    </div>
    {s.shippingZone && <div className="ord-meta" style={{ marginTop: 4 }}>{s.shippingZone}</div>}
  </>
);

const PddCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-date" style={{ fontWeight: 500, color: 'var(--ink)' }}>
      {s.pddDate ?? '—'}
    </div>
    {s.pddBreached
      ? <div className="ord-meta" style={{ color: 'var(--red)', fontWeight: 600 }}>PDD Breached</div>
      : s.pddTime && <div className="ord-meta">{s.pddTime}</div>}
  </>
);

const PaymentCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-pay-amt">₹{s.payment.amount.toLocaleString('en-IN')}</div>
    <div className={`ord-pay-mode ${s.payment.mode === 'COD' ? 'cod' : 'prepaid'}`}>
      {s.payment.mode}
    </div>
  </>
);

const DaysCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <div className="ord-name" style={{ marginBottom: 0 }}>
    {s.daysInTransit ? `Day ${s.daysInTransit}` : '—'}
  </div>
);

const DeliveryCell: React.FC<{ s: Shipment }> = ({ s }) => (
  <>
    <div className="ord-date" style={{ fontWeight: 500, color: 'var(--ink)' }}>
      {s.deliveryDate ?? '—'}
    </div>
    {s.deliveryTime && <div className="ord-meta">{s.deliveryTime}</div>}
  </>
);

const PurchaseOrderCell: React.FC<{ s: Shipment; onClick: () => void }> = ({ s, onClick }) => (
  s.hasPurchaseOrder ? (
    <button
      type="button"
      className="ord-po-link"
      onClick={onClick}
    >
      {DownloadIcon} <span>Download PO</span>
    </button>
  ) : <span className="ord-meta">—</span>
);

const StatusCell: React.FC<{ s: Shipment; tab: ShipmentsGridProps['tab'] }> = ({ s, tab }) => {
  /* In-Transit STATUS is an ON TIME / DELAYED pill derived from `onTime`,
     not the underlying `status` string. Every other tab renders the
     mapped status meta directly. */
  if (tab === 'in-transit') {
    return (
      <span className={`ord-status ${s.onTime ? 'green' : 'red'}`}>
        {s.onTime ? 'ON TIME' : 'DELAYED'}
      </span>
    );
  }
  const meta = SHIPMENT_STATUS_META[s.status as keyof typeof SHIPMENT_STATUS_META];
  if (!meta) {
    return (
      <span className={`ord-status grey`}>
        {String(s.status).toUpperCase()}
      </span>
    );
  }
  return (
    <span className={`ord-status ${meta.variant}`}>
      {meta.label.toUpperCase()}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────── */

export const ShipmentsGrid: React.FC<ShipmentsGridProps> = ({
  tab,
  shipments,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onPrintInvoice,
  onEditOrder,
  onAddTag,
  onCloneOrder,
  onCancelOrder,
  onOrderIdClick,
  onPrimaryAction,
  onDownloadPO,
  sort,
  onSortChange,
  showSelectionBanner = true,
  onSelectAllPages,
}) => {
  const columns = COLUMNS_BY_TAB[tab];
  const sorted = useMemo(() => sortShipments(shipments, sort), [shipments, sort]);

  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [shipments, sort]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const allSelected = shipments.length > 0 && shipments.every((s) => selected.has(s.id));
  const partialSelected = !allSelected && shipments.some((s) => selected.has(s.id));

  const [menuFor, setMenuFor] = useState<{ shipmentId: string; anchor: DOMRect } | null>(null);

  const openMenu = (id: string, el: HTMLElement) =>
    setMenuFor({ shipmentId: id, anchor: el.getBoundingClientRect() });
  const closeMenu = () => setMenuFor(null);

  const headerCheckboxClass = `ord-cb ${allSelected ? 'on' : partialSelected ? 'partial' : ''}`;

  const handleSort = (key: ShipmentSortKey) => {
    if (!sort || sort.key !== key) {
      onSortChange({ key, dir: 'asc' });
      return;
    }
    if (sort.dir === 'asc') {
      onSortChange({ key, dir: 'desc' });
      return;
    }
    onSortChange(null);
  };

  /** Returns the cell content for a given column + shipment row. */
  const renderCell = (col: ColumnSpec, s: Shipment): React.ReactNode => {
    switch (col.key) {
      case 'id':         return (
        <OrderDetailsCell
          s={s}
          onClick={() => onOrderIdClick(s)}
          showViewDetailsLink={tab === 'all'}
        />
      );
      case 'customer':   return <CustomerCell s={s} />;
      case 'manifested': return tab === 'rto'
        ? <RtoInitiatedCell s={s} />
        : <ManifestedCell s={s} />;
      case 'address':    return <AddressCell s={s} />;
      case 'shipping':
        /* Delivered re-uses the "shipping" slot for the PURCHASE ORDER cell;
           every other tab renders the actual shipping details. */
        return tab === 'delivered'
          ? <PurchaseOrderCell s={s} onClick={() => onDownloadPO?.(s)} />
          : <ShippingCell s={s} />;
      case 'pdd':        return <PddCell s={s} />;
      case 'payment':    return <PaymentCell s={s} />;
      case 'days':       return <DaysCell s={s} />;
      case 'delivery':   return <DeliveryCell s={s} />;
      case 'status':     return <StatusCell s={s} tab={tab} />;
      default:           return null;
    }
  };

  return (
    <div className="ord-grid">
      <div className="ord-grid-scroll">
        <table className="ord-tbl">
          <thead>
            <tr>
              <th className="ord-col-cb">
                <button
                  type="button"
                  className={headerCheckboxClass}
                  onClick={onToggleSelectAll}
                  aria-label={allSelected ? 'Deselect all' : 'Select all on this page'}
                />
              </th>
              {columns.map((c) => {
                const isActive = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={`sortable ${isActive ? 'on' : ''}`}
                    onClick={() => handleSort(c.key)}
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
                      <span className="ord-th-arr" aria-hidden="true">
                        {isActive ? (sort!.dir === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </span>
                  </th>
                );
              })}
              <th>ACTIONS</th>
            </tr>

            {showSelectionBanner && selected.size > 0 && (
              <tr className="ord-sel-row">
                <td className="ord-col-cb">
                  <button
                    type="button"
                    className={headerCheckboxClass}
                    onClick={onToggleSelectAll}
                    aria-label="Toggle selection"
                  />
                </td>
                <td colSpan={columns.length + 1}>
                  <div className="ord-sel-info">
                    <span>{selected.size} selected</span>
                    {onSelectAllPages && (
                      <button
                        type="button"
                        className="ord-sel-link"
                        onClick={onSelectAllPages}
                      >
                        Select all {shipments.length > 0 ? `${shipments.length * 2}` : ''}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </thead>
          <tbody>
            {paginated.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <tr key={s.id} className={isSelected ? 'selected' : undefined}>
                  <td className="ord-col-cb">
                    <button
                      type="button"
                      className={`ord-cb ${isSelected ? 'on' : ''}`}
                      onClick={() => onToggleSelect(s.id)}
                      aria-label={isSelected ? `Deselect ${s.id}` : `Select ${s.id}`}
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key}>{renderCell(c, s)}</td>
                  ))}
                  <td>
                    <div className="ord-act-cell">
                      {tab === 'ready-to-ship' && (
                        <button
                          type="button"
                          className="ord-ship-btn"
                          onClick={() => onPrimaryAction?.(s)}
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        type="button"
                        className="ord-dot-btn"
                        aria-label="More actions"
                        aria-haspopup="menu"
                        onClick={(e) => openMenu(s.id, e.currentTarget)}
                      >
                        ⋯
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {menuFor && (() => {
        const ship = shipments.find((x) => x.id === menuFor.shipmentId);
        if (!ship) return null;
        return (
          <RowActionsMenu
            anchor={menuFor.anchor}
            onClose={closeMenu}
            onPrintInvoice={() => {
              closeMenu();
              onPrintInvoice(ship);
            }}
            onEditOrder={() => {
              closeMenu();
              onEditOrder(ship);
            }}
            onAddTag={() => {
              closeMenu();
              onAddTag(ship);
            }}
            onCloneOrder={() => {
              closeMenu();
              onCloneOrder(ship);
            }}
            onCancelOrder={() => {
              closeMenu();
              onCancelOrder(ship);
            }}
          />
        );
      })()}

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

export default ShipmentsGrid;
