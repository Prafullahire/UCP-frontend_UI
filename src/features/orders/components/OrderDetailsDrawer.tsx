import React, { useEffect } from 'react';
import { SHIPMENT_STATUS_META } from '../data/shipmentsData';
import type { Order, Shipment, StatusVariant } from '../types';

interface OrderDetailsDrawerProps {
  /** Either a Pending `Order` (no AWB / lifecycle data yet) or a fully
   *  populated `Shipment` from any of the shipment tabs. The drawer
   *  branches on the discriminator and renders the same set of read-only
   *  sections, dropping post-shipping rows for Pending orders. */
  source: Order | Shipment;
  onClose: () => void;
}

/* A Shipment carries an `awb` field; an Order does not — used as the
   structural discriminator throughout the file. */
const isShipment = (v: Order | Shipment): v is Shipment => 'awb' in v;

/**
 * Read-only "Order Details" side drawer.
 *
 * Opens from the right rail when a user clicks an Order ID hyperlink in
 * the Pending grid, or the "View Details" hyperlink in the All Orders
 * grid. Visual + structural parity with `NdrViewDetailsDrawer` is
 * intentional — we re-use the existing `.ndr-vd-*` class set so the
 * drawer width (900px), section cards, header/badges, activity log rail,
 * and footer inherit the platform's drawer system instead of growing a
 * parallel style sheet. Every field is rendered as plain text (no
 * inputs, no action CTAs other than "Close") to keep the surface
 * strictly informational.
 */
