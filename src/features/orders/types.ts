/**
 * Type definitions for the Orders module.
 *
 * Mirrors the data shape used across the Pending grid + filter strip + bulk
 * action menu. The actual list of mock orders lives in
 * `data/ordersData.ts` so a future API swap touches only that file.
 */

export type OrderTabId =
  | 'pending'
  | 'ready-to-ship'
  | 'ready-to-pickup'
  | 'in-transit'
  | 'delivered'
  | 'rto'
  | 'all';

export type PaymentMode = 'COD' | 'Prepaid' | 'Pickup';

/** Pending-grid status pill. NEW = fresh order, OLD = older import. */
export type OrderAgeTag = 'NEW' | 'OLD';

export interface OrderAddress {
  /** Pretty city name (e.g. "Bangalore") */
  city: string;
  /** 6-digit Indian postcode (e.g. "560004") */
  pin: string;
}

export interface OrderCustomer {
  name: string;
  /** Masked phone (e.g. "xxxxxxxxxx") */
  phone: string;
  city: string;
  pin: string;
}

export interface OrderProduct {
  name: string;
  sku: string;
  hsn: string;
  qty: number;
}

export interface OrderPackage {
  /** Dead weight (display value with unit, e.g. "1 kg") */
  deadWt: string;
  /** Dimensions string (e.g. "40×20×30 (cm)") */
  dims: string;
  /** Volumetric weight (e.g. "4.30 kg") */
  volWt: string;
}

export interface OrderPayment {
  /** Total order amount in rupees */
  amount: number;
  mode: PaymentMode;
}

export interface Order {
  id: string;
  /** ISO-ish display date, e.g. "11 Apr 2026" */
  date: string;
  /** Display time, e.g. "3:57 PM" */
  time: string;
  /** Sales channel — Shopify, WooCommerce, Amazon, etc. */
  channel: string;
  /** Pickup location label (matches PICKUP_LOCATIONS option ids) */
  pickupLocation: string;
  /** "NEW" or "OLD" pill that drives the Pending grid status badge */
  age: OrderAgeTag;
  /** True when "Sitting >24 hrs" warning chip should render */
  needsAttention: boolean;
  /** True when key shipping details are missing (used by "Incomplete Order Details" KPI) */
  incomplete: boolean;

  customer: OrderCustomer;
  product: OrderProduct;
  package: OrderPackage;
  payment: OrderPayment;
  pickup: OrderAddress;
  delivery: OrderAddress;

  /** Tags previously added to this order */
  tags: string[];
}

/** A simple option type reused by the inline filter chips */
export interface FilterOption {
  id: string;
  label: string;
}

/* ──────────────────────────── Shipment module ──────────────────────────── */

/**
 * Lifecycle status that drives the STATUS pill in the various Shipments
 * tabs. The string ids stay constant — the user-facing label + colour come
 * from `SHIPMENT_STATUS_META` in `data/shipmentsData.ts` so the same
 * status renders identically wherever it surfaces (chip filter, grid pill,
 * KPI tile, etc.).
 */
export type ShipmentStatus =
  /* Ready to Ship */
  | 'ready-to-ship'
  /* Ready to Pickup */
  | 'agent-assigned'
  | 'awaiting-scan'
  | 'pickup-reattempt'
  /* In Transit */
  | 'picked-up'
  | 'in-transit'
  | 'out-for-delivery'
  | 'delayed'
  | 'lost'
  | 'damage'
  /* Delivered */
  | 'delivered'
  | 'failed'
  /* RTO */
  | 'rto-initiated'
  | 'rto-in-transit'
  | 'rto-delivered'
  | 'rto-completed';

/** Visual variant applied to `.ord-status` pills + KPI accent bars. */
export type StatusVariant = 'green' | 'blue' | 'amber' | 'red' | 'grey';

export type TransportMode = 'air' | 'surface';

/**
 * Unified shipment record consumed by every non-Pending tab. Optional
 * fields capture stage-specific data (PDD only matters for In Transit,
 * deliveredDate for Delivered, etc.) so the underlying grid renderer
 * can switch column sets per tab without ever needing per-stage types.
 */
export interface Shipment {
  id: string;
  /** Shipping label / AWB number (mono-rendered under the order id) */
  awb: string;
  /** Order date — shown in the ORDER DETAILS column */
  date: string;
  time: string;
  channel: string;
  /** Pickup location id (matches PICKUP_LOCATIONS options) */
  pickupLocation: string;
  /** "Sitting >24 hrs" KPI warning flag */
  needsAttention?: boolean;

  customer: OrderCustomer;
  pickup: OrderAddress;
  delivery: OrderAddress;
  payment: OrderPayment;

  /** Product line — optional because not every tab surfaces a Product column.
   *  RTO + future tabs render it so the seller can recognise the SKU coming back. */
  product?: OrderProduct;

  /** Lifecycle status — see `ShipmentStatus` */
  status: ShipmentStatus;

  /* ── Shipping / courier metadata (Ready to Ship + Pickup) ── */
  shippingCourier?: string;
  shippingWeight?: string;
  shippingZone?: string;
  transportMode?: TransportMode;

  /* ── Manifest stamps (Ready to Ship / Pickup) ── */
  manifestedDate?: string;
  manifestedTime?: string;

  /* ── In-Transit specifics ── */
  /** Promised delivery date (display string, e.g. "14 Apr 2026") */
  pddDate?: string;
  pddTime?: string;
  /** True ⇒ render "PDD Breached" under the date */
  pddBreached?: boolean;
  /** Day counter rendered as "Day {n}" */
  daysInTransit?: number;
  /** True ⇒ green ON TIME pill, false ⇒ red DELAYED pill */
  onTime?: boolean;

  /* ── Delivered specifics ── */
  deliveryDate?: string;
  deliveryTime?: string;
  /** Drives the PURCHASE ORDER cell — true ⇒ "Download PO" link */
  hasPurchaseOrder?: boolean;

  /* ── RTO specifics ── */
  rtoInitiatedDate?: string;
  rtoReason?: string;

  /** Order-level tags (carried through from the order) */
  tags: string[];
}
