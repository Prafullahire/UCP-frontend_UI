<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
=======
import React, { useMemo, useState } from 'react';
>>>>>>> 225cb97 (changes on 15th June morning)
import RowActionsMenu, {
  CancelIcon,
  CloneIcon,
  EditIcon,
  PrintIcon,
  TagIcon,
} from './RowActionsMenu';
import type { Order } from '../types';

/**
 * Available sort keys. Maps directly to a column header — each header in the
 * pending grid is clickable and toggles asc → desc → asc.
 */
export type SortKey =
  | 'id'
  | 'customer'
  | 'product'
  | 'package'
  | 'payment'
  | 'status'
  | 'address';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface OrdersGridProps {
  orders: Order[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onShip: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onAddTag: (order: Order) => void;
  onCloneOrder: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  onOrderIdClick: (order: Order) => void;
  /** Current sort. `null` = default order, no header indicator. */
  sort: SortState | null;
  onSortChange: (next: SortState | null) => void;
  /** When true and at least one row is selected, render the red banner row. */
  showSelectionBanner?: boolean;
  onSelectAllPages?: () => void;
}

/** Header cells. The label drives the visible UPPERCASE column title. */
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id',       label: 'ORDER DETAILS' },
  { key: 'customer', label: 'CUSTOMER DETAILS' },
  { key: 'product',  label: 'PRODUCT DETAILS' },
  { key: 'package',  label: 'PACKAGE DETAILS' },
  { key: 'payment',  label: 'PAYMENT' },
  { key: 'status',   label: 'STATUS' },
  { key: 'address',  label: 'ADDRESS DETAILS' },
];

/** Pure sort comparator — accepts the same shape that lives in state.
 *  When `sort` is `null` the input order is returned untouched. */
function sortOrders(orders: Order[], sort: SortState | null): Order[] {
  if (!sort) return orders;
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...orders].sort((a, b) => {
    switch (sort.key) {
      case 'id':       return a.id.localeCompare(b.id) * dir;
      case 'customer': return a.customer.name.localeCompare(b.customer.name) * dir;
      case 'product':  return a.product.name.localeCompare(b.product.name) * dir;
      case 'package':  return (parseFloat(a.package.deadWt) - parseFloat(b.package.deadWt)) * dir;
      case 'payment':  return (a.payment.amount - b.payment.amount) * dir;
      case 'status':   return a.age.localeCompare(b.age) * dir;
      case 'address':  return a.delivery.city.localeCompare(b.delivery.city) * dir;
      default:         return 0;
    }
  });
}

const PhoneIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M3.5 4.5l1-2 2 2-1 1.5a8 8 0 003.5 3.5L10.5 8.5l2 2-2 1c-3 0-7-4-7-7z" strokeLinejoin="round" />
  </svg>
);

/**
 * Pending orders table. Combines:
 *   • sortable column headers (asc/desc, persistent indicator)
 *   • row-level checkbox + "select all" header checkbox (tristate)
 *   • per-row Ship button and 3-dot RowActionsMenu
 *   • optional selection banner row (replaces header when items are picked)
 */
