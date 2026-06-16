/**
 * Mock data + KPI helpers + filter option sets for every non-Pending tab
 * in the Orders module (Ready to Ship, Ready to Pickup, In Transit,
 * Delivered, RTO, All Shipments).
 *
 * Each tab follows the same architecture as the Pending tab:
 *   • a static dataset (rows mirror the screenshots row-for-row)
 *   • a `computeXxxKpis(...)` helper that returns the KPI card values
 *   • status option lists used by both the inline filter chip + the
 *     drawer.
 *
 * Adding a new row anywhere automatically reflows the KPI numbers
 * because every KPI helper derives from the dataset (with small
 * paddings to keep the screenshot demo values stable).
 */
import type {
  FilterOption,
  Shipment,
  ShipmentStatus,
  StatusVariant,
} from '../types';

/* ──────────────────────────── Shared shipment lookups ──────────────────────────── */

export const TRANSPORT_MODES: FilterOption[] = [
  { id: 'air',     label: 'Air' },
  { id: 'surface', label: 'Surface' },
];

/**
 * Single source of truth for the visible label + colour variant of every
 * shipment status. Status pills + filter chips read from this map so a
 * label change anywhere propagates to every surface.
 */
export const SHIPMENT_STATUS_META: Record<
  ShipmentStatus,
  { label: string; variant: StatusVariant }
> = {
  /* Ready to Ship */
  'ready-to-ship':    { label: 'Ready to Ship',    variant: 'green' },
  /* Ready to Pickup */
  'agent-assigned':   { label: 'Agent Assigned',   variant: 'blue'  },
  'awaiting-scan':    { label: 'Awaiting Scan',    variant: 'amber' },
  'pickup-reattempt': { label: 'Pickup Reattempt', variant: 'amber' },
  /* In Transit */
  'picked-up':        { label: 'Picked Up',        variant: 'blue'  },
  'in-transit':       { label: 'In Transit',       variant: 'blue'  },
  'out-for-delivery': { label: 'Out for Delivery', variant: 'blue'  },
  'delayed':          { label: 'Delayed',          variant: 'red'   },
  'lost':             { label: 'Lost',             variant: 'red'   },
  'damage':           { label: 'Damage',           variant: 'red'   },
  /* Delivered */
  'delivered':        { label: 'Delivered',        variant: 'green' },
  'failed':           { label: 'Failed',           variant: 'red'   },
  /* RTO */
  'rto-initiated':    { label: 'RTO Initiated',    variant: 'amber' },
  'rto-in-transit':   { label: 'RTO In Transit',   variant: 'blue'  },
  'rto-delivered':    { label: 'RTO Delivered',    variant: 'grey'  },
  'rto-completed':    { label: 'RTO Completed',    variant: 'green' },
};

/** Helper that materialises a status id list into FilterOptions. */
const optsFor = (ids: ShipmentStatus[]): FilterOption[] =>
  ids.map((id) => ({ id, label: SHIPMENT_STATUS_META[id].label }));

/* ──────────────────────────── Per-tab status option lists ──────────────────────────── */
/*
 * Each list is presented in the exact ordering the brief calls out so the
 * Status chip's dropdown order matches the spec verbatim.
 */
export const READY_TO_PICKUP_STATUSES: FilterOption[] = optsFor([
  'agent-assigned',
  'awaiting-scan',
  'pickup-reattempt',
]);

export const IN_TRANSIT_STATUSES: FilterOption[] = optsFor([
  'picked-up',
  'in-transit',
  'out-for-delivery',
  'delayed',
  'lost',
  'damage',
]);

export const DELIVERED_STATUSES: FilterOption[] = optsFor([
  'delivered',
  'failed',
]);

export const RTO_STATUSES: FilterOption[] = optsFor([
  'rto-initiated',
  'rto-in-transit',
  'rto-delivered',
  'rto-completed',
]);

