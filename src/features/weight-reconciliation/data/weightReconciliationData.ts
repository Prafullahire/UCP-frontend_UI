/**
 * Static Weight Reconciliation mock data.
 *
 * Mirrors the dataset baked into
 * `ui-source/screens/weight-reconciliation (1).html` row-for-row, with
 * additional rows fabricated to populate the Accepted / Open / Closed
 * buckets so the KPI counters and tab filters render meaningfully.
 *
 * When a real API replaces this file only the loader needs to change —
 * components import from named exports here.
 */

import type {
  WrFilterOption,
  WrKpiCounts,
  WrRecord,
  WrSlabId,
  WrUiStatus,
} from '../types';

/* ──────────────────────────── Filter options ──────────────────────────── */

export const WR_DATE_RANGE_OPTIONS: WrFilterOption[] = [
  { id: 'today',  label: 'Today' },
  { id: 'last7',  label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'last90', label: 'Last 90 days' },
  { id: 'custom', label: 'Custom Range' },
];

export const WR_APPLIED_SLABS: WrFilterOption[] = [
  { id: '500_1000',   label: '500g – 1000g'  },
  { id: '1001_2000',  label: '1001g – 2000g' },
  { id: '2001_5000',  label: '2001g – 5000g' },
  { id: '5000_plus',  label: '5000g+'        },
];

export const WR_CHARGED_OPTIONS: WrFilterOption[] = [
  { id: 'yes', label: 'Charged: Yes' },
  { id: 'no',  label: 'Charged: No'  },
];

/**
 * Status filter shown on the All tab — surfaces every lifecycle status
 * in one chip so sellers can slice the unified list without switching
 * tabs.
 */
export const WR_STATUS_OPTIONS: WrFilterOption[] = [
  { id: 'auto-accepted',   label: 'Auto Accepted'   },
  { id: 'seller-accepted', label: 'Accepted by you' },
  { id: 'under-review',    label: 'Under Review'    },
  { id: 'action-pending',  label: 'Action Pending'  },
  { id: 'closed',          label: 'Closed'          },
];

export const WR_DISPUTE_REASONS: WrFilterOption[] = [
  { id: 'dead',     label: 'Dead weight mismatch'         },
  { id: 'vol',      label: 'Volumetric weight incorrect'  },
  { id: 'dims',     label: 'Wrong dimensions recorded'    },
  { id: 'product',  label: 'Product weight misclassified' },
  { id: 'other',    label: 'Other'                        },
];

/* ──────────────────────────── Mock records ──────────────────────────── */

/* Helper — keeps each row body terse while still giving the table enough
   data to render the discrepancy / slab / charge cells correctly. */
const slabFor = (appliedGrams: number): WrSlabId => {
  if (appliedGrams <= 1000) return '500_1000';
  if (appliedGrams <= 2000) return '1001_2000';
  if (appliedGrams <= 5000) return '2001_5000';
  return '5000_plus';
};

