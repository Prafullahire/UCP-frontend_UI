import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import OrdersFilterBar, {
  initialPendingFilters,
  type OrdersFilterState,
} from './components/OrdersFilterBar';
import MoreFiltersDrawer from './components/MoreFiltersDrawer';
import PendingKpiStrip, { type KpiBucket } from './components/PendingKpiStrip';
import ShipmentKpiStrip, {
  type KpiCardSpec,
} from './components/ShipmentKpiStrip';
import BulkActionsDropdown from './components/BulkActionsDropdown';
import OrdersGrid, { type SortState } from './components/OrdersGrid';
import ShipmentsGrid, {
  type ShipmentSortState,
} from './components/ShipmentsGrid';
import AddTagModal from './components/AddTagModal';
import CancelOrderModal from './components/CancelOrderModal';
import OrderDetailsDrawer from './components/OrderDetailsDrawer';
import BulkPickupLocationModal from './components/BulkPickupLocationModal';
import BulkPackageDetailsModal, {
  type BulkPackageDetails,
} from './components/BulkPackageDetailsModal';
import BulkPaymentModeModal, {
  type BulkPaymentMode,
} from './components/BulkPaymentModeModal';
import BulkConfirmModal from './components/BulkConfirmModal';
import type { SavedPickup } from './data/forwardOrderData';
import {
  BULK_ACTIONS,
  DEFAULT_TAGS,
  computePendingKpis,
} from './data/ordersData';
import {
  computeAllShipmentKpis,
  computeDeliveredKpis,
  computeInTransitKpis,
  computeReadyToPickupKpis,
  computeReadyToShipKpis,
  computeRtoKpis,
  fmtRupees,
} from './data/shipmentsData';
import { ordersApi } from '../../services/ordersApi';
import type { BulkAction } from './data/ordersData';
import type { Order, OrderTabId, Shipment } from './types';
import { generateInvoicePDF } from '../../utils/generateInvoice';

interface TabSpec {
  id: OrderTabId;
  label: string;
}

const TABS: TabSpec[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'ready-to-ship', label: 'Ready to Ship' },
  { id: 'ready-to-pickup', label: 'Ready to Pickup' },
  { id: 'in-transit', label: 'In Transit' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'rto', label: 'RTO' },
  { id: 'all', label: 'All' },
];