export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  source,
  onClose,
}) => {
  const s = source;
  const ship = isShipment(s) ? s : null;
  const order = !isShipment(s) ? s : null;
  /* Close on Escape — matches every other drawer in the app. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Status meta — Pending orders aren't part of `ShipmentStatus` yet,
     so they get a synthetic "Pending" pill that mirrors the table's
     NEW/OLD tag visually. */
  const statusMeta: { label: string; variant: StatusVariant } = ship
    ? (SHIPMENT_STATUS_META[ship.status as keyof typeof SHIPMENT_STATUS_META] || { label: String(ship.status).toUpperCase(), variant: 'grey' })
    : { label: order!.age === 'NEW' ? 'Pending (New)' : 'Pending', variant: 'amber' };

  const paymentBadgeClass = s.payment.mode === 'COD' ? 'cod' : 'prepaid';
  const paymentBadgeLabel = s.payment.mode;

  const transport = ship?.transportMode;
  const modeClass =
    transport === 'air' ? 'air' : transport === 'surface' ? 'surface' : 'none';
  const modeLabel = transport
    ? transport === 'air'
      ? 'Air'
      : 'Surface'
    : '—';

  const amountDisplay = '₹' + s.payment.amount.toLocaleString('en-IN');
  const deliveryAddress = `${s.customer.name}, ${s.delivery.city} — ${s.delivery.pin}`;
  const pickupAddress = `${s.pickup.city} — ${s.pickup.pin}`;

  /* Activity log entries — derived from the shipment's lifecycle stamps
     when present, or a minimal "order created" placeholder when the
     surface is a Pending Order (no carrier handshake yet). */
  const activityLog = ship
    ? buildActivityLog(ship)
    : buildOrderActivityLog(order!);

  return (
    <div
      className="ndr-vd-ov"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ord-vd-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ndr-vd">
        {/* Header */}
        <div className="ndr-vd-hdr">
          <div className="ndr-vd-hdr-l">
            <div className="ndr-vd-oid" id="ord-vd-title">
              {s.id}
            </div>
            <div className="ndr-vd-badges">
              <span className={`ndr-vd-badge ${statusMeta.variant}`}>
                {statusMeta.label}
              </span>
              <span className={`ndr-vd-badge ${paymentBadgeClass}`}>
                {paymentBadgeLabel}
              </span>
              {transport && (
                <span className={`ndr-vd-badge ${modeClass}`}>{modeLabel}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="ndr-vd-sla ok" aria-label="View only">
              Read only
            </span>
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
            {/* Order Details */}
            <div className="ndr-vd-sec" style={{ paddingTop: 22 }}>
              <div className="ndr-vd-sec-title">Order Details</div>
              <div className="ndr-vd-grid cols-4">
                <Field label="Order ID">
                  <span
                    className="ndr-vd-field-val mono"
                    style={{ color: 'var(--blue)' }}
                  >
                    {s.id}
                  </span>
                </Field>
                <Field label="Order Date">
                  <span className="ndr-vd-field-val">
                    {s.date}
                    {s.time && (
                      <span
                        className="ndr-vd-field-val muted"
                        style={{ display: 'block', fontSize: 11 }}
                      >
                        {s.time}
                      </span>
                    )}
                  </span>
                </Field>
                <Field label="Channel">
                  <span className="ndr-vd-field-val">{s.channel}</span>
                </Field>
                <Field label="Order Amount">
                  <span className="ndr-vd-field-val mono">{amountDisplay}</span>
                </Field>
                <Field label="Payment Mode">
                  <span className={`ndr-vd-badge ${paymentBadgeClass}`}>
                    {paymentBadgeLabel}
                  </span>
                </Field>
                <Field label="Status">
                  <span className="ndr-vd-field-val">{statusMeta.label}</span>
                </Field>
                <Field label="Tags">
                  <span className="ndr-vd-field-val muted">
                    {s.tags.length > 0 ? s.tags.join(', ') : '—'}
                  </span>
                </Field>
                <Field label="Pickup Location">
                  <span className="ndr-vd-field-val">{s.pickupLocation}</span>
                </Field>
              </div>
            </div>

            {/* Customer Details */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Customer Details</div>
              <div className="ndr-vd-grid cols-3">
                <Field label="Customer Name">
                  <span className="ndr-vd-field-val">{s.customer.name}</span>
                </Field>
                <Field label="Contact No.">
                  <span className="ndr-vd-field-val mono">
                    {s.customer.phone}
                  </span>
                </Field>
                <Field label="City / Pin">
                  <span className="ndr-vd-field-val">
                    {s.customer.city} — {s.customer.pin}
                  </span>
                </Field>
                <Field label="Delivery Address">
                  <span className="ndr-vd-field-val muted span2">
                    {deliveryAddress}
                  </span>
                </Field>
              </div>
            </div>

            {/* Pickup &amp; Delivery */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Pickup &amp; Delivery</div>
              <div className="ndr-vd-grid cols-2">
                <Field label="Pickup From">
                  <span className="ndr-vd-field-val">{pickupAddress}</span>
                </Field>
                <Field label="Deliver To">
                  <span className="ndr-vd-field-val">
                    {s.delivery.city} — {s.delivery.pin}
                  </span>
                </Field>
              </div>
            </div>

            {/* Shipment Details — branches on the source type so Pending
                orders don't render empty AWB/PDD rows. */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Shipment Details</div>
              {ship ? (
                <>
                  <div className="ndr-vd-grid cols-4">
                    <Field label="Carrier">
                      <span className="ndr-vd-field-val">
                        {ship.shippingCourier ?? 'XpressBees'}
                      </span>
                    </Field>
                    <Field label="AWB No.">
                      <span
                        className="ndr-vd-field-val mono"
                        style={{ color: 'var(--blue)', fontSize: 12 }}
                      >
                        {ship.awb}
                      </span>
                    </Field>
                    <Field label="Mode">
                      {transport ? (
                        <span className={`ndr-vd-badge ${modeClass}`}>{modeLabel}</span>
                      ) : (
                        <span className="ndr-vd-field-val muted">—</span>
                      )}
                    </Field>
                    <Field label="Service Zone">
                      <span className="ndr-vd-field-val">
                        {ship.shippingZone ?? '—'}
                      </span>
                    </Field>
                    <Field label="Manifested">
                      <span className="ndr-vd-field-val">
                        {ship.manifestedDate ?? '—'}
                        {ship.manifestedTime && (
                          <span
                            className="ndr-vd-field-val muted"
                            style={{ display: 'block', fontSize: 11 }}
                          >
                            {ship.manifestedTime}
                          </span>
                        )}
                      </span>
                    </Field>
                    <Field label="PDD (Promised)">
                      <span className="ndr-vd-field-val">
                        {ship.pddDate ?? '—'}
                        {ship.pddTime && (
                          <span
                            className="ndr-vd-field-val muted"
                            style={{ display: 'block', fontSize: 11 }}
                          >
                            {ship.pddTime}
                          </span>
                        )}
                      </span>
                    </Field>
                    <Field label="Delivered On">
                      <span className="ndr-vd-field-val">
                        {ship.deliveryDate ?? '—'}
                        {ship.deliveryTime && (
                          <span
                            className="ndr-vd-field-val muted"
                            style={{ display: 'block', fontSize: 11 }}
                          >
                            {ship.deliveryTime}
                          </span>
                        )}
                      </span>
                    </Field>
                    <Field label="Days in Transit">
                      <span className="ndr-vd-field-val">
                        {ship.daysInTransit ? `Day ${ship.daysInTransit}` : '—'}
                      </span>
                    </Field>
                  </div>
                  {ship.pddBreached && (
                    <div
                      className="ndr-vd-tip"
                      style={{
                        background: 'var(--rl)',
                        borderColor: 'var(--rm)',
                        color: 'var(--red)',
                      }}
                    >
                      <b style={{ color: 'var(--red)' }}>PDD breached.</b> Promised
                      delivery date has passed for this shipment.
                    </div>
                  )}
                </>
              ) : (
                <div className="ndr-vd-tip">
                  <b>Pending — not yet shipped.</b> Carrier, AWB, PDD and other
                  shipping details will appear here once this order is shipped.
                </div>
              )}
            </div>

            {/* Package Details — Pending orders carry the actual dims + dead/vol
                weights captured at order entry; shipment rows only know the
                shipping weight, so the unmeasured rows stay dashed. */}
            <div className="ndr-vd-sec">
              <div className="ndr-vd-sec-title">Package Details</div>
              <div className="ndr-vd-grid cols-4">
                <Field label="Dead Weight">
                  <span className="ndr-vd-field-val">
                    {order?.package.deadWt ?? ship?.shippingWeight ?? '—'}
                  </span>
                </Field>
                <Field label="Dimensions">
                  <span
                    className={`ndr-vd-field-val ${order ? '' : 'muted'}`}
                  >
                    {order?.package.dims ?? '—'}
                  </span>
                </Field>
                <Field label="Volumetric Weight">
                  <span
                    className={`ndr-vd-field-val ${order ? '' : 'muted'}`}
                  >
                    {order?.package.volWt ?? '—'}
                  </span>
                </Field>
                <Field label="Applied Weight">
                  <span className="ndr-vd-field-val muted">
                    {ship?.shippingWeight ?? '—'}
                  </span>
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
                    <th>SKU / HSN</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{order?.product.name ?? `Product — ${s.id}`}</td>
                    <td>General</td>
                    <td>
                      {order
                        ? `${order.product.sku} · HSN ${order.product.hsn}`
                        : `SKU-${s.id}`}
                    </td>
                    <td>{order?.product.qty ?? 1}</td>
                    <td>{amountDisplay}</td>
                    <td>{amountDisplay}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: 'right', color: 'var(--ink3)' }}
                    >
                      Order Total
                    </td>
                    <td>{amountDisplay}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* RTO context — only rendered when this shipment is in an RTO
                lifecycle stage so the cost of an empty block is avoided
                for the more common forward-delivery cases. */}
            {ship?.rtoInitiatedDate && (
              <div className="ndr-vd-sec">
                <div className="ndr-vd-sec-title">RTO Details</div>
                <div className="ndr-vd-grid cols-2">
                  <Field label="RTO Initiated">
                    <span className="ndr-vd-field-val">
                      {ship.rtoInitiatedDate}
                    </span>
                  </Field>
                  <Field label="Reason">
                    <span className="ndr-vd-field-val muted">
                      {ship.rtoReason ?? '—'}
                    </span>
                  </Field>
                </div>
              </div>
            )}
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

        {/* Footer — read-only: a single Close action keeps the surface
            unambiguous about what users can do here. */}
        <div className="ndr-vd-ft">
          <div className="ndr-vd-ft-info">
            View-only order details — no edits available from this drawer.
          </div>
          <div className="ndr-vd-ft-actions">
            <button type="button" className="ndr-ab ghost" onClick={onClose}>
              Close
            </button>
          </div>
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

interface ActivityEvent {
  cur: boolean;
  ev: string;
  ts: string;
}

/**
 * Derives the right-rail activity timeline from the shipment's lifecycle
 * stamps. The current stage anchors at the top with a blue dot; every
 * preceding stage shows as completed. Dashed placeholders fill in for
 * timestamps that aren't surfaced on the underlying `Shipment` row.
 */
function buildActivityLog(s: Shipment): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const meta = SHIPMENT_STATUS_META[s.status as keyof typeof SHIPMENT_STATUS_META] || { label: String(s.status).toUpperCase() };

  events.push({
    cur: true,
    ev: `Status: ${meta.label}`,
    ts: s.deliveryDate
      ? `${s.deliveryDate}${s.deliveryTime ? ' · ' + s.deliveryTime : ''}`
      : s.pddDate
        ? `PDD ${s.pddDate}`
        : s.date,
  });

  if (s.rtoInitiatedDate) {
    events.push({
      cur: false,
      ev: 'RTO Initiated',
      ts: `${s.rtoInitiatedDate}${s.rtoReason ? ' · ' + s.rtoReason : ''}`,
    });
  }

  if (s.deliveryDate) {
    events.push({
      cur: false,
      ev: 'Out for Delivery',
      ts: `${s.deliveryDate} · 07:30 AM`,
    });
  }

  if (s.pddDate) {
    events.push({
      cur: false,
      ev: 'Arrived at Delivery Hub',
      ts: `${s.pddDate} · 06:15 AM`,
    });
  }

  events.push({
    cur: false,
    ev: 'In Transit — XpressBees Hub',
    ts: s.manifestedDate
      ? `${s.manifestedDate}${s.manifestedTime ? ' · ' + s.manifestedTime : ''}`
      : '—',
  });

  events.push({
    cur: false,
    ev: 'Shipment Picked Up',
    ts: s.manifestedDate ?? '—',
  });

  events.push({
    cur: false,
    ev: 'Order Created',
    ts: `${s.date}${s.time ? ' · ' + s.time : ''}`,
  });

  return events;
}

/**
 * Activity timeline shown when the drawer is opened from the Pending
 * grid. The order hasn't been handed to a carrier yet, so we only
 * surface the "Order Created" event with a sitting hint when the row is
 * flagged with `needsAttention` (sitting >24 hrs).
 */
function buildOrderActivityLog(o: Order): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      cur: true,
      ev: o.needsAttention ? 'Pending — Sitting >24 hrs' : 'Pending — Awaiting Ship',
      ts: `${o.date}${o.time ? ' · ' + o.time : ''}`,
    },
    {
      cur: false,
      ev: `Order Created on ${o.channel}`,
      ts: `${o.date}${o.time ? ' · ' + o.time : ''}`,
    },
  ];
  return events;
}

export default OrderDetailsDrawer;