/** Superset used by the All Shipments tab (covers every lifecycle stage). */
export const ALL_SHIPMENT_STATUSES: FilterOption[] = optsFor([
  'ready-to-ship',
  'agent-assigned',
  'awaiting-scan',
  'pickup-reattempt',
  'picked-up',
  'in-transit',
  'out-for-delivery',
  'delayed',
  'lost',
  'damage',
  'delivered',
  'failed',
  'rto-initiated',
  'rto-in-transit',
  'rto-delivered',
  'rto-completed',
]);

/* ──────────────────────────── Mock data ────────────────────────────
 *
 * A small set of shipments per tab. AWB numbers stay sequential so the
 * screenshot rows feel like they came from the same import batch.
 */

/* Base templates so each row stays terse — overwritten per-row below. */
const baseAddress = {
  pickup:   { city: 'Bangalore', pin: '560004' },
  delivery: { city: 'Pune',      pin: '411038' },
};
const baseCustomer = {
  name: 'Divendra K.',
  phone: 'xxxxxxxxxx',
  city: 'Pune',
  pin: '411006',
};
const basePayment = { amount: 1450, mode: 'COD' as const };

/* ──────────────────────────── Ready to Ship ──────────────────────────── */

export const READY_TO_SHIP_SHIPMENTS: Shipment[] = [
  {
    id: '1234567890', awb: '1234567890', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'ready-to-ship',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
  {
    id: '1234567891', awb: '1234567891', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: { amount: 50000, mode: 'COD' },
    status: 'ready-to-ship',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    needsAttention: true,
    tags: ['High Priority'],
  },
  {
    id: '1234567892', awb: '1234567892', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'pune-wh-b',
    customer: baseCustomer, ...baseAddress, payment: { amount: 62500, mode: 'COD' },
    status: 'ready-to-ship',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
  {
    id: '1234567893', awb: '1234567893', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'mumbai-wh-a',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'ready-to-ship',
    shippingCourier: 'Surface Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'surface',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
  {
    id: '1234567894', awb: '1234567894', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'delhi-wh-c',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'ready-to-ship',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
];

/* ──────────────────────────── Ready to Pickup ──────────────────────────── */

export const READY_TO_PICKUP_SHIPMENTS: Shipment[] = [
  {
    id: '1234567890', awb: '1234567890', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'agent-assigned',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
  {
    id: '1234567891', awb: '1234567891', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'awaiting-scan',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    needsAttention: true,
    tags: [],
  },
  {
    id: '1234567892', awb: '1234567892', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'pune-wh-b',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'agent-assigned',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
  {
    id: '1234567893', awb: '1234567893', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'mumbai-wh-a',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'agent-assigned',
    shippingCourier: 'Surface Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'surface',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
  {
    id: '1234567894', awb: '1234567894', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'delhi-wh-c',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'agent-assigned',
    shippingCourier: 'Air Xpressbees', shippingWeight: '0.5kg', shippingZone: 'Zone B - Metro',
    transportMode: 'air',
    manifestedDate: '12 Apr 2026', manifestedTime: '09:30 AM',
    tags: [],
  },
];

/* ──────────────────────────── In Transit ──────────────────────────── */

export const IN_TRANSIT_SHIPMENTS: Shipment[] = [
  {
    id: '1234567890', awb: '1234567890', date: '11 Apr 2026', time: '3:57 PM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'in-transit',
    transportMode: 'air',
    pddDate: '14 Apr 2026', pddTime: '09:30 AM',
    daysInTransit: 1, onTime: true,
    tags: [],
  },
  {
    id: '1234567891', awb: '1234567891', date: '10 Apr 2026', time: '3:57 PM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'in-transit',
    transportMode: 'air',
    pddDate: '14 Apr 2026', pddTime: '09:30 AM',
    daysInTransit: 2, onTime: true,
    tags: [],
  },
  {
    id: '1234567892', awb: '1234567892', date: '08 Apr 2026', time: '3:57 PM',
    channel: 'Shopify', pickupLocation: 'mumbai-wh-a',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'delayed',
    transportMode: 'surface',
    pddDate: '14 Apr 2026', pddBreached: true,
    daysInTransit: 4, onTime: false,
    needsAttention: true,
    tags: [],
  },
];

/* ──────────────────────────── Delivered ──────────────────────────── */

export const DELIVERED_SHIPMENTS: Shipment[] = [
  {
    id: '1234567890', awb: '1234567890', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'delivered', transportMode: 'air',
    deliveryDate: '14 Apr 2026', deliveryTime: '11:30 AM',
    hasPurchaseOrder: true,
    tags: [],
  },
  {
    id: '1234567891', awb: '1234567891', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'delivered', transportMode: 'air',
    deliveryDate: '14 Apr 2026', deliveryTime: '11:30 AM',
    hasPurchaseOrder: true,
    tags: [],
  },
  {
    id: '1234567892', awb: '1234567892', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'pune-wh-b',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'failed', transportMode: 'surface',
    deliveryDate: '14 Apr 2026', deliveryTime: '11:30 AM',
    hasPurchaseOrder: true,
    tags: [],
  },
  {
    id: '1234567893', awb: '1234567893', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'mumbai-wh-a',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'delivered', transportMode: 'air',
    deliveryDate: '14 Apr 2026', deliveryTime: '11:30 AM',
    hasPurchaseOrder: true,
    tags: [],
  },
  {
    id: '1234567894', awb: '1234567894', date: '12 Apr 2026', time: '09:30 AM',
    channel: 'Shopify', pickupLocation: 'delhi-wh-c',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'delivered', transportMode: 'air',
    deliveryDate: '14 Apr 2026', deliveryTime: '11:30 AM',
    hasPurchaseOrder: true,
    tags: [],
  },
];

/* ──────────────────────────── RTO ──────────────────────────── */

export const RTO_SHIPMENTS: Shipment[] = [
  {
    id: '2234567890', awb: '2234567890', date: '08 Apr 2026', time: '11:00 AM',
    channel: 'Shopify', pickupLocation: 'bangalore-wh-d',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'rto-initiated', transportMode: 'air',
    manifestedDate: '07 Apr 2026', manifestedTime: '09:30 AM',
    rtoInitiatedDate: '08 Apr 2026', rtoReason: 'Customer Refused',
    tags: [],
  },
  {
    id: '2234567891', awb: '2234567891', date: '06 Apr 2026', time: '10:00 AM',
    channel: 'Shopify', pickupLocation: 'mumbai-wh-a',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'rto-in-transit', transportMode: 'surface',
    manifestedDate: '05 Apr 2026', manifestedTime: '11:00 AM',
    rtoInitiatedDate: '06 Apr 2026', rtoReason: 'Address Not Found',
    tags: [],
  },
  {
    id: '2234567892', awb: '2234567892', date: '04 Apr 2026', time: '09:00 AM',
    channel: 'WooCommerce', pickupLocation: 'pune-wh-b',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'rto-in-transit', transportMode: 'air',
    manifestedDate: '03 Apr 2026', manifestedTime: '14:00 PM',
    rtoInitiatedDate: '04 Apr 2026', rtoReason: 'Recipient Unavailable',
    tags: [],
  },
  {
    id: '2234567893', awb: '2234567893', date: '02 Apr 2026', time: '08:00 AM',
    channel: 'Shopify', pickupLocation: 'delhi-wh-c',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'rto-delivered', transportMode: 'surface',
    manifestedDate: '01 Apr 2026', manifestedTime: '15:00 PM',
    rtoInitiatedDate: '02 Apr 2026', rtoReason: 'Customer Refused',
    tags: [],
  },
  {
    id: '2234567894', awb: '2234567894', date: '01 Apr 2026', time: '12:00 PM',
    channel: 'Shopify', pickupLocation: 'hyderabad-wh-e',
    customer: baseCustomer, ...baseAddress, payment: basePayment,
    status: 'rto-completed', transportMode: 'air',
    manifestedDate: '31 Mar 2026', manifestedTime: '09:00 AM',
    rtoInitiatedDate: '01 Apr 2026', rtoReason: 'Damaged In Transit',
    tags: [],
  },
];

/* ──────────────────────────── All Shipments (union) ────────────────────────────
 *
 * Combines everything that lives in the other tabs so the "All" view
 * shows a single timeline across the lifecycle. IDs stay unique so
 * selection state doesn't collide. */
export const ALL_SHIPMENTS: Shipment[] = [
  ...READY_TO_SHIP_SHIPMENTS.map((s) => ({ ...s, id: 'A' + s.id })),
  ...READY_TO_PICKUP_SHIPMENTS.map((s) => ({ ...s, id: 'B' + s.id })),
  ...IN_TRANSIT_SHIPMENTS.map((s) => ({ ...s, id: 'C' + s.id })),
  ...DELIVERED_SHIPMENTS.map((s) => ({ ...s, id: 'D' + s.id })),
  ...RTO_SHIPMENTS.map((s) => ({ ...s, id: 'E' + s.id })),
];

/* ──────────────────────────── KPI value types ──────────────────────────── */

export interface ShipmentKpis {
  /** Big number on the leftmost card */
  primaryValue: string | number;
  /** Optional sub text under the primary card (e.g. "16 Orders") */
  primarySub?: string;
  /** Three secondary cards — same recipe as Pending's last three tiles */
  cardA: { value: number; sub?: string; needsAttentionSub?: boolean };
  cardB: { value: number; sub?: string; needsAttentionSub?: boolean };
  cardC: { value: number; sub?: string; needsAttentionSub?: boolean; danger?: boolean };
}

const formatRupees = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

/* ──────────────────────────── KPI helpers per tab ────────────────────────────
 *
 * Each helper takes its tab dataset and returns the 4 KPI cards. Numbers
 * are derived from the dataset whenever possible — small paddings keep
 * the demo values aligned with the supplied screenshots. */

export function computeReadyToShipKpis(rows: Shipment[]) {
  return {
    readyToShip:       rows.length,
    pickupUnscheduled: rows.length, // approximation
    stillWaiting:      rows.filter((r) => r.needsAttention).length,
    waitingHours:      24,
  };
}

export function computeReadyToPickupKpis(rows: Shipment[]) {
  return {
    scheduledForPickup: rows.length,
    pickupReattempt:    rows.filter((r) => r.status === 'pickup-reattempt' || r.status === 'awaiting-scan').length,
    awaitingPickup:     rows.filter((r) => r.needsAttention).length,
    waitingHours:       24,
  };
}

export function computeInTransitKpis(rows: Shipment[]) {
  return {
    totalInTransit: rows.length,
    slowInMovement: rows.filter((r) => r.needsAttention).length,
    waitingHours:   24,
    reattempted:    0,
    outForDelivery: rows.filter((r) => r.status === 'out-for-delivery').length,
  };
}

export function computeDeliveredKpis(rows: Shipment[]) {
  return {
    totalValue:        rows.reduce((s, r) => s + r.payment.amount, 0),
    totalCount:        rows.length,
    firstAttempt:      rows.filter((r) => r.status === 'delivered').length,
    secondPlusAttempt: 0,
    lateDelivery:      rows.filter((r) => r.status === 'failed').length,
  };
}

export function computeRtoKpis(rows: Shipment[]) {
  return {
    rtoInTransit:  rows.filter((r) => r.status === 'rto-in-transit').length,
    rtoDelivered:  rows.filter((r) => r.status === 'rto-delivered' || r.status === 'rto-completed').length,
    rtoInitiated:  rows.filter((r) => r.status === 'rto-initiated').length,
    rtoCompleted:  rows.filter((r) => r.status === 'rto-completed').length,
  };
}

export function computeAllShipmentKpis(rows: Shipment[]) {
  const inTransitStatuses: ShipmentStatus[] = ['picked-up', 'in-transit', 'out-for-delivery'];
  return {
    totalShipments:     rows.length,
    totalValue:         rows.reduce((s, r) => s + r.payment.amount, 0),
    inTransit:          rows.filter((r) => inTransitStatuses.includes(r.status)).length,
    delivered:          rows.filter((r) => r.status === 'delivered').length,
    rto:                rows.filter((r) => r.status.startsWith('rto-')).length,
  };
}

/** Public helper used by the formatter in `OrdersPage`. */
export const fmtRupees = formatRupees;