/* Icons used in the actions group (download / bulk upload glyphs) */
const DownloadIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M2.5 13.5h11" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BulkUpdateIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2" y="3" width="12" height="2.5" rx=".7" />
    <rect x="2" y="7" width="12" height="2.5" rx=".7" />
    <rect x="2" y="11" width="7" height="2.5" rx=".7" />
  </svg>
);

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  /* ─── Tab + filter state ─────────────────────────────────── */
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as OrderTabId | null;
  const [activeTab, setActiveTab] = useState<OrderTabId>(urlTab || 'pending');
  const [filters, setFilters] = useState<OrdersFilterState>(initialPendingFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  /* ─── Active KPI bucket per tab ────────────────────────────
     One bucket map keyed by tab id keeps every tab's KPI filter
     independent — switching tabs preserves the previous selection. */
  const [pendingBucket, setPendingBucket] = useState<KpiBucket>('all');
  const [shipmentBucket, setShipmentBucket] = useState<string>('all');

  /* ─── Orders + Shipment selection + sort ─────────────────── */
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipmentsRecord, setShipmentsRecord] = useState<Record<string, Shipment[]>>({
    'ready-to-ship': [],
    'ready-to-pickup': [],
    'in-transit': [],
    delivered: [],
    rto: [],
    all: []
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /* `null` = default unsorted state — header arrows are hidden. */
  const [pendingSort, setPendingSort] = useState<SortState | null>(null);
  const [shipmentSort, setShipmentSort] = useState<ShipmentSortState | null>(null);

  /* ─── Tag library — accumulates new tags as users create them ── */
  const [tagPool, setTagPool] = useState<string[]>(DEFAULT_TAGS);

  /* ─── Modal state ────────────────────────────────────────── */
  const [addTagFor, setAddTagFor] = useState<Order | Shipment | null>(null);
  const [cancelFor, setCancelFor] = useState<(Order | Shipment)[] | null>(null);

  /* ─── Bulk-action modal state ─────────────────────────────────
     Each bulk-edit dialog stores the in-flight action so a single
     state variable can drive every modal in the page. Action-style
     bulk operations (Ship, Print, Book Pickup, …) flow through
     `bulkConfirm` which renders the shared <BulkConfirmModal /> with
     action-specific copy. */
  const [bulkPickupOpen, setBulkPickupOpen] = useState(false);
  const [bulkPackageOpen, setBulkPackageOpen] = useState(false);
  const [bulkPaymentOpen, setBulkPaymentOpen] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<{
    actionId: string;
    title: string;
    subtitle?: string;
    confirmLabel: string;
    variant?: 'primary' | 'danger';
    noun?: string;
    bodyText?: React.ReactNode;
  } | null>(null);
  /* Read-only Order Details drawer source — opened from the Pending grid
     when a user clicks an Order ID hyperlink, or from the All Orders
     grid via the "View Details" hyperlink. Holds either an `Order` (when
     opened from the Pending tab) or a `Shipment` (every other tab). The
     drawer branches on the discriminator and renders the same set of
     read-only sections. */
  const [viewOrderFor, setViewOrderFor] = useState<Order | Shipment | null>(null);

  /* ─── API Integration ────────────────────────────────────── */
  const fetchData = React.useCallback(async () => {
    if (activeTab === 'pending') {
      const data = await ordersApi.fetchPendingOrders(filters);
      setOrders(data);
    } else {
      const data = await ordersApi.fetchShipments(activeTab, filters);
      setShipmentsRecord(prev => ({ ...prev, [activeTab]: data }));
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── Derived: filtered orders (Pending tab) ─────────────── */
  const filteredOrders = useMemo(() => {
    let list = orders;

    if (pendingBucket === 'waiting') {
      list = list.filter((o) => !o.needsAttention && !o.incomplete);
    } else if (pendingBucket === 'attention') {
      list = list.filter((o) => o.needsAttention);
    } else if (pendingBucket === 'incomplete') {
      list = list.filter((o) => o.incomplete);
    }

    if (filters.pickupLocations.length > 0) {
      list = list.filter((o) => filters.pickupLocations.includes(o.pickupLocation));
    }
    if (filters.paymentMode) {
      const wantMode = filters.paymentMode.toLowerCase() === 'cod' ? 'COD' : 'Prepaid';
      list = list.filter((o) => o.payment.mode === wantMode);
    }
    if (filters.channels.length > 0) {
      list = list.filter((o) =>
        filters.channels.includes(o.channel.toLowerCase().replace(/\s+/g, '')),
      );
    }
    if (filters.status) {
      list = list.filter((o) => o.age === filters.status);
    }
    if (filters.tags.length > 0) {
      list = list.filter((o) => filters.tags.some((t) => o.tags.includes(t)));
    }
    if (filters.orderIdSearch.trim()) {
      const wanted = filters.orderIdSearch
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      list = list.filter((o) => wanted.includes(o.id));
    }
    return list;
  }, [orders, filters, pendingBucket]);

  /* ─── Derived: filtered shipments (every non-Pending tab) ──
     Memoising the dataset lookup keeps the downstream `useMemo` deps
     referentially stable across renders. */
  const activeShipments: Shipment[] = useMemo(
    () => (activeTab === 'pending' ? [] : shipmentsRecord[activeTab]),
    [activeTab, shipmentsRecord],
  );

  const filteredShipments = useMemo(() => {
    let list = activeShipments;

    /* KPI bucket — each tab uses its own bucket vocabulary so the
       filter is applied via the dedicated mapper below. */
    list = applyShipmentBucket(list, activeTab, shipmentBucket);

    if (filters.pickupLocations.length > 0) {
      list = list.filter((s) => filters.pickupLocations.includes(s.pickupLocation));
    }
    if (filters.paymentMode) {
      const wantMode = filters.paymentMode.toLowerCase() === 'cod' ? 'COD' : 'Prepaid';
      list = list.filter((s) => s.payment.mode === wantMode);
    }
    if (filters.transportMode) {
      list = list.filter((s) => s.transportMode === filters.transportMode);
    }
    if (filters.shipmentStatuses.length > 0) {
      list = list.filter((s) => filters.shipmentStatuses.includes(s.status));
    }
    if (filters.tags.length > 0) {
      list = list.filter((s) => filters.tags.some((t) => s.tags.includes(t)));
    }
    if (filters.orderIdSearch.trim()) {
      const wanted = filters.orderIdSearch
        .split(/[\s,]+/)
        .map((q) => q.trim())
        .filter(Boolean);
      list = list.filter((s) => wanted.includes(s.id));
    }
    return list;
  }, [activeShipments, activeTab, filters, shipmentBucket]);

  const pendingKpis = useMemo(() => computePendingKpis(orders), [orders]);

  /* ─── Shipment KPI tile configs per tab ──────────────────── */
  const shipmentCards: KpiCardSpec[] = useMemo(
    () => buildShipmentKpiCards(activeTab, activeShipments),
    [activeTab, activeShipments],
  );

  /* Toggle the active KPI bucket; selecting the active card again clears it. */
  const handlePendingKpiSelect = (bucket: KpiBucket) => {
    setPendingBucket((prev) => (prev === bucket ? 'all' : bucket));
  };
  const handleShipmentKpiSelect = (bucket: string) => {
    setShipmentBucket((prev) => (prev === bucket ? 'all' : bucket));
  };

  /* ─── Selection helpers (work against the current tab's rows) ── */
  const currentRows: { id: string }[] =
    activeTab === 'pending' ? filteredOrders : filteredShipments;

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
      const allOnPage = currentRows.every((r) => prev.has(r.id));
      if (allOnPage) {
        const next = new Set(prev);
        currentRows.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      currentRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  /* ─── Row-level handlers ─────────────────────────────────── */
  const handleShip = (o: Order) => {
    navigate(`/orders/${o.id}/ship`, { state: { order: o } });
  };

  const handleMarkReady = (s: Shipment) =>
    showToast(`✅ ${s.id} marked ready for pickup`);

  const handlePrintLabel = (s: Shipment) =>
    showToast(`🖨️ Printing label for ${s.id} — coming soon`);

  const handlePrintInvoice = async (o: any) => {
    showToast(`🖨️ Generating dynamic invoice for ${o.id}...`);
    try {
      generateInvoicePDF([o]);
      showToast(`✅ Invoice for ${o.id} downloaded successfully`);
    } catch (err) {
      console.error(err);
      showToast(`❌ Failed to generate invoice for ${o.id}`);
    }
  };

  /* Pending tab's edit flow lands on the dedicated EditForwardOrderPage
     which mirrors the New Order composer with the order's details
     pre-filled. Shipment tabs (post-pending lifecycle) keep their
     "coming soon" toast — editing a shipped order would require a
     correction workflow that isn't in scope. */
  const handleEditOrder = (o: any) => {
    navigate(`/orders/${o.id}/edit`, { state: { order: o } });
  };

  const handleCloneOrder = (o: { id: string }) =>
    showToast(`📋 Clone ${o.id} — coming soon`);

  const handleDownloadPO = (s: Shipment) =>
    showToast(`📥 Purchase order for ${s.id} downloading…`);

  const openAddTag = (o: Order | Shipment) => setAddTagFor(o);

  const openCancel = (o: Order | Shipment) => setCancelFor([o]);

  const saveTags = (id: string, nextTags: string[], created: string[]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, tags: nextTags } : o)),
    );
    if (created.length > 0) {
      setTagPool((prev) => Array.from(new Set([...prev, ...created])));
    }
    setAddTagFor(null);
    showToast(`🏷️ Tags saved for ${id}`);
  };

  const confirmCancel = () => {
    if (!cancelFor) return;
    const ids = new Set(cancelFor.map((o) => o.id));
    setOrders((prev) => prev.filter((o) => !ids.has(o.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    showToast(
      cancelFor.length === 1
        ? `✕ ${cancelFor[0].id} cancelled`
        : `✕ ${cancelFor.length} orders cancelled`,
    );
    setCancelFor(null);
  };

  /* ─── Bulk action handler ────────────────────────────────────
     Each action id is routed to its own modal. Input-style actions
     (update pickup/package/payment) open dedicated modals built on
     the same form primitives as the New Order Creation screen so
     editing feels consistent. Every other action (Ship, Print, Book
     Pickup, …) flows through the shared <BulkConfirmModal /> with
     action-specific copy + CTA labels — keeps the bulk surface
     uniform without duplicating one modal per fire-and-forget
     command. */
  const handleBulkAction = (action: BulkAction) => {
    if (selected.size === 0) {
      showToast(`Select one or more rows to ${action.label.toLowerCase()}`);
      return;
    }

    /* Cancel keeps its existing dedicated modal — it owns the danger
       framing + per-row total-value summary. Only the Pending tab
       exposes Cancel as a bulk action in BULK_ACTIONS. */
    if (action.id === 'cancel') {
      const picked = orders.filter((o) => selected.has(o.id));
      setCancelFor(picked);
      return;
    }

    /* Input-style edits on the Pending tab — each opens its own modal. */
    if (action.id === 'update-pickup') { setBulkPickupOpen(true); return; }
    if (action.id === 'update-package') { setBulkPackageOpen(true); return; }
    if (action.id === 'update-payment') { setBulkPaymentOpen(true); return; }

    /* Everything else is an action-style operation — route to the
       shared confirm modal with action-specific copy. */
    const spec = buildBulkConfirmSpec(action.id, action.label);
    setBulkConfirm({ actionId: action.id, ...spec });
  };

  /* ─── Bulk modal confirm handlers ─────────────────────────────
     Each handler closes the originating modal, fires the toast and
     (where applicable) mutates state. The mutations are deliberately
     conservative — we only mock-update visible fields on the Pending
     orders so the bulk action's effect is visible without an API. */
  const selectedCount = selected.size;

  const applyBulkPickup = (pickup: SavedPickup) => {
    setOrders((prev) =>
      prev.map((o) =>
        selected.has(o.id)
          ? {
            ...o,
            pickupLocation: pickup.id,
            pickup: { city: pickup.city, pin: pickup.pincode },
          }
          : o,
      ),
    );
    setBulkPickupOpen(false);
    showToast(
      `✓ Warehouse updated to "${pickup.name}" for ${selectedCount} order${selectedCount > 1 ? 's' : ''}`,
    );
    setSelected(new Set());
  };

  const applyBulkPackage = (details: BulkPackageDetails) => {
    /* Convert grams → "X kg" string to match the existing Order.package.deadWt format. */
    const weightKg = (details.weightGrams / 1000).toFixed(2);
    setOrders((prev) =>
      prev.map((o) =>
        selected.has(o.id)
          ? {
            ...o,
            package: {
              ...o.package,
              deadWt: `${weightKg} kg`,
              dims: `${details.length}×${details.breadth}×${details.height} (cm)`,
            },
          }
          : o,
      ),
    );
    setBulkPackageOpen(false);
    showToast(
      `✓ Package details updated for ${selectedCount} order${selectedCount > 1 ? 's' : ''}`,
    );
    setSelected(new Set());
  };

  const applyBulkPayment = (mode: BulkPaymentMode) => {
    setOrders((prev) =>
      prev.map((o) =>
        selected.has(o.id)
          ? { ...o, payment: { ...o.payment, mode: mode === 'COD' ? 'COD' : 'Prepaid' } }
          : o,
      ),
    );
    setBulkPaymentOpen(false);
    showToast(
      `✓ Payment mode set to ${mode} for ${selectedCount} order${selectedCount > 1 ? 's' : ''}`,
    );
    setSelected(new Set());
  };

  const applyBulkConfirm = async () => {
    if (!bulkConfirm) return;

    if (bulkConfirm.actionId === 'ship' && activeTab === 'pending') {
      const picked = orders.filter((o) => selected.has(o.id));
      showToast(`📦 Shipping ${picked.length} orders...`);

      let successCount = 0;
      for (const order of picked) {
        const success = await ordersApi.shipOrder(order.id);
        if (success) successCount++;
      }

      showToast(`✅ ${successCount} out of ${picked.length} orders shipped successfully!`);
      if (successCount > 0) {
        setOrders(prev => prev.filter(order => !selected.has(order.id)));
      }
    } else if (bulkConfirm.actionId === 'print-invoice') {
      const picked = activeTab === 'pending'
        ? orders.filter((o) => selected.has(o.id))
        : activeShipments.filter((s) => selected.has(s.id));
      if (picked.length > 0) {
        showToast(`🖨️ Generating invoices for ${picked.length} items...`);
        try {
          generateInvoicePDF(picked);
          showToast(`✅ Invoices downloaded successfully!`);
        } catch (err) {
          console.error(err);
          showToast(`❌ Failed to generate invoices.`);
        }
      }
    } else {
      showToast(
        `✓ ${bulkConfirm.title} applied to ${selectedCount} ${bulkConfirm.noun ?? 'order'}${selectedCount > 1 ? 's' : ''}`,
      );
    }

    setBulkConfirm(null);
    setSelected(new Set());
  };

  const handleDownloadReport = () => {
    showToast('📥 Report download started');

    const isPending = activeTab === 'pending';
    const list = isPending ? filteredOrders : filteredShipments;

    if (list.length === 0) {
      showToast('No data to download.');
      return;
    }

    let csvContent = "";
    if (isPending) {
      csvContent += "Order ID,Date,Time,Channel,Pickup Location,Customer Name,Customer Phone,City,PIN,Product Name,SKU,Quantity,Payment Amount,Payment Mode\n";
      (list as Order[]).forEach(o => {
        const row = [
          o.id, o.date, o.time, o.channel, o.pickupLocation,
          o.customer.name, o.customer.phone, o.customer.city, o.customer.pin,
          o.product.name, o.product.sku, o.product.qty,
          o.payment.amount, o.payment.mode
        ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "Order ID,AWB,Status,Channel,Customer Name,Customer Phone,Delivery City,Delivery PIN,Payment Amount,Payment Mode\n";
      (list as Shipment[]).forEach(s => {
        const row = [
          s.id, s.awb, s.status, s.channel,
          s.customer.name, s.customer.phone, s.delivery.city, s.delivery.pin,
          s.payment.amount, s.payment.mode
        ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* Reset all filters back to defaults (used by Clear all + Reset all). */
  const clearFilters = () => setFilters(initialPendingFilters);

  /* Tab change resets selection + per-tab KPI buckets so each tab starts fresh. */
  const handleTabChange = (id: OrderTabId) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
    setSelected(new Set());
    setPendingBucket('all');
    setShipmentBucket('all');
  };

  /* ─── Determine count label above the grid (right-aligned) ─ */
  const countLabel =
    activeTab === 'pending'
      ? `${filteredOrders.length} orders`
      : `${filteredShipments.length} shipments`;

  return (
    <div className="page">
      {/* ── Header row: title left, CTAs right ──────────────── */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">Orders</div>
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
          <button
            type="button"
            className="ord-cta ord-cta-p"
            onClick={() => navigate('/orders/new-forward')}
          >
            + Forward Order
          </button>
          <button
            type="button"
            className="ord-cta ord-cta-s"
            onClick={() => navigate('/orders/new-reverse')}
          >
            + Reverse Order
          </button>
        </div>
      </div>

      {/* ── KPI cards (per-tab) ─────────────────────────────── */}
      {activeTab === 'pending' && (
        <PendingKpiStrip
          kpis={pendingKpis}
          active={pendingBucket}
          onSelect={handlePendingKpiSelect}
        />
      )}
      {activeTab !== 'pending' && (
        <ShipmentKpiStrip
          cards={shipmentCards}
          active={shipmentBucket}
          onSelect={handleShipmentKpiSelect}
          ariaLabel={`${activeTab} summary`}
        />
      )}

      {/* ── Tabs (below KPI cards per the brief) ────────────── */}
      <div className="ord-tabs" role="tablist" aria-label="Order lifecycle">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`ord-tab ${activeTab === t.id ? 'on' : ''}`}
            onClick={() => handleTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tools row: filter (auto-width) ←→ Bulk actions ──── */}
      <div className="ord-tools-row">
        <OrdersFilterBar
          tab={activeTab}
          state={filters}
          onChange={setFilters}
          onMoreFiltersClick={() => setDrawerOpen(true)}
          onClear={clearFilters}
        />

        <div className="ord-tools-actions">
          <button
            type="button"
            className="ord-icobtn"
            title="Bulk update"
            onClick={() => showToast('Bulk update — pick a CSV to begin')}
          >
            {BulkUpdateIcon}
          </button>
          <button
            type="button"
            className="ord-icobtn"
            title="Download report"
            onClick={handleDownloadReport}
          >
            {DownloadIcon}
          </button>
          <BulkActionsDropdown
            actions={BULK_ACTIONS[activeTab]}
            enabled={selected.size > 0}
            onPick={handleBulkAction}
          />
        </div>
      </div>

      {/* ── Inline count above the grid ─────────────────────── */}
      <div className="ord-count-row">
        <span className="ord-count">
          <b>{countLabel}</b>
        </span>
      </div>

      {/* ── Active tab body ─────────────────────────────────── */}
      {activeTab === 'pending' ? (
        <OrdersGrid
          orders={filteredOrders}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onShip={handleShip}
          onPrintInvoice={handlePrintInvoice}
          onEditOrder={handleEditOrder}
          onAddTag={openAddTag}
          onCloneOrder={handleCloneOrder}
          onCancelOrder={openCancel}
          onOrderIdClick={(o) => setViewOrderFor(o)}
          sort={pendingSort}
          onSortChange={setPendingSort}
          onSelectAllPages={() => showToast(`Selecting all orders across pages…`)}
        />
      ) : (
        <ShipmentsGrid
          tab={activeTab}
          shipments={filteredShipments}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onPrintInvoice={handlePrintInvoice}
          onPrintLabel={handlePrintLabel}
          onCloneOrder={handleCloneOrder}
          onCancelOrder={openCancel}
          onOrderIdClick={(s) => {
            setViewOrderFor(s);
          }}
          onPrimaryAction={handleMarkReady}
          onDownloadPO={handleDownloadPO}
          sort={shipmentSort}
          onSortChange={setShipmentSort}
          onSelectAllPages={() => showToast(`Selecting all shipments across pages…`)}
        />
      )}

      {/* ── Overlays ───────────────────────────────────────── */}
      {drawerOpen && (
        <MoreFiltersDrawer
          tab={activeTab}
          state={filters}
          availableTags={tagPool}
          onClose={() => setDrawerOpen(false)}
          onApply={setFilters}
          onReset={() => setFilters(initialPendingFilters)}
        />
      )}

      {addTagFor && (
        <AddTagModal
          order={addTagFor as Order}
          availableTags={tagPool}
          onClose={() => setAddTagFor(null)}
          onSave={saveTags}
        />
      )}

      {cancelFor && (
        <CancelOrderModal
          orders={cancelFor as Order[]}
          onClose={() => setCancelFor(null)}
          onConfirm={confirmCancel}
        />
      )}

      {bulkPickupOpen && (
        <BulkPickupLocationModal
          selectedCount={selectedCount}
          onClose={() => setBulkPickupOpen(false)}
          onConfirm={applyBulkPickup}
        />
      )}

      {bulkPackageOpen && (
        <BulkPackageDetailsModal
          selectedCount={selectedCount}
          onClose={() => setBulkPackageOpen(false)}
          onConfirm={applyBulkPackage}
        />
      )}

      {bulkPaymentOpen && (
        <BulkPaymentModeModal
          selectedCount={selectedCount}
          onClose={() => setBulkPaymentOpen(false)}
          onConfirm={applyBulkPayment}
        />
      )}

      {bulkConfirm && (
        <BulkConfirmModal
          title={bulkConfirm.title}
          subtitle={bulkConfirm.subtitle}
          selectedCount={selectedCount}
          noun={bulkConfirm.noun}
          bodyText={bulkConfirm.bodyText}
          confirmLabel={bulkConfirm.confirmLabel}
          variant={bulkConfirm.variant}
          onClose={() => setBulkConfirm(null)}
          onConfirm={applyBulkConfirm}
        />
      )}

      {viewOrderFor && (
        <OrderDetailsDrawer
          source={viewOrderFor}
          onClose={() => setViewOrderFor(null)}
        />
      )}

      {toast && <Toast />}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
 * Helpers — kept at module scope so the component body stays light.
 * ────────────────────────────────────────────────────────────── */

/**
 * Builds the per-action copy bundle consumed by the shared
 * <BulkConfirmModal />. Centralising the strings here keeps action
 * additions to a one-line entry instead of a new modal file and
 * matches the labels already declared in `BULK_ACTIONS`.
 *
 * `noun` controls the body's "X order(s)" / "X shipment(s)" copy; we
 * default to "order" for the pending tab actions and switch to
 * "shipment" for the post-pending lifecycle tabs.
 */
function buildBulkConfirmSpec(actionId: string, label: string): {
  title: string;
  subtitle?: string;
  confirmLabel: string;
  variant?: 'primary' | 'danger';
  noun?: string;
  bodyText?: React.ReactNode;
} {
  switch (actionId) {
    case 'ship':
      return {
        title: 'Ship Orders',
        subtitle: 'Generate AWBs and hand selected orders over to a courier',
        confirmLabel: 'Ship Now',
      };
    case 'print-invoice':
      return {
        title: 'Print Invoice',
        subtitle: 'Generate a combined invoice PDF for the selected rows',
        confirmLabel: 'Print',
      };
    case 'book-pickup':
      return {
        title: 'Book Pickup',
        subtitle: 'Schedule a single pickup for all selected shipments',
        confirmLabel: 'Book Pickup',
        noun: 'shipment',
      };
    case 'print-label':
      return {
        title: 'Print Label',
        subtitle: 'Generate shipping labels for the selected shipments',
        confirmLabel: 'Print Labels',
        noun: 'shipment',
      };
    case 'mark-handed':
      return {
        title: 'Mark Handed Over',
        subtitle: 'Record that the selected shipments were handed to the courier',
        confirmLabel: 'Mark Handed',
        noun: 'shipment',
      };
    case 'print-manifest':
      return {
        title: 'Print Manifest',
        subtitle: 'Generate the consolidated manifest for the selected pickups',
        confirmLabel: 'Print Manifest',
        noun: 'shipment',
      };
    case 'reschedule':
      return {
        title: 'Reschedule Pickup',
        subtitle: 'Notify the courier to reschedule pickup for these shipments',
        confirmLabel: 'Reschedule',
        noun: 'shipment',
      };
    case 'track':
      return {
        title: 'Track Shipments',
        subtitle: 'Open the consolidated tracking view for the selected shipments',
        confirmLabel: 'Open Tracking',
        noun: 'shipment',
      };
    case 'download-pod':
      return {
        title: 'Download POD',
        subtitle: 'Download Proof of Delivery PDFs for the selected shipments',
        confirmLabel: 'Download',
        noun: 'shipment',
      };
    case 'download-csv':
      return {
        title: 'Download CSV',
        subtitle: 'Export the selected rows as a CSV file',
        confirmLabel: 'Download CSV',
      };
    case 'request-rto':
      return {
        title: 'Request RTO',
        subtitle: 'Initiate Return-to-Origin for the selected shipments',
        confirmLabel: 'Request RTO',
        variant: 'danger',
        noun: 'shipment',
      };
    case 'accept-rto':
      return {
        title: 'Accept RTO',
        subtitle: 'Accept the courier-initiated RTO for these shipments',
        confirmLabel: 'Accept RTO',
        noun: 'shipment',
      };
    case 'dispute-rto':
      return {
        title: 'Dispute RTO',
        subtitle: 'File a dispute against the RTO for these shipments',
        confirmLabel: 'Dispute',
        variant: 'danger',
        noun: 'shipment',
      };
    default:
      return {
        title: label,
        confirmLabel: 'Confirm',
      };
  }
}

/**
 * Maps the active KPI bucket id to a Shipment[] filter. Each tab uses
 * a different bucket vocabulary (e.g. "stillWaiting" for Ready to Ship,
 * "slowInMovement" for In Transit). Falls through to the unfiltered
 * list when no bucket is active.
 */
function applyShipmentBucket(
  list: Shipment[],
  tab: OrderTabId,
  bucket: string,
): Shipment[] {
  if (bucket === 'all') return list;
  switch (tab) {
    case 'ready-to-ship':
      if (bucket === 'stillWaiting') return list.filter((s) => s.needsAttention);
      if (bucket === 'pickupUnscheduled') return list.filter((s) => !s.needsAttention);
      return list;
    case 'ready-to-pickup':
      if (bucket === 'awaitingPickup') return list.filter((s) => s.needsAttention);
      if (bucket === 'pickupReattempt') return list.filter((s) => s.status === 'pickup-reattempt' || s.status === 'awaiting-scan');
      return list;
    case 'in-transit':
      if (bucket === 'slowInMovement') return list.filter((s) => s.needsAttention);
      if (bucket === 'outForDelivery') return list.filter((s) => s.status === 'out-for-delivery');
      if (bucket === 'reattempted') return list.filter((s) => s.status === 'delayed');
      return list;
    case 'delivered':
      if (bucket === 'firstAttempt') return list.filter((s) => s.status === 'delivered');
      if (bucket === 'lateDelivery') return list.filter((s) => s.status === 'failed');
      return list;
    case 'rto':
      if (bucket === 'rtoInTransit') return list.filter((s) => s.status === 'rto-in-transit');
      if (bucket === 'rtoDelivered') return list.filter((s) => s.status === 'rto-delivered' || s.status === 'rto-completed');
      if (bucket === 'rtoInitiated') return list.filter((s) => s.status === 'rto-initiated');
      if (bucket === 'rtoCompleted') return list.filter((s) => s.status === 'rto-completed');
      return list;
    case 'all':
      if (bucket === 'inTransit') {
        return list.filter((s) =>
          ['picked-up', 'in-transit', 'out-for-delivery'].includes(s.status),
        );
      }
      if (bucket === 'delivered') return list.filter((s) => s.status === 'delivered');
      if (bucket === 'rto') return list.filter((s) => s.status.startsWith('rto-'));
      return list;
    default:
      return list;
  }
}

/** Per-tab KPI card configuration. Mirrors the supplied screenshots. */
function buildShipmentKpiCards(tab: OrderTabId, rows: Shipment[]): KpiCardSpec[] {
  switch (tab) {
    case 'ready-to-ship': {
      const k = computeReadyToShipKpis(rows);
      return [
        {
          id: 'all', label: 'Ready to Ship', value: k.readyToShip,
          accent: 'ink', icon: 'package'
        },
        {
          id: 'pickupUnscheduled', label: 'Pickup Unscheduled', value: k.pickupUnscheduled,
          accent: 'blue', icon: 'clock'
        },
        {
          id: 'stillWaiting', label: 'Still Waiting', value: k.stillWaiting,
          pill: { label: `Sitting >${k.waitingHours} hrs`, variant: 'warn' },
          accent: 'amber', icon: 'warn'
        },
      ];
    }
    case 'ready-to-pickup': {
      const k = computeReadyToPickupKpis(rows);
      return [
        {
          id: 'all', label: 'Scheduled for Pickup', value: k.scheduledForPickup,
          accent: 'ink', icon: 'truck'
        },
        {
          id: 'pickupReattempt', label: 'Pickup in Reattempt', value: k.pickupReattempt,
          accent: 'blue', icon: 'clock'
        },
        {
          id: 'awaitingPickup', label: 'Awaiting Pickup', value: k.awaitingPickup,
          pill: { label: `Sitting >${k.waitingHours} hrs`, variant: 'warn' },
          accent: 'amber', icon: 'warn'
        },
      ];
    }
    case 'in-transit': {
      const k = computeInTransitKpis(rows);
      return [
        {
          id: 'all', label: 'Total Orders In-Transit', value: k.totalInTransit,
          accent: 'ink', icon: 'route'
        },
        {
          id: 'slowInMovement', label: 'Slow in Movement', value: k.slowInMovement,
          pill: { label: `Sitting >${k.waitingHours} hrs`, variant: 'warn' },
          accent: 'amber', icon: 'warn'
        },
        {
          id: 'reattempted', label: 'Reattempted', value: k.reattempted,
          accent: 'blue', icon: 'clock'
        },
        {
          id: 'outForDelivery', label: 'Out for Delivery', value: k.outForDelivery,
          accent: 'green', icon: 'truck'
        },
      ];
    }
    case 'delivered': {
      const k = computeDeliveredKpis(rows);
      return [
        {
          id: 'all', label: 'Total Delivered Orders', value: fmtRupees(k.totalValue),
          sub: `${k.totalCount} Orders`,
          accent: 'ink', icon: 'total'
        },
        {
          id: 'firstAttempt', label: 'Delivery in First Attempt', value: k.firstAttempt,
          accent: 'green', icon: 'check'
        },
        {
          id: 'secondPlusAttempt', label: 'Delivery in 2+ Attempt', value: k.secondPlusAttempt,
          accent: 'blue', icon: 'clock'
        },
        {
          id: 'lateDelivery', label: 'Late Delivery', value: k.lateDelivery,
          accent: 'red', icon: 'fail'
        },
      ];
    }
    case 'rto': {
      const k = computeRtoKpis(rows);
      return [
        {
          id: 'rtoInTransit', label: 'RTO In Transit', value: k.rtoInTransit,
          accent: 'blue', icon: 'return'
        },
        {
          id: 'rtoDelivered', label: 'Delivered', value: k.rtoDelivered,
          accent: 'green', icon: 'check'
        },
        {
          id: 'rtoInitiated', label: 'RTO Initiated', value: k.rtoInitiated,
          accent: 'amber', icon: 'warn'
        },
        {
          id: 'rtoCompleted', label: 'RTO Completed', value: k.rtoCompleted,
          accent: 'ink', icon: 'package'
        },
      ];
    }
    case 'all': {
      const k = computeAllShipmentKpis(rows);
      return [
        {
          id: 'all', label: 'Total Shipments', value: k.totalShipments,
          sub: fmtRupees(k.totalValue),
          accent: 'ink', icon: 'total'
        },
        {
          id: 'inTransit', label: 'In Transit', value: k.inTransit,
          accent: 'blue', icon: 'route'
        },
        {
          id: 'delivered', label: 'Delivered', value: k.delivered,
          accent: 'green', icon: 'check'
        },
        {
          id: 'rto', label: 'RTO', value: k.rto,
          accent: 'red', icon: 'return'
        },
      ];
    }
    default:
      return [];
  }
}

export default OrdersPage;
