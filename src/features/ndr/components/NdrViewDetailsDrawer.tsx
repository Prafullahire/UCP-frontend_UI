import React, { useEffect } from 'react';
import type { NdrRecord } from '../types';

interface NdrViewDetailsDrawerProps {
  record: NdrRecord;
  onClose: () => void;
  onReattempt: (record: NdrRecord) => void;
}

const PRIORITY_LABEL: Record<NdrRecord['priority'], string> = {
  critical: 'Critical',
  seller:   'Seller Action Required',
  none:     'No Action Required',
};

interface ActivityEvent {
  cur: boolean;
  ev: string;
  ts: string;
}

/**
 * 900-px right rail showing the full NDR record. The left column is a
 * stack of detail sections; the right column hosts a vertical activity
 * log. The footer surfaces the same "Re-attempt" CTA as the table row
 * (suppressed for the "No Action Required" priority bucket).
 */
export const NdrViewDetailsDrawer: React.FC<NdrViewDetailsDrawerProps> = ({
  record: r,
  onClose,
  onReattempt,
}) => {
  /* Close on Escape — matches every other drawer in the app. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Activity log entries — mirrors the prototype's static list. The
     attempt date threads through every timestamp so each NDR's drawer
     reads as the latest stop on the same shipment. */
  const activityLog: ActivityEvent[] = [
    { cur: true,  ev: `NDR Raised — ${r.attemptLabel}`,           ts: `${r.attemptDate} · ${r.lastActionTime}` },
    { cur: false, ev: 'Seller Notified via Dashboard',            ts: `${r.attemptDate} · 15 mins after NDR` },
    { cur: false, ev: 'Delivery Attempted by XpressBees',         ts: `${r.attemptDate} · 09:00 AM` },
    { cur: false, ev: 'Shipment Out for Delivery',                ts: `${r.attemptDate} · 07:30 AM` },
    { cur: false, ev: 'Arrived at Delivery Hub',                  ts: `${r.attemptDate} · 06:15 AM` },
    { cur: false, ev: 'In Transit — XpressBees Hub',              ts: '—' },
    { cur: false, ev: 'Shipment Picked Up',                       ts: '—' },
  ];

  const modeBadgeClass = r.transportMode === 'air' ? 'air' : 'surface';
  const modeBadgeLabel = r.transportMode === 'air' ? 'Air' : 'Surface';
  const paymentBadgeClass = r.paymentMode === 'cod' ? 'cod' : 'prepaid';
  const paymentBadgeLabel = r.paymentMode === 'cod' ? 'COD' : 'Prepaid';
  const skuSuffix = String(r.orderId).replace(/^CE-/, '');

  return (
    <div
      className="ndr-vd-ov"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ndr-vd-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ndr-vd">
        {/* Header */}
        <div className="ndr-vd-hdr">
          <div className="ndr-vd-hdr-l">
            <div className="ndr-vd-oid" id="ndr-vd-title">
              {r.orderId}
            </div>
            <div className="ndr-vd-badges">
              <span className={`ndr-vd-badge ${r.priority}`}>
                {PRIORITY_LABEL[r.priority]}
              </span>
              <span className={`ndr-vd-badge ${paymentBadgeClass}`}>
                {paymentBadgeLabel}
              </span>
              <span className={`ndr-vd-badge ${modeBadgeClass}`}>
                {modeBadgeLabel}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`ndr-vd-sla ${r.sla}`}>{r.slaText}</span>
            <button
              type="button"
              className="ord-modal-x"
              onClick={onClose}
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="ndr-vd-body">
          {/* Left — detail sections */}
          <div className="ndr-vd-left">
            {/* NDR reason banner */}
            <div className={`ndr-vd-banner ${r.priority}`}>
              <div className="ndr-vd-banner-lbl">
                NDR Reason — {r.attemptLabel}
              </div>
              <div className="ndr-vd-banner-val">{r.reason}</div>
              <div className="ndr-vd-banner-meta">
                <span className="ndr-vd-banner-meta-item">
                  Attempt date: <b>{r.attemptDate}</b>
                </span>
                <span className="ndr-vd-banner-meta-item">
                  Last action by: <b>{r.lastActionBy}</b> at {r.lastActionTime}
                </span>
                <span className="ndr-vd-banner-meta-item">
                  SLA: <b>{r.slaText}</b>
                </span>
              </div>
            </div>

            {/* Order Details */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Order Details</div>
              <div className="ndr-vd-grid cols-4">
                <Field label="Order ID">
                  <span
                    className="ndr-vd-field-val mono"
                    style={{ color: 'var(--blue)' }}
                  >
                    {r.orderId}
                  </span>
                </Field>
                <Field label="Order Amount">
                  <span className="ndr-vd-field-val mono">{r.amountDisplay}</span>
                </Field>
                <Field label="Payment Mode">
                  <span className={`ndr-vd-badge ${paymentBadgeClass}`}>
                    {paymentBadgeLabel}
                  </span>
                </Field>
                <Field label="Attempt No.">
                  <span className="ndr-vd-field-val">{r.attemptLabel}</span>
                </Field>
              </div>
            </div>

            {/* Customer Details */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Customer Details</div>
              <div className="ndr-vd-grid cols-3">
                <Field label="Customer Name">
                  <span className="ndr-vd-field-val">{r.customerName}</span>
                </Field>
                <Field label="Contact No.">
                  <span className="ndr-vd-field-val mono">{r.customerPhone}</span>
                </Field>
                <Field label="RTO Risk">
                  <span
                    className={`ndr-vd-field-val ${r.highRtoRisk ? 'high' : 'low'}`}
                  >
                    {r.highRtoRisk ? 'High' : 'Low'}
                  </span>
                </Field>
                <Field label="Delivery Address">
                  <span className="ndr-vd-field-val muted span2">
                    {r.deliveryAddress}
                  </span>
                </Field>
              </div>
              <div className="ndr-vd-tip">
                <b>Verify address before reattempt.</b> If the address looks incorrect,
                use <b>Update Details</b> to correct it before scheduling a re-attempt.
              </div>
            </div>

            {/* Shipment Details */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Shipment Details</div>
              <div className="ndr-vd-grid cols-4">
                <Field label="Carrier">
                  <span className="ndr-vd-field-val">XpressBees</span>
                </Field>
                <Field label="AWB No.">
                  <span
                    className="ndr-vd-field-val mono"
                    style={{ color: 'var(--blue)' }}
                  >
                    {r.orderId}
                  </span>
                </Field>
                <Field label="Mode">
                  <span className={`ndr-vd-badge ${modeBadgeClass}`}>
                    {modeBadgeLabel}
                  </span>
                </Field>
                <Field label="Service Type">
                  <span className="ndr-vd-field-val">{r.serviceTier}</span>
                </Field>
              </div>
            </div>

            {/* Package Details */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Package Details</div>
              <div className="ndr-vd-grid cols-4">
                <Field label="Dead Weight">
                  <span className="ndr-vd-field-val muted">—</span>
                </Field>
                <Field label="Dimensions">
                  <span className="ndr-vd-field-val muted">—</span>
                </Field>
                <Field label="Volumetric Weight">
                  <span className="ndr-vd-field-val muted">—</span>
                </Field>
                <Field label="Applied Weight">
                  <span className="ndr-vd-field-val muted">—</span>
                </Field>
              </div>
            </div>

            {/* Product Details */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Product Details</div>
              <table className="ndr-vd-ptbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Product — {r.orderId}</td>
                    <td>General</td>
                    <td>SKU-{skuSuffix}</td>
                    <td>1</td>
                    <td>{r.amountDisplay}</td>
                    <td>{r.amountDisplay}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', color: 'var(--ink3)' }}>
                      Order Total
                    </td>
                    <td>{r.amountDisplay}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right — activity log */}
          <div className="ndr-vd-right">
            <div className="ndr-vd-right-title">Activity Log</div>
            <div className="ndr-vd-al">
              {activityLog.map((e, idx) => (
                <div className="ndr-al-item" key={idx}>
                  <div>
                    <div className={`ndr-al-dot ${e.cur ? 'cur' : 'done'}`} />
                  </div>
                  <div>
                    <div className="ndr-al-ev">{e.ev}</div>
                    <div className="ndr-al-ts">{e.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ndr-vd-ft">
          {r.priority === 'none' ? (
            <>
              <div />
              <button type="button" className="ndr-ab ghost" onClick={onClose}>
                Close
              </button>
            </>
          ) : (
            <>
              <div className="ndr-vd-ft-info">
                To resolve: <b>{r.reason}</b> — confirm re-attempt date &amp; time below.
              </div>
              <div className="ndr-vd-ft-actions">
                <button type="button" className="ndr-ab ghost" onClick={onClose}>
                  Close
                </button>
                <button
                  type="button"
                  className="ndr-ab primary"
                  onClick={() => onReattempt(r)}
                >
                  Re-attempt
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* Small helper to keep field markup terse in the body above. */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div className="ndr-vd-field-lbl">{label}</div>
    {children}
  </div>
);

export default NdrViewDetailsDrawer;
