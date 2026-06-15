import React from 'react';
import type { ShipmentMode } from '../data/shipmentModes';

export interface AwbAssignedViewProps {
  orderId: string;
  awbNumber: string;
  shipmentMode: ShipmentMode | null;
  customerName: string;
  deliveryCity: string;
  pickupName: string;
  pickupCity: string;
  chargeableWeight: number;
  amount: number;
  paymentMode: 'PREPAID' | 'COD';
  onViewOrders: () => void;
  /** Optional — hidden when the entry-point doesn't expose a "create another order" CTA. */
  onCreateAnother?: () => void;
  onPrintLabel: () => void;
}

/**
 * Final success view rendered after a courier is selected and an AWB is
 * generated. Shared by the New Forward Order flow + the Ship Now flow
 * launched from the Pending Orders grid.
 */
export const AwbAssignedView: React.FC<AwbAssignedViewProps> = ({
  orderId, awbNumber, shipmentMode, customerName, deliveryCity, pickupName, pickupCity,
  chargeableWeight, amount, paymentMode, onViewOrders, onCreateAnother, onPrintLabel,
}) => (
  <div className="ord-nf-state">
    <div className="ord-nf-state-card">
      <div className="ord-nf-state-ico ok" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="ord-nf-state-title">AWB Assigned</div>
      <div className="ord-nf-state-sub">
        Order <b>{orderId}</b> is ready to ship.{' '}
        {shipmentMode ? (
          <>{shipmentMode.courier}{shipmentMode.mode ? ` (${shipmentMode.mode})` : ''} will pick it up next.</>
        ) : null}
      </div>

      <div className="ord-nf-awb">
        <div className="ord-nf-awb-l">
          <div className="ord-nf-state-k">AWB Number</div>
          <div className="ord-nf-awb-num">{awbNumber}</div>
          {shipmentMode && (
            <div className="ord-nf-awb-courier">
              {shipmentMode.courier}
              {shipmentMode.mode && ` · ${shipmentMode.mode}`}
              {' · '}{shipmentMode.weight} kg slab
            </div>
          )}
        </div>
        <span className="ord-status new ord-nf-awb-pill">Ready to Ship</span>
      </div>

      <div className="ord-nf-state-grid">
        <div>
          <div className="ord-nf-state-k">Order ID</div>
          <div className="ord-nf-state-v mono">{orderId}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Customer</div>
          <div className="ord-nf-state-v">{customerName} · {deliveryCity}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Pickup From</div>
          <div className="ord-nf-state-v">{pickupName} · {pickupCity}</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Chargeable Weight</div>
          <div className="ord-nf-state-v mono">{chargeableWeight.toFixed(2)} kg</div>
        </div>
        <div>
          <div className="ord-nf-state-k">Order Value</div>
          <div className="ord-nf-state-v mono">
            ₹{amount.toLocaleString('en-IN')}{' '}
            <span className={`ord-pay-mode ${paymentMode === 'COD' ? 'cod' : 'prepaid'}`} style={{ marginLeft: 6 }}>
              {paymentMode}
            </span>
          </div>
        </div>
        {shipmentMode && (
          <div>
            <div className="ord-nf-state-k">Shipping Rate</div>
            <div className="ord-nf-state-v mono">₹{shipmentMode.rate.toLocaleString('en-IN')}</div>
          </div>
        )}
      </div>

      <div className="ord-nf-state-ft">
        {onCreateAnother && (
          <button type="button" className="ord-cta ord-cta-s" onClick={onCreateAnother}>
            + Create Another Order
          </button>
        )}
        <button type="button" className="ord-cta ord-cta-s" onClick={onPrintLabel}>
          🖨 Print Label
        </button>
        <button type="button" className="ord-cta ord-cta-p" onClick={onViewOrders}>
          View All Orders
        </button>
      </div>
    </div>
  </div>
);

export default AwbAssignedView;
