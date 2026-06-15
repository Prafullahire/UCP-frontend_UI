/**
 * Mock data + KPI helpers + filter option sets for the
 * Finance → Wallet → Wallet Transactions screen.
 *
 * Shape mirrors the rest of the platform's "data" modules
 * (see `orders/data/pickupRequestData.ts` for the pattern):
 *   • a static dataset that drives the grid + KPI numbers
 *   • a `computeWalletKpis(...)` helper for the clickable KPI strip
 *   • option lists shared between the inline filter chip and any
 *     downstream surface that needs to enumerate the values
 *
 * Values intentionally mirror the supplied reference HTML
 * (`ui-source/screens/wallet_transactions_v1.html`) so the page
 * lands feeling like a faithful port of the design.
 */

import type { FilterOption } from '../../../orders/types';

/* ──────────────────────────── Domain types ──────────────────────────── */

/**
 * Recharge / transaction sub-category. Drives the "Recharge Type" filter
 * and the per-row category routing.
 */
export type WalletRechargeType =
  | 'cod-adjustment'
  | 'recharge-razorpay'
  | 'recharge-payu'
  | 'recharge-anyf'
  | 'shipment'
  | 'shipment-refund'
  | 'early-cod'
  | 'whatsapp';

export interface WalletTransaction {
  /** Transaction id — mono-rendered, e.g. "TXN5629447216C01" */
  id: string;
  /** Display date string (e.g. "06 May, 2026") */
  date: string;
  /** Display time string (e.g. "03:12 PM") */
  time: string;
  /** AWB number — mono-rendered link in the grid. `null` for non-shipment
   *  transactions (recharges, COD adjustments, etc.) */
  awb: string | null;
  /** Human-readable description (e.g. "COD charges reversed") */
  description: string;
  /** Recharge / transaction sub-category — drives the filter pill */
  rechargeType: WalletRechargeType;
  /** Signed amount in rupees. Positive → credit. Negative → debit. */
  amount: number;
  /** Running available balance after this transaction (rupees) */
  availableBalance: number;
}

/* ──────────────────────────── Filter option sets ──────────────────────────── */

/**
 * Recharge Type chip options. The `''` (empty id) "Show All" sentinel
 * is omitted here — the filter chip's `null` value renders the same
 * "Show All" affordance via its placeholder.
 */
export const WALLET_RECHARGE_TYPES: FilterOption[] = [
  { id: 'cod-adjustment',    label: 'COD Adjustments' },
  { id: 'recharge-razorpay', label: 'Recharge Razorpay' },
  { id: 'recharge-payu',     label: 'Recharge PayU' },
  { id: 'recharge-anyf',     label: 'Recharge AnyF' },
  { id: 'shipment',          label: 'Shipments' },
  { id: 'shipment-refund',   label: 'Shipment Refund' },
  { id: 'early-cod',         label: 'Early COD' },
  { id: 'whatsapp',          label: 'WhatsApp' },
];

/** Date range chip options. Mirrors the Orders module's vocabulary. */
export const WALLET_DATE_RANGE_OPTIONS: FilterOption[] = [
  { id: 'today',       label: 'Today' },
  { id: 'yesterday',   label: 'Yesterday' },
  { id: 'last7',       label: 'Last 7 Days' },
  { id: 'last30',      label: 'Last 30 Days' },
  { id: 'this-month',  label: 'This Month' },
  { id: 'last-month',  label: 'Last Month' },
  { id: 'custom',      label: 'Custom Range' },
];

/* ──────────────────────────── Mock dataset ────────────────────────────
 *
 * 24 rows mirror the reference design's "1 – 8 of 24" pagination footer
 * and exercise every recharge sub-category at least once. Balance is
 * pre-computed so the column shows a realistic running total.
 */