export const WR_RECORDS: WrRecord[] = [
  /* ── Action Required (5 — straight from the prototype) ── */
  {
    id: 'wr-1',
    appliedDate: '2026-04-03',
    awb: '14344961204563',
    orderId: '#416648',
    entered: { dead: '500g', dims: '10×10×2', slab: '500g', volumetric: '40g' },
    appliedWeight: '1000g',
    charges: { forward: '₹42', rto: '₹42', chargedToWallet: false },
    product: 'Inspired By Occì FL0r@ Per...',
    daysLeft: 1,
    state: null,
    slabBucket: slabFor(1000),
  },
  {
    id: 'wr-2',
    appliedDate: '2026-04-02',
    awb: '14344961053998',
    orderId: '#411274',
    entered: { dead: '500g', dims: '10×10×02', slab: '500g', volumetric: '40g' },
    appliedWeight: '1000g',
    charges: { forward: '₹42', chargedToWallet: false },
    product: 'Inspired By Occì FL0r@ Per...',
    daysLeft: 0,
    state: null,
    slabBucket: slabFor(1000),
  },
  {
    id: 'wr-3',
    appliedDate: '2026-04-02',
    awb: '14344961054147',
    orderId: '#410956',
    entered: { dead: '500g', dims: '10×10×2', slab: '500g', volumetric: '40g' },
    appliedWeight: '3000g',
    charges: { forward: '₹210', chargedToWallet: false },
    product: 'Inspired By Versace Bright ...',
    daysLeft: 0,
    state: null,
    slabBucket: slabFor(3000),
  },
  {
    id: 'wr-4',
    appliedDate: '2026-04-02',
    awb: '14344961127731',
    orderId: '#413769',
    entered: { dead: '500g', dims: '10×10×2', slab: '500g', volumetric: '40g' },
    appliedWeight: '2500g',
    charges: { forward: '₹168', chargedToWallet: false },
    product: 'Inspired By D 0ff Cool W@te...',
    daysLeft: 0,
    state: null,
    slabBucket: slabFor(2500),
  },
  {
    id: 'wr-5',
    appliedDate: '2026-04-02',
    awb: '14344961142679',
    orderId: '#414144',
    entered: { dead: '500g', dims: '10×10×2', slab: '500g', volumetric: '40g' },
    appliedWeight: '1000g',
    charges: { forward: '₹42', rto: '₹42', chargedToWallet: false },
    product: 'Eden Apple Perfume 100ml - ...',
    daysLeft: 0,
    state: null,
    slabBucket: slabFor(1000),
  },

  /* ── Accepted (already settled) ── */
  {
    id: 'wr-6',
    appliedDate: '2026-04-01',
    awb: '14344960998112',
    orderId: '#409812',
    entered: { dead: '750g', dims: '12×10×4', slab: '1000g', volumetric: '96g' },
    appliedWeight: '1000g',
    charges: { forward: '₹52', chargedToWallet: true },
    product: 'Wireless Earbuds — Onyx',
    daysLeft: 4,
    state: 'accepted',
    acceptedBy: 'seller',
    slabBucket: slabFor(1000),
  },
  {
    id: 'wr-7',
    appliedDate: '2026-03-31',
    awb: '14344960887421',
    orderId: '#408271',
    entered: { dead: '500g', dims: '10×8×3', slab: '500g', volumetric: '48g' },
    appliedWeight: '500g',
    charges: { forward: '₹38', chargedToWallet: true },
    product: 'Bath & Body Works Mist — 250ml',
    daysLeft: 5,
    state: 'accepted',
    acceptedBy: 'auto',
    slabBucket: slabFor(500),
  },

  /* ── Open Disputes (under XB review) ── */
  {
    id: 'wr-8',
    appliedDate: '2026-03-30',
    awb: '14344960778945',
    orderId: '#407459',
    entered: { dead: '500g', dims: '14×10×2', slab: '500g', volumetric: '56g' },
    appliedWeight: '2000g',
    charges: { forward: '₹128', chargedToWallet: false },
    product: 'Ceramic Mug Pack of 4',
    daysLeft: 6,
    state: 'open',
    slabBucket: slabFor(2000),
  },
  {
    id: 'wr-9',
    appliedDate: '2026-03-29',
    awb: '14344960663218',
    orderId: '#406118',
    entered: { dead: '300g', dims: '8×8×2', slab: '500g', volumetric: '26g' },
    appliedWeight: '1500g',
    charges: { forward: '₹98', chargedToWallet: false },
    product: 'Stainless Steel Bottle 500ml',
    daysLeft: 5,
    state: 'open',
    slabBucket: slabFor(1500),
  },

  /* ── Closed (XB decision delivered, settled or rejected) ── */
  {
    id: 'wr-10',
    appliedDate: '2026-03-22',
    awb: '14344960441205',
    orderId: '#404219',
    entered: { dead: '500g', dims: '10×10×2', slab: '500g', volumetric: '40g' },
    appliedWeight: '1000g',
    charges: { forward: '₹42', chargedToWallet: true },
    product: 'Notebook Diary A5 Hardcover',
    daysLeft: 0,
    state: 'closed',
    slabBucket: slabFor(1000),
  },
];

/* ──────────────────────────── KPI counters ──────────────────────────── */

/**
 * Counts pinned to the prototype copy in the HTML brief — the table
 * dataset is intentionally lighter than these counters (we don't need
 * 184 mock rows to demo the screen).
 */
export const WR_KPI_COUNTS: WrKpiCounts = {
  all: 184,
  action: 28,
  open: 12,
  accepted: 144,
  closed: 0,
};

/**
 * Map a record onto its granular `WrUiStatus`. This is the value the
 * Status filter chip on the All tab compares against.
 */
export function recordUiStatus(r: WrRecord): WrUiStatus {
  if (r.state === null)    return 'action-pending';
  if (r.state === 'open')   return 'under-review';
  if (r.state === 'closed') return 'closed';
  return r.acceptedBy === 'auto' ? 'auto-accepted' : 'seller-accepted';
}

/**
 * Compute live counts derived from the in-memory `rowStates` map (filled
 * in by the page when the seller accepts / disputes a row). The base
 * counters come from `WR_KPI_COUNTS`; the helper adjusts them so the
 * action / accepted / open / closed tiles always reflect the user's
 * recent activity in this session.
 */
export function liveCounts(records: WrRecord[]): WrKpiCounts {
  const counts: WrKpiCounts = {
    all: WR_KPI_COUNTS.all,
    action: 0,
    open: 0,
    accepted: 0,
    closed: 0,
  };
  for (const r of records) {
    if (r.state === null)        counts.action   += 1;
    else if (r.state === 'open') counts.open     += 1;
    else if (r.state === 'accepted') counts.accepted += 1;
    else if (r.state === 'closed')   counts.closed   += 1;
  }
  /* Pad accepted / open with the prototype overflow so the totals look
     plausible against the 184 / 28 / 12 / 144 figures from the brief. */
  counts.accepted += Math.max(0, WR_KPI_COUNTS.accepted - 2);
  counts.open     += Math.max(0, WR_KPI_COUNTS.open - 2);
  counts.action   += Math.max(0, WR_KPI_COUNTS.action - 5);
  return counts;
}
