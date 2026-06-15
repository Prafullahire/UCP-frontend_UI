/**
 * Static Orders mock data, modelled after the screenshot supplied with the
 * brief. Six pending orders mirror the grid layout exactly.
 *
 * All filter dropdowns (date range / pickup / payment / channel / status /
 * tag) derive their options from the constants below — so adding a new tag
 * or pickup location automatically surfaces it in the UI.
 */

import type { FilterOption, Order, OrderTabId } from '../types';

/* ──────────────────────────── Filter option sets ──────────────────────────── */

export const DATE_RANGE_OPTIONS: FilterOption[] = [
  { id: 'today',       label: 'Today' },
  { id: 'yesterday',   label: 'Yesterday' },
  { id: 'last7',       label: 'Last 7 Days' },
  { id: 'last30',      label: 'Last 30 Days' },
  { id: '17-03_16-04', label: '17/03 – 16/04/2025' },
  { id: 'custom',      label: 'Custom Range' },
];

/**
 * Period-relative range used by the In-Transit "EDD" (Estimated Delivery
 * Date) chip. Distinct from `DATE_RANGE_OPTIONS` because EDD framing
 * needs week/month buckets instead of the raw N-day windows.
 */
export const EDD_RANGE_OPTIONS: FilterOption[] = [
  { id: 'yesterday',  label: 'Yesterday' },
  { id: 'this-week',  label: 'This Week' },
  { id: 'last-week',  label: 'Last Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'last90',     label: 'Last 90 Days' },
];

export const PICKUP_LOCATIONS: FilterOption[] = [
  { id: 'mumbai-wh-a',   label: 'Mumbai Warehouse A' },
  { id: 'pune-wh-b',     label: 'Pune Warehouse B' },
  { id: 'delhi-wh-c',    label: 'Delhi Warehouse C' },
  { id: 'bangalore-wh-d',label: 'Bangalore Warehouse D' },
  { id: 'hyderabad-wh-e',label: 'Hyderabad Warehouse E' },
];

export const PAYMENT_MODES: FilterOption[] = [
  { id: 'cod',     label: 'COD' },
  { id: 'prepaid', label: 'Prepaid' },
  { id: 'pickup',  label: 'Pickup' },
];

export const CHANNELS: FilterOption[] = [
  { id: 'shopify',     label: 'Shopify' },
  { id: 'woocommerce', label: 'WooCommerce' },
  { id: 'amazon',      label: 'Amazon' },
  { id: 'flipkart',    label: 'Flipkart' },
  { id: 'magento',     label: 'Magento' },
  { id: 'custom-api',  label: 'Custom API' },
];

export const AGE_STATUSES: FilterOption[] = [
  { id: 'NEW', label: 'New' },
  { id: 'OLD', label: 'Old' },
];

/** Pre-seed list of order tags. Users can add new ones via the Add Tag modal. */
export const DEFAULT_TAGS: string[] = [
  'High Priority',
  'Gift Order',
  'Repeat Customer',
  'Fragile',
  'Heavy',
  'Express',
];

/* ──────────────────────────── Bulk actions per tab ──────────────────────────── */

export interface BulkAction {
  id: string;
  label: string;
}

/**
 * Bulk action menu items per tab. Pending exposes the full set defined in the
 * brief; other tabs reuse the most relevant subset so the dropdown never
 * appears empty when a user lands on it.
 */
export const BULK_ACTIONS: Record<OrderTabId, BulkAction[]> = {
  pending: [
    { id: 'ship',           label: 'Ship Orders' },
    { id: 'update-package', label: 'Update Package Details' },
    { id: 'update-pickup',  label: 'Update Pickup Locations' },
    { id: 'update-payment', label: 'Update Payment Mode' },
    { id: 'print-invoice',  label: 'Print Invoice' },
    { id: 'cancel',         label: 'Cancel Order' },
  ],
  'ready-to-ship': [
    { id: 'book-pickup',   label: 'Book Pickup' },
    { id: 'print-invoice', label: 'Print Invoice' },
    { id: 'print-label',   label: 'Print Label' },
    { id: 'cancel',        label: 'Cancel Order' },
  ],
  'ready-to-pickup': [
    { id: 'mark-handed',   label: 'Mark Handed Over' },
    { id: 'print-manifest',label: 'Print Manifest' },
    { id: 'reschedule',    label: 'Reschedule Pickup' },
  ],
  'in-transit': [
    { id: 'track',         label: 'Track Shipments' },
    { id: 'print-label',   label: 'Print Label' },
  ],
  delivered: [
    { id: 'download-pod',  label: 'Download POD' },
    { id: 'request-rto',   label: 'Request RTO' },
  ],
  rto: [
    { id: 'accept-rto',    label: 'Accept RTO' },
    { id: 'dispute-rto',   label: 'Dispute RTO' },
  ],
  all: [
    { id: 'print-invoice', label: 'Print Invoice' },
    { id: 'download-csv',  label: 'Download CSV' },
  ],
};

/* ──────────────────────────── Mock pending orders ──────────────────────────── */

/**
 * Six pending orders that mirror the screenshot row-for-row. IDs share a
 * common prefix so the bulk-selection demo reads naturally.
 */
export const PENDING_ORDERS: Order[] = [
  {
    id: '1234567890',
    date: '11 Apr 2026',
    time: '3:57 PM',
    channel: 'Shopify',
    pickupLocation: 'bangalore-wh-d',
    age: 'NEW',
    needsAttention: true,
    incomplete: false,
    customer: { name: 'Divendra K.', phone: 'xxxxxxxxxx', city: 'Pune', pin: '411006' },
    product: { name: 'Asus Laptop', sku: '5414272434223', hsn: '22029990', qty: 12 },
    package: { deadWt: '1 kg', dims: '40×20×30 (cm)', volWt: '4.30 kg' },
    payment: { amount: 1450, mode: 'COD' },
    pickup:   { city: 'Bangalore', pin: '560004' },
    delivery: { city: 'Pune',      pin: '411038' },
    tags: ['High Priority'],
  },
  {
    id: '1234567891',
    date: '11 Apr 2026',
    time: '3:57 PM',
    channel: 'Shopify',
    pickupLocation: 'bangalore-wh-d',
    age: 'NEW',
    needsAttention: false,
    incomplete: false,
    customer: { name: 'Divendra K.', phone: 'xxxxxxxxxx', city: 'Pune', pin: '411006' },
    product: { name: 'Asus Laptop', sku: '5414272434223', hsn: '22029990', qty: 12 },
    package: { deadWt: '1 kg', dims: '40×20×30 (cm)', volWt: '4.30 kg' },
    payment: { amount: 1450, mode: 'Prepaid' },
    pickup:   { city: 'Bangalore', pin: '560004' },
    delivery: { city: 'Pune',      pin: '411038' },
    tags: [],
  },
  {
    id: '1234567892',
    date: '11 Apr 2026',
    time: '3:57 PM',
    channel: 'Shopify',
    pickupLocation: 'mumbai-wh-a',
    age: 'OLD',
    needsAttention: false,
    incomplete: false,
    customer: { name: 'Divendra K.', phone: 'xxxxxxxxxx', city: 'Pune', pin: '411006' },
    product: { name: 'Asus Laptop', sku: '5414272434223', hsn: '22029990', qty: 12 },
    package: { deadWt: '1 kg', dims: '40×20×30 (cm)', volWt: '4.30 kg' },
    payment: { amount: 1450, mode: 'COD' },
    pickup:   { city: 'Bangalore', pin: '560004' },
    delivery: { city: 'Pune',      pin: '411038' },
    tags: ['Repeat Customer'],
  },
  {
    id: '1234567893',
    date: '11 Apr 2026',
    time: '3:57 PM',
    channel: 'Shopify',
    pickupLocation: 'pune-wh-b',
    age: 'NEW',
    needsAttention: false,
    incomplete: true,
    customer: { name: 'Divendra K.', phone: 'xxxxxxxxxx', city: 'Pune', pin: '411006' },
    product: { name: 'Asus Laptop', sku: '5414272434223', hsn: '22029990', qty: 12 },
    package: { deadWt: '1 kg', dims: '40×20×30 (cm)', volWt: '4.30 kg' },
    payment: { amount: 1450, mode: 'COD' },
    pickup:   { city: 'Bangalore', pin: '560004' },
    delivery: { city: 'Pune',      pin: '411038' },
    tags: [],
  },
  {
    id: '1234567894',
    date: '11 Apr 2026',
    time: '3:57 PM',
    channel: 'Shopify',
    pickupLocation: 'delhi-wh-c',
    age: 'OLD',
    needsAttention: false,
    incomplete: false,
    customer: { name: 'Divendra K.', phone: 'xxxxxxxxxx', city: 'Pune', pin: '411006' },
    product: { name: 'Asus Laptop', sku: '5414272434223', hsn: '22029990', qty: 12 },
    package: { deadWt: '1 kg', dims: '40×20×30 (cm)', volWt: '4.30 kg' },
    payment: { amount: 1450, mode: 'COD' },
    pickup:   { city: 'Bangalore', pin: '560004' },
    delivery: { city: 'Pune',      pin: '411038' },
    tags: ['Gift Order'],
  },
  {
    id: '1234567895',
    date: '10 Apr 2026',
    time: '11:42 AM',
    channel: 'WooCommerce',
    pickupLocation: 'hyderabad-wh-e',
    age: 'OLD',
    needsAttention: true,
    incomplete: true,
    customer: { name: 'Anita S.', phone: 'xxxxxxxxxx', city: 'Hyderabad', pin: '500032' },
    product: { name: 'Bluetooth Headphones', sku: '5414272434999', hsn: '85183000', qty: 2 },
    package: { deadWt: '0.5 kg', dims: '20×15×10 (cm)', volWt: '0.60 kg' },
    payment: { amount: 2299, mode: 'Prepaid' },
    pickup:   { city: 'Hyderabad', pin: '500032' },
    delivery: { city: 'Chennai',   pin: '600041' },
    tags: ['Fragile', 'Express'],
  },
];

/* ──────────────────────────── KPI helpers ──────────────────────────── */

export interface PendingKpis {
  totalValue: number;
  orderCount: number;
  waitingToShip: number;
  needAttention: number;
  attentionSittingHours: number;
  incomplete: number;
}

export function computePendingKpis(orders: Order[]): PendingKpis {
  return {
    totalValue:           orders.reduce((sum, o) => sum + o.payment.amount, 0),
    orderCount:           orders.length,
    waitingToShip:        orders.length,
    needAttention:        orders.filter((o) => o.needsAttention).length,
    attentionSittingHours: 24,
    incomplete:           orders.filter((o) => o.incomplete).length,
  };
}