export const OrdersGrid: React.FC<OrdersGridProps> = ({
  orders,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onShip,
  onPrintInvoice,
  onEditOrder,
  onAddTag,
  onCloneOrder,
  onCancelOrder,
  onOrderIdClick,
  sort,
  onSortChange,
  showSelectionBanner = true,
  onSelectAllPages,
}) => {
  const sorted = useMemo(() => sortOrders(orders, sort), [orders, sort]);

  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [orders, sort]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const partialSelected = !allSelected && orders.some((o) => selected.has(o.id));

  const [menuFor, setMenuFor] = useState<{ orderId: string; anchor: DOMRect } | null>(null);

  const openMenu = (orderId: string, el: HTMLElement) =>
    setMenuFor({ orderId, anchor: el.getBoundingClientRect() });
  const closeMenu = () => setMenuFor(null);

  const headerCheckboxClass = `ord-cb ${allSelected ? 'on' : partialSelected ? 'partial' : ''}`;

  /* Tri-state sort: 1st click → asc, 2nd click → desc, 3rd click → reset.
     Clicking a *different* column always starts at asc. */
  const handleSort = (key: SortKey) => {
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
              {COLUMNS.map((c) => {
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
                <td colSpan={COLUMNS.length + 1}>
                  <div className="ord-sel-info">
                    <span>{selected.size} selected</span>
                    {onSelectAllPages && (
                      <button
                        type="button"
                        className="ord-sel-link"
                        onClick={onSelectAllPages}
                      >
                        Select all {orders.length > 0 ? `${orders.length * 2}` : ''}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </thead>
          <tbody>
            {paginated.map((o) => {
              const isSelected = selected.has(o.id);
              return (
                <tr key={o.id} className={isSelected ? 'selected' : undefined}>
                  <td className="ord-col-cb">
                    <button
                      type="button"
                      className={`ord-cb ${isSelected ? 'on' : ''}`}
                      onClick={() => onToggleSelect(o.id)}
                      aria-label={isSelected ? `Deselect order ${o.id}` : `Select order ${o.id}`}
                    />
                  </td>

                  <td>
                    <a
                      className="ord-id"
                      onClick={(e) => {
                        e.preventDefault();
                        onOrderIdClick(o);
                      }}
                      href="#"
                    >
                      {o.id}
                    </a>
                    <div className="ord-date">{o.date} · {o.time}</div>
                    <div className="ord-meta">
                      Channel : <span className="ch">{o.channel}</span>
                    </div>
                  </td>

                  <td>
                    <div className="ord-name">{o.customer.name}</div>
                    <div className="ord-phone">
                      {PhoneIcon} {o.customer.phone}
                    </div>
                    <div className="ord-meta" style={{ marginTop: 4 }}>
                      {o.customer.city},{o.customer.pin}
                    </div>
                  </td>

                  <td>
                    <div className="ord-prod-name">{o.product.name}</div>
                    <div className="ord-sku">SKU {o.product.sku}</div>
                    <div className="ord-qty">
                      Qty <b>{o.product.qty}</b> &nbsp;&nbsp; HSN {o.product.hsn}
                    </div>
                  </td>

                  <td>
                    <div className="ord-pkg-line">Dead wt. &nbsp;{o.package.deadWt}</div>
                    <div className="ord-pkg-line">{o.package.dims}</div>
                    <div className="ord-pkg-line">Vol wt. &nbsp;{o.package.volWt}</div>
                  </td>

                  <td>
                    <div className="ord-pay-amt">
                      ₹{o.payment.amount.toLocaleString('en-IN')}
                    </div>
                    <div className={`ord-pay-mode ${o.payment.mode === 'COD' ? 'cod' : 'prepaid'}`}>
                      {o.payment.mode}
                    </div>
                  </td>

                  <td>
                    <span className={`ord-status ${o.age === 'NEW' ? 'new' : 'old'}`}>
                      {o.age}
                    </span>
                  </td>

                  <td>
                    <div className="ord-addr-from">{o.pickup.city} ({o.pickup.pin})</div>
                    <div className="ord-addr-arrow">TO</div>
                    <div className="ord-addr-to">{o.delivery.city} ({o.delivery.pin})</div>
                  </td>

                  <td>
                    <div className="ord-act-cell">
                      <button
                        type="button"
                        className="ord-ship-btn"
                        onClick={() => onShip(o)}
                      >
                        Ship <span className="arr">→</span>
                      </button>
                      <button
                        type="button"
                        className="ord-dot-btn"
                        aria-label="More actions"
                        aria-haspopup="menu"
                        onClick={(e) => openMenu(o.id, e.currentTarget)}
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
        const order = orders.find((o) => o.id === menuFor.orderId);
        if (!order) return null;
        const fire = (fn: (o: Order) => void) => () => {
          closeMenu();
          fn(order);
        };
        return (
          <RowActionsMenu
            anchor={menuFor.anchor}
            onClose={closeMenu}
            items={[
              { key: 'print-invoice', icon: PrintIcon, label: 'Print Invoice', onClick: fire(onPrintInvoice) },
              { key: 'edit-order',    icon: EditIcon,  label: 'Edit Order',    onClick: fire(onEditOrder) },
              { key: 'add-tag',       icon: TagIcon,   label: 'Add Order Tag', onClick: fire(onAddTag) },
              { key: 'clone-order',   icon: CloneIcon, label: 'Clone Order',   onClick: fire(onCloneOrder) },
              { key: 'cancel-order',  icon: CancelIcon, label: 'Cancel Order', onClick: fire(onCancelOrder),
                variant: 'danger', separatorAbove: true },
            ]}
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

export default OrdersGrid;
