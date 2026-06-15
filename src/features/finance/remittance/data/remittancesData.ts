/**
 * Mock data + KPI helpers + filter option sets for the
 * Finance → Remittance screen.
 *
 * Shape mirrors the rest of the platform's "data" modules
 * (see `wallet/data/walletTransactionsData.ts` for the pattern):
 *   • a static dataset that drives the grid + KPI numbers
 *   • a `computeRemittanceKpis(...)` helper for the static KPI strip
 *   • option lists shared between the inline filter chip and any
 *     downstream surface that needs to enumerate the values
 *
 * Business reference is the supplied Remittance design screenshot.
 * The KPIs (Remitted Till Date, Last Remittance, Next Remittance,
 * Total Remittance Due) are derived directly from this dataset so
 * the screen always shows numbers that are consistent with the rows
 * the grid is rendering.
 */

import type { FilterOption } from '../../../orders/types';
import { formatRupees } from '../../wallet/data/walletTransactionsData';

/* ──────────────────────────── Domain types ──────────────────────────── */

/**
 * Lifecycle status for a remittance record. Drives:
 *   • the inline "Remittance Status" filter chip
 *   • the `.ord-status` pill rendered in the STATUS column
 *   • the "Total Remittance Due" + "Next Remittance" KPI buckets
 *     (any non-`paid` row is treated as outstanding remittance)
 */
export type RemittanceStatus =
  | 'paid'
  | 'processing'
  | 'pending'
  | 'on-hold'
  | 'failed';

export interface RemittanceRecord {
  /** Remittance id (e.g. "254853") — rendered mono in the grid */
  id: string;
  /** COD amount collected from buyers for this remittance window (₹) */
  codAmount: number;
  status: RemittanceStatus;
  /**
   * Display payment date (e.g. "January 20, 2026"). For non-paid rows
   * this is the *expected* payment date — the grid clarifies the
   * distinction via the status pill.
   */
  paymentDate: string;
  /** Total freight + COD-handling charges deducted before payout (₹) */
  freightDeductions: number;
  /** Final amount transferred to the seller after deductions (₹) */
  remittanceAmount: number;
  /**
   * Bank / UTR payment reference. Format mirrors the design
   * ("20-01-2026"). `null` until the payout is settled.
   */
  paymentRef: string | null;
}

/* ──────────────────────────── Filter option sets ──────────────────────────── */

/**
 * Status chip options. The chip's `null` value (placeholder) acts as
 * the implicit "All Statuses" sentinel — matches the wallet recharge
 * chip convention so users never see two separate "Show All" entries.
 */
export const REMITTANCE_STATUSES: FilterOption[] = [
  { id: 'paid',       label: 'Paid' },
  { id: 'processing', label: 'Processing' },
  { id: 'pending',    label: 'Pending' },
  { id: 'on-hold',    label: 'On Hold' },
  { id: 'failed',     label: 'Failed' },
];

/** Date range chip options. Mirrors Wallet's vocabulary. */
export const REMITTANCE_DATE_RANGE_OPTIONS: FilterOption[] = [
  { id: 'today',       label: 'Today' },
  { id: 'yesterday',   label: 'Yesterday' },
  { id: 'last7',       label: 'Last 7 Days' },
  { id: 'last30',      label: 'Last 30 Days' },
  { id: 'last90',      label: 'Last 90 Days' },
  { id: 'this-month',  label: 'This Month' },
  { id: 'last-month',  label: 'Last Month' },
  { id: 'this-year',   label: 'This Year' },
  { id: 'custom',      label: 'Custom Range' },
];

/* ──────────────────────────── Status pill meta ──────────────────────────── */

/**
 * Maps each `RemittanceStatus` to a display label + an `ord-status`
 * variant token. Centralising the mapping keeps the chip filter,
 * grid pill, and any future KPI surface in lock-step on terminology.
 */
export const REMITTANCE_STATUS_META: Record<
  RemittanceStatus,
  { label: string; variant: 'green' | 'blue' | 'amber' | 'red' | 'grey' }
> = {
  paid:       { label: 'Paid',       variant: 'green' },
  processing: { label: 'Processing', variant: 'blue'  },
  pending:    { label: 'Pending',    variant: 'amber' },
  'on-hold':  { label: 'On Hold',    variant: 'grey'  },
  failed:     { label: 'Failed',     variant: 'red'   },
};