export const WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'TXN5629447216-C01',
    date: '06 May, 2026', time: '03:12 PM',
    awb: '1504872392492',
    description: 'COD charges reversed',
    rechargeType: 'cod-adjustment',
    amount: 48.35, availableBalance: 551.98,
  },
  {
    id: 'TXN5629447216-C02',
    date: '06 May, 2026', time: '03:12 PM',
    awb: '1504872392492',
    description: 'Forward charges reversed',
    rechargeType: 'shipment-refund',
    amount: 205.46, availableBalance: 503.63,
  },
  {
    id: 'TXN5629447216-C03',
    date: '06 May, 2026', time: '03:11 PM',
    awb: '1504872392492',
    description: 'WhatsApp communication charges',
    rechargeType: 'whatsapp',
    amount: -1.17, availableBalance: 298.17,
  },
  {
    id: 'TXN5629447216-C04',
    date: '06 May, 2026', time: '03:08 PM',
    awb: '1504872392492',
    description: 'COD charges applied',
    rechargeType: 'cod-adjustment',
    amount: -48.35, availableBalance: 299.34,
  },
  {
    id: 'TXN5629447216-C05',
    date: '06 May, 2026', time: '03:08 PM',
    awb: '1504872392492',
    description: 'Forward charges applied',
    rechargeType: 'shipment',
    amount: -205.46, availableBalance: 347.69,
  },
  {
    id: 'TXN5629447215-B01',
    date: '05 May, 2026', time: '11:42 AM',
    awb: '1504872392481',
    description: 'Forward charges applied',
    rechargeType: 'shipment',
    amount: -186.20, availableBalance: 553.15,
  },
  {
    id: 'TXN5629447215-B02',
    date: '05 May, 2026', time: '11:40 AM',
    awb: '1504872392481',
    description: 'COD charges applied',
    rechargeType: 'cod-adjustment',
    amount: -42.10, availableBalance: 739.35,
  },
  {
    id: 'TXN5629447214-A01',
    date: '04 May, 2026', time: '09:15 AM',
    awb: '1504872392470',
    description: 'WhatsApp communication charges',
    rechargeType: 'whatsapp',
    amount: -1.17, availableBalance: 781.45,
  },
  {
    id: 'TXN5629447214-A02',
    date: '04 May, 2026', time: '09:14 AM',
    awb: '1504872392470',
    description: 'Forward charges applied',
    rechargeType: 'shipment',
    amount: -156.42, availableBalance: 782.62,
  },
  {
    id: 'TXNRZ-R0L8Pq001',
    date: '04 May, 2026', time: '08:30 AM',
    awb: null,
    description: 'Wallet recharge via Razorpay (pay_S215DTu3iZoZrz)',
    rechargeType: 'recharge-razorpay',
    amount: 500.00, availableBalance: 939.04,
  },
  {
    id: 'TXN5629447213-Z01',
    date: '03 May, 2026', time: '07:55 PM',
    awb: '1504872392463',
    description: 'Forward charges applied',
    rechargeType: 'shipment',
    amount: -172.30, availableBalance: 439.04,
  },
  {
    id: 'TXN5629447213-Z02',
    date: '03 May, 2026', time: '07:52 PM',
    awb: '1504872392463',
    description: 'Early COD credit released',
    rechargeType: 'early-cod',
    amount: 132.80, availableBalance: 611.34,
  },
  {
    id: 'TXN5629447212-Y01',
    date: '02 May, 2026', time: '05:24 PM',
    awb: '1504872392450',
    description: 'Shipment refund processed',
    rechargeType: 'shipment-refund',
    amount: 198.50, availableBalance: 478.54,
  },
  {
    id: 'TXNPU-K3F7Mq001',
    date: '02 May, 2026', time: '02:18 PM',
    awb: null,
    description: 'Wallet recharge via PayU (PAY_K3F7Mq45LkP)',
    rechargeType: 'recharge-payu',
    amount: 250.00, availableBalance: 280.04,
  },
  {
    id: 'TXN5629447211-X01',
    date: '01 May, 2026', time: '11:18 AM',
    awb: '1504872392441',
    description: 'WhatsApp communication charges',
    rechargeType: 'whatsapp',
    amount: -2.34, availableBalance: 30.04,
  },
  {
    id: 'TXN5629447211-X02',
    date: '01 May, 2026', time: '11:12 AM',
    awb: '1504872392441',
    description: 'Forward charges applied',
    rechargeType: 'shipment',
    amount: -118.96, availableBalance: 32.38,
  },
  {
    id: 'TXNAF-J9R2Lt001',
    date: '30 Apr, 2026', time: '09:42 AM',
    awb: null,
    description: 'Wallet recharge via AnyF (AnyFin Ref. AF09R2Lt)',
    rechargeType: 'recharge-anyf',
    amount: 120.00, availableBalance: 151.34,
  },
  {
    id: 'TXN5629447210-W01',
    date: '29 Apr, 2026', time: '08:11 PM',
    awb: '1504872392432',
    description: 'COD charges reversed',
    rechargeType: 'cod-adjustment',
    amount: 36.40, availableBalance: 31.34,
  },
  {
    id: 'TXN5629447210-W02',
    date: '29 Apr, 2026', time: '08:09 PM',
    awb: '1504872392432',
    description: 'Forward charges applied',
    rechargeType: 'shipment',
    amount: -94.20, availableBalance: -5.06,
  },
  {
    id: 'TXN5629447209-V01',
    date: '28 Apr, 2026', time: '04:30 PM',
    awb: '1504872392420',
    description: 'Shipment refund processed',
    rechargeType: 'shipment-refund',
    amount: 88.74, availableBalance: 89.14,
  },
  {
    id: 'TXN5629447208-U01',
    date: '27 Apr, 2026', time: '02:22 PM',
    awb: '1504872392411',
    description: 'WhatsApp communication charges',
    rechargeType: 'whatsapp',
    amount: -1.17, availableBalance: 0.40,
  },
  {
    id: 'TXN5629447208-U02',
    date: '27 Apr, 2026', time: '02:20 PM',
    awb: '1504872392411',
    description: 'Forward charges applied',
    rechargeType: 'shipment',
    amount: -142.80, availableBalance: 1.57,
  },
  {
    id: 'TXN5629447207-T01',
    date: '26 Apr, 2026', time: '12:48 PM',
    awb: '1504872392402',
    description: 'Early COD credit released',
    rechargeType: 'early-cod',
    amount: 90.30, availableBalance: 144.37,
  },
  {
    id: 'TXNRZ-R0L8Pq000',
    date: '25 Apr, 2026', time: '10:05 AM',
    awb: null,
    description: 'Wallet recharge via Razorpay (pay_RM7nlVTl67Dy)',
    rechargeType: 'recharge-razorpay',
    amount: 100.00, availableBalance: 54.07,
  },
];

