/**
 * Type definitions for the Weight Reconciliation module.
 *
 * Mirrors the data shape used by the prototype in
 * `ui-source/screens/weight-reconciliation (1).html`, normalised for use
 * with the wider XB design system (Orders / NDR / Finance reuse the same
 * tokens).
 */

/**
 * Reconciliation lifecycle bucket — drives both the KPI strip and the
 * tab strip below it. The numeric values come from the `WR_KPI_COUNTS`
 * record in `data/weightReconciliationData.ts`.
 *
 *  • `all`      → every record in the period (also the "all" tab)
 *  • `action`   → courier weight applied, seller has not responded yet
 *  • `open`     → seller raised a dispute, awaiting XpressBees review
 *  • `accepted` → seller accepted the courier weight (settled)
 *  • `closed`   → dispute closed (decision delivered, settled or rejected)
 */
export type WrBucket = 'all' | 'action' | 'open' | 'accepted' | 'closed';

/**
 * Per-row state. `null` means the seller has not yet acted (so the row
 * surfaces Accept / Reject buttons in the Action column).
 */
export type WrRowState = null | 'accepted' | 'open' | 'closed';

/**
 * Granular UI-level status surfaced by the Status filter chip on the
 * All tab. Same lifecycle bucket as `WrRowState`, but expanded so the
 * seller can distinguish between rows they accepted manually and rows
 * that auto-accepted because the 7-day dispute window expired.
 *
 *  • `auto-accepted`     — accepted by the system after 7 days
 *  • `seller-accepted`   — manually accepted by the seller
 *  • `under-review`      — open dispute, XpressBees reviewing
 *  • `action-pending`    — seller has not acted yet (within 7 days)
 *  • `closed`            — dispute closed (settled or rejected)
 */
export type WrUiStatus =
  | 'auto-accepted'
  | 'seller-accepted'
  | 'under-review'
  | 'action-pending'
  | 'closed';

/**
 * Discrepancy direction between seller-entered and courier-applied weight.
 *  • `up`    — courier slabbed up (extra charges raised)
 *  • `match` — slabs match, no discrepancy
 */
export type WrDiscrepancy = 'up' | 'match';

/** Slab key used by the "Filter by Applied Slab" dropdown. */
export type WrSlabId = '500_1000' | '1001_2000' | '2001_5000' | '5000_plus';

/** Charged-to-wallet flag used by the "Charged" filter. */
export type WrChargedFlag = 'yes' | 'no';

/**
 * Single weight reconciliation record. Each entry corresponds to one
 * shipment where the courier-applied weight was different from the
 * seller-entered weight, and therefore needs reconciliation.
 */
export interface WrRecord {
  id: string;

  /** ISO date (yyyy-mm-dd) the courier applied the new weight on */
  appliedDate: string;
  /** AWB / waybill number — clickable, opens tracking */
  awb: string;
  /** Order id (e.g. "#416648") — clickable, opens order details */
  orderId: string;

  /** Seller-entered (declared) weight breakdown */
  entered: {
    /** Dead weight as captured at order creation (e.g. "500g") */
    dead: string;
    /** L × B × H (e.g. "10×10×2") */
    dims: string;
    /** Charged slab (e.g. "500g") */
    slab: string;
    /** Volumetric weight (e.g. "40g") */
    volumetric: string;
  };

  /** Courier-applied final weight (e.g. "1000g") */
  appliedWeight: string;

  /** Charges raised against the applied weight */
  charges: {
    forward: string;
    /** Optional — only present when an RTO charge applied */
    rto?: string;
    /** True when the wallet was already debited */
    chargedToWallet: boolean;
  };

  product: string;

  /** Days remaining in the 7-day dispute window (0 → auto-accepts today) */
  daysLeft: number;

  /** Active state for this row (defaults to `null` → "needs action") */
  state: WrRowState;

  /**
   * For accepted rows — whether the seller accepted manually or the
   * dispute window expired and the system auto-accepted. Ignored for
   * any other `state`.
   */
  acceptedBy?: 'seller' | 'auto';

  /** Slab bucket — used by the "Filter by Applied Slab" filter */
  slabBucket: WrSlabId;
}

/** Counts surfaced by the KPI strip + tab strip. */
export interface WrKpiCounts {
  all: number;
  action: number;
  open: number;
  accepted: number;
  closed: number;
}

/** Generic option shape used by the inline filter chips. */
export interface WrFilterOption {
  id: string;
  label: string;
}