/* ──────────────────────────── Mock dataset ────────────────────────────
 *
 * 32 settled (paid) remittances spanning Aug 2025 → Jan 2026 plus one
 * outstanding row queued for the next payout cycle. The 10 most-recent
 * paid rows match the supplied design 1-for-1 so the rendered page
 * lands feeling like a faithful port of the reference.
 *
 * Ordering: reverse-chronological. Index 0 is the most recent paid
 * row (drives the "Last Remittance" KPI).
 */
export const REMITTANCES: RemittanceRecord[] = [
  /* ── Outstanding / next payout (drives Next + Total Due KPIs) ── */
  {
    id: '255417',
    codAmount: 169909,
    status: 'processing',
    paymentDate: 'January 23, 2026',
    freightDeductions: 0,
    remittanceAmount: 169909,
    paymentRef: null,
  },

  /* ── 10 most-recent paid remittances (match the design) ── */
  {
    id: '254853', codAmount: 124373, status: 'paid',
    paymentDate: 'January 20, 2026', freightDeductions: 0,
    remittanceAmount: 124373, paymentRef: '20-01-2026',
  },
  {
    id: '254310', codAmount: 120728, status: 'paid',
    paymentDate: 'January 16, 2026', freightDeductions: 0,
    remittanceAmount: 120728, paymentRef: '16-01-2026',
  },
  {
    id: '253717', codAmount: 138898, status: 'paid',
    paymentDate: 'January 13, 2026', freightDeductions: 0,
    remittanceAmount: 138898, paymentRef: '13-01-2026',
  },
  {
    id: '253155', codAmount: 130945, status: 'paid',
    paymentDate: 'January 9, 2026', freightDeductions: 0,
    remittanceAmount: 130945, paymentRef: '09-01-2026',
  },
  {
    id: '252590', codAmount: 127887, status: 'paid',
    paymentDate: 'January 6, 2026', freightDeductions: 0,
    remittanceAmount: 127887, paymentRef: '06-01-2026',
  },
  {
    id: '252057', codAmount: 102384, status: 'paid',
    paymentDate: 'January 2, 2026', freightDeductions: 0,
    remittanceAmount: 102384, paymentRef: '02-01-2026',
  },
  {
    id: '251474', codAmount: 158457, status: 'paid',
    paymentDate: 'December 30, 2025', freightDeductions: 0,
    remittanceAmount: 158457, paymentRef: '30-12-2025',
  },
  {
    id: '250907', codAmount: 87469, status: 'paid',
    paymentDate: 'December 26, 2025', freightDeductions: 0,
    remittanceAmount: 87469, paymentRef: '26-12-2025',
  },
  {
    id: '250414', codAmount: 109394, status: 'paid',
    paymentDate: 'December 23, 2025', freightDeductions: 0,
    remittanceAmount: 109394, paymentRef: '23-12-2025',
  },
  {
    id: '249858', codAmount: 87695, status: 'paid',
    paymentDate: 'December 19, 2025', freightDeductions: 0,
    remittanceAmount: 87695, paymentRef: '19-12-2025',
  },

  /* ── Historical paid remittances (Dec 2025 → Aug 2025) ──
        Realistic freight-deduction examples so the column has variety
        (the design shows zero deductions because the visible window
        happens to be a clean payout streak). */
  {
    id: '249312', codAmount: 152840, status: 'paid',
    paymentDate: 'December 16, 2025', freightDeductions: 2150,
    remittanceAmount: 150690, paymentRef: '16-12-2025',
  },
  {
    id: '248740', codAmount: 198425, status: 'paid',
    paymentDate: 'December 12, 2025', freightDeductions: 3478,
    remittanceAmount: 194947, paymentRef: '12-12-2025',
  },
  {
    id: '248187', codAmount: 144230, status: 'paid',
    paymentDate: 'December 9, 2025', freightDeductions: 0,
    remittanceAmount: 144230, paymentRef: '09-12-2025',
  },
  {
    id: '247612', codAmount: 176540, status: 'paid',
    paymentDate: 'December 5, 2025', freightDeductions: 1240,
    remittanceAmount: 175300, paymentRef: '05-12-2025',
  },
  {
    id: '247045', codAmount: 119365, status: 'paid',
    paymentDate: 'December 2, 2025', freightDeductions: 0,
    remittanceAmount: 119365, paymentRef: '02-12-2025',
  },
  {
    id: '246480', codAmount: 245718, status: 'paid',
    paymentDate: 'November 28, 2025', freightDeductions: 4870,
    remittanceAmount: 240848, paymentRef: '28-11-2025',
  },
  {
    id: '245920', codAmount: 187290, status: 'paid',
    paymentDate: 'November 25, 2025', freightDeductions: 2310,
    remittanceAmount: 184980, paymentRef: '25-11-2025',
  },
  {
    id: '245370', codAmount: 167845, status: 'paid',
    paymentDate: 'November 21, 2025', freightDeductions: 0,
    remittanceAmount: 167845, paymentRef: '21-11-2025',
  },
  {
    id: '244815', codAmount: 213560, status: 'paid',
    paymentDate: 'November 18, 2025', freightDeductions: 3120,
    remittanceAmount: 210440, paymentRef: '18-11-2025',
  },
  {
    id: '244260', codAmount: 192480, status: 'paid',
    paymentDate: 'November 14, 2025', freightDeductions: 0,
    remittanceAmount: 192480, paymentRef: '14-11-2025',
  },
  {
    id: '243710', codAmount: 256340, status: 'paid',
    paymentDate: 'November 11, 2025', freightDeductions: 5840,
    remittanceAmount: 250500, paymentRef: '11-11-2025',
  },
  {
    id: '243155', codAmount: 178925, status: 'paid',
    paymentDate: 'November 7, 2025', freightDeductions: 0,
    remittanceAmount: 178925, paymentRef: '07-11-2025',
  },
  {
    id: '242600', codAmount: 224170, status: 'paid',
    paymentDate: 'November 4, 2025', freightDeductions: 4250,
    remittanceAmount: 219920, paymentRef: '04-11-2025',
  },
  {
    id: '242045', codAmount: 145680, status: 'paid',
    paymentDate: 'October 31, 2025', freightDeductions: 0,
    remittanceAmount: 145680, paymentRef: '31-10-2025',
  },
  {
    id: '241490', codAmount: 268540, status: 'paid',
    paymentDate: 'October 28, 2025', freightDeductions: 6210,
    remittanceAmount: 262330, paymentRef: '28-10-2025',
  },
  {
    id: '240935', codAmount: 198760, status: 'paid',
    paymentDate: 'October 24, 2025', freightDeductions: 0,
    remittanceAmount: 198760, paymentRef: '24-10-2025',
  },
  {
    id: '240380', codAmount: 234150, status: 'paid',
    paymentDate: 'October 21, 2025', freightDeductions: 3680,
    remittanceAmount: 230470, paymentRef: '21-10-2025',
  },
  {
    id: '239825', codAmount: 156890, status: 'paid',
    paymentDate: 'October 17, 2025', freightDeductions: 0,
    remittanceAmount: 156890, paymentRef: '17-10-2025',
  },
  {
    id: '239270', codAmount: 287430, status: 'paid',
    paymentDate: 'October 14, 2025', freightDeductions: 7240,
    remittanceAmount: 280190, paymentRef: '14-10-2025',
  },
  {
    id: '238715', codAmount: 172650, status: 'paid',
    paymentDate: 'October 10, 2025', freightDeductions: 0,
    remittanceAmount: 172650, paymentRef: '10-10-2025',
  },
  {
    id: '238160', codAmount: 219340, status: 'paid',
    paymentDate: 'October 7, 2025', freightDeductions: 4120,
    remittanceAmount: 215220, paymentRef: '07-10-2025',
  },
  {
    id: '237605', codAmount: 142875, status: 'paid',
    paymentDate: 'October 3, 2025', freightDeductions: 0,
    remittanceAmount: 142875, paymentRef: '03-10-2025',
  },
  {
    id: '237050', codAmount: 256420, status: 'paid',
    paymentDate: 'September 30, 2025', freightDeductions: 5460,
    remittanceAmount: 250960, paymentRef: '30-09-2025',
  },
  {
    id: '236495', codAmount: 184530, status: 'paid',
    paymentDate: 'September 26, 2025', freightDeductions: 0,
    remittanceAmount: 184530, paymentRef: '26-09-2025',
  },
  {
    id: '235940', codAmount: 273860, status: 'paid',
    paymentDate: 'September 23, 2025', freightDeductions: 6890,
    remittanceAmount: 266970, paymentRef: '23-09-2025',
  },
  {
    id: '235385', codAmount: 195740, status: 'paid',
    paymentDate: 'September 19, 2025', freightDeductions: 0,
    remittanceAmount: 195740, paymentRef: '19-09-2025',
  },
  {
    id: '234830', codAmount: 232180, status: 'paid',
    paymentDate: 'September 16, 2025', freightDeductions: 3950,
    remittanceAmount: 228230, paymentRef: '16-09-2025',
  },
  {
    id: '234275', codAmount: 167420, status: 'paid',
    paymentDate: 'September 12, 2025', freightDeductions: 0,
    remittanceAmount: 167420, paymentRef: '12-09-2025',
  },
  {
    id: '233720', codAmount: 248930, status: 'paid',
    paymentDate: 'September 9, 2025', freightDeductions: 5210,
    remittanceAmount: 243720, paymentRef: '09-09-2025',
  },
];