/* ──────────────────────────── KPI helpers ──────────────────────────── */

export interface WalletKpis {
  totalCredits: number;
  totalDebits: number;
  totalTransactions: number;
  availableBalance: number;
}

/**
 * Compute the four summary KPIs from the supplied dataset.
 *
 * • `totalCredits`      – sum of all positive `amount`s
 * • `totalDebits`       – absolute sum of all negative `amount`s
 * • `totalTransactions` – row count
 * • `availableBalance`  – balance stamped on the most-recent row
 *                         (rows are sorted reverse-chronologically so
 *                         index 0 carries the latest snapshot)
 */
export function computeWalletKpis(rows: WalletTransaction[]): WalletKpis {
  let credits = 0;
  let debits = 0;
  for (const row of rows) {
    if (row.amount >= 0) credits += row.amount;
    else debits += -row.amount;
  }
  return {
    totalCredits: credits,
    totalDebits: debits,
    totalTransactions: rows.length,
    availableBalance: rows.length > 0 ? rows[0].availableBalance : 0,
  };
}

/**
 * Indian-style rupee formatter (₹ 1,23,456.78). Used by the KPI strip
 * + every cell that renders a money value so the grouping stays
 * consistent across the whole page.
 */
export function formatRupees(n: number, opts?: { showSign?: boolean }): string {
  const negative = n < 0;
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (opts?.showSign) {
    if (negative) return `− ₹${formatted}`;
    return `+ ₹${formatted}`;
  }
  return `${negative ? '−' : ''}₹${formatted}`;
}