/* ──────────────────────────── KPI helpers ──────────────────────────── */

export interface RemittanceKpis {
  /** Lifetime sum of all settled (paid) remittance amounts (₹) */
  remittedTillDate: number;
  /** Amount of the most-recent settled remittance (₹) */
  lastRemittance: number;
  /** Amount of the next outstanding remittance queued for payout (₹) */
  nextRemittance: number;
  /** Sum of every non-paid remittance amount currently outstanding (₹) */
  totalRemittanceDue: number;
}

/**
 * Compute the four summary KPIs from the supplied dataset.
 *
 * • `remittedTillDate`   – Σ of `remittanceAmount` for every paid row
 * • `lastRemittance`     – `remittanceAmount` of the most-recent paid row
 * • `nextRemittance`     – `remittanceAmount` of the next outstanding row
 *                          (processing → pending → on-hold → failed)
 * • `totalRemittanceDue` – Σ of `remittanceAmount` for every non-paid row
 *
 * Outstanding rows are picked in lifecycle order so the "next" tile
 * surfaces the most actionable record (Processing > Pending > On Hold
 * > Failed) regardless of insertion order in the dataset.
 */
export function computeRemittanceKpis(rows: RemittanceRecord[]): RemittanceKpis {
  let remittedTillDate = 0;
  let totalRemittanceDue = 0;
  let lastRemittance = 0;
  let lastRemittanceDate = '';
  const outstandingByStatus: Partial<Record<RemittanceStatus, RemittanceRecord>> = {};

  for (const row of rows) {
    if (row.status === 'paid') {
      remittedTillDate += row.remittanceAmount;
      const candidateDate = parsePaymentDate(row.paymentDate);
      if (!lastRemittanceDate || candidateDate > lastRemittanceDate) {
        lastRemittanceDate = candidateDate;
        lastRemittance = row.remittanceAmount;
      }
    } else {
      totalRemittanceDue += row.remittanceAmount;
      if (!outstandingByStatus[row.status]) {
        outstandingByStatus[row.status] = row;
      }
    }
  }

  /* Priority order for picking the "next" outstanding remittance. */
  const priority: RemittanceStatus[] = ['processing', 'pending', 'on-hold', 'failed'];
  const next = priority
    .map((s) => outstandingByStatus[s])
    .find((r): r is RemittanceRecord => Boolean(r));

  return {
    remittedTillDate,
    lastRemittance,
    nextRemittance: next?.remittanceAmount ?? 0,
    totalRemittanceDue,
  };
}

/**
 * Best-effort ISO-ish key derived from the display payment date
 * ("January 20, 2026" → "2026-01-20"). Only used internally for
 * sort comparisons inside `computeRemittanceKpis` so we don't need
 * a full date-parser dependency.
 */
function parsePaymentDate(display: string): string {
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  };
  const match = display.match(/^(\w+)\s+(\d+),\s+(\d+)$/);
  if (!match) return display;
  const [, mName, d, y] = match;
  const m = months[mName.toLowerCase()] ?? '00';
  return `${y}-${m}-${d.padStart(2, '0')}`;
}

/**
 * Compact integer rupee formatter (₹1,23,456 — no decimals). Used by
 * the grid + payment-ref cells so amounts read like the supplied
 * reference. Wraps the shared `formatRupees` helper so any future
 * formatting tweak only has to land in one place.
 */
export function formatRupeesCompact(n: number): string {
  return formatRupees(Math.round(n)).replace(/\.\d+$/, '');
}
