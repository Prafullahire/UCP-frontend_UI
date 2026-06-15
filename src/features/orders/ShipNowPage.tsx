import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import SelectShipmentModeView from './components/SelectShipmentModeView';
import AwbAssignedView from './components/AwbAssignedView';
import { SHIPMENT_MODES, genAwbNumber } from './data/shipmentModes';
import { PENDING_ORDERS, PICKUP_LOCATIONS } from './data/ordersData';
import type { Order } from './types';

/* The Pending grid only stores `{city, pin}` for pickup/delivery, so a
   small lookup table maps known cities to their full state name. The
   shared `toStateCode()` helper then turns that into the 2-letter code
   shown in the route summary. Unknown cities fall back to an empty
   string and the sidebar simply omits the suffix. */
const CITY_TO_STATE: Record<string, string> = {
  Mumbai:    'Maharashtra',
  Pune:      'Maharashtra',
  Bangalore: 'Karnataka',
  Bengaluru: 'Karnataka',
  Delhi:     'Delhi',
  Chennai:   'Tamil Nadu',
  Hyderabad: 'Telangana',
  Kolkata:   'West Bengal',
  Ahmedabad: 'Gujarat',
  Jaipur:    'Rajasthan',
  Lucknow:   'Uttar Pradesh',
  Kochi:     'Kerala',
};

const cityState = (city: string): string => CITY_TO_STATE[city] ?? '';

/* Strip the unit suffix off a weight string like "1 kg" / "4.30 kg" so we
   can compare physical vs volumetric weights numerically. */
const parseKg = (raw: string | undefined | null): number => {
  if (!raw) return 0;
  const m = String(raw).match(/[\d.]+/);
  return m ? Number(m[0]) : 0;
};

/**
 * Ship Now page used by the "Ship" CTA on the Pending tab of the All
 * Orders screen. Reuses the same SelectShipmentModeView + AwbAssignedView
 * components rendered by the New Forward Order flow's Ship Now step so
 * the experience is identical — only the configuration (order summary,
 * applicable weight, route) is sourced from the order under shipment.
 *
 * Order data is preferentially read from `location.state` (the OrdersPage
 * passes the row that was clicked), with a fallback lookup against
 * PENDING_ORDERS by id so a hard refresh on `/orders/:id/ship` still
 * resolves the page.
 */
export const ShipNowPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  /* Resolve the order under shipment. State takes priority; we fall
     back to a static lookup so a fresh page load still works. */
  const orderFromState = (location.state as { order?: Order } | null)?.order;
  const order: Order | null = useMemo(() => {
    if (orderFromState) return orderFromState;
    return PENDING_ORDERS.find((o) => o.id === params.id) ?? null;
  }, [orderFromState, params.id]);

  /* Step state: select-mode → awb-assigned. Mirrors the New Forward
     Order page's lifecycle so the visual transitions stay consistent. */
  const [step, setStep] = useState<'select-mode' | 'awb-assigned'>('select-mode');
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [awbNumber, setAwbNumber] = useState<string | null>(null);

  /* Order not found — render a small empty state rather than crashing. */
  if (!order) {
    return (
      <div className="page">
        <div className="ord-ph">
          <div className="ord-ph-l">
            <button
              type="button"
              className="ord-nf-back-link"
              onClick={() => navigate('/orders')}
            >
              <span aria-hidden="true">‹</span> Back
            </button>
          </div>
        </div>
        <div className="ord-empty">
          <h3>Order not found</h3>
          <p>
            We couldn&apos;t find an order with id{' '}
            <b>{params.id ?? 'unknown'}</b>. It may have been cancelled or
            already shipped — head back to the Orders list to pick a
            different one.
          </p>
        </div>
      </div>
    );
  }

  /* Derive the props the SelectShipmentModeView expects from the order. */
  const physicalWt = parseKg(order.package.deadWt);
  const volumetricWt = parseKg(order.package.volWt);
  const chargeable = Math.max(physicalWt, volumetricWt);
  const paymentMode: 'PREPAID' | 'COD' = order.payment.mode === 'COD' ? 'COD' : 'PREPAID';
  const pickupName =
    PICKUP_LOCATIONS.find((p) => p.id === order.pickupLocation)?.label ?? order.pickup.city;

  const selectedShipmentMode =
    SHIPMENT_MODES.find((m) => m.id === selectedModeId) ?? null;

  const handleBack = () => {
    if (step === 'awb-assigned') {
      navigate('/orders');
      return;
    }
    navigate('/orders');
  };

  const handleShipNow = () => {
    if (!selectedModeId) {
      showToast('Pick a shipment mode to continue');
      return;
    }
    const awb = genAwbNumber();
    setAwbNumber(awb);
    setStep('awb-assigned');
    showToast(`✓ AWB ${awb} assigned to order ${order.id}`);
  };

  const handleManifestLater = () => {
    /* Order already exists in the Pending list, so "manifest later"
       simply returns the user to the orders grid. */
    showToast(`Order ${order.id} kept in Pending — manifest later`);
    navigate('/orders');
  };

  return (
    <div className="page">
      {/* ── Header row ──────────────────────────────────────────
            Mirrors the New Forward Order page's select-mode header
            exactly — back link on the left, the two CTAs on the
            right ("Create & Manifest Later" + "Ship Now"). When the
            AWB is assigned the header collapses to a single Back to
            Orders link so the success card owns the rest of the
            actions. */}
      <div className="ord-ph">
        <div className="ord-ph-l">
          <button
            type="button"
            className="ord-nf-back-link"
            onClick={handleBack}
          >
            <span aria-hidden="true">‹</span> Back
          </button>
        </div>
        {step === 'select-mode' && (
          <div className="ord-ph-r">
            <button
              type="button"
              className="ord-cta ord-cta-s"
              onClick={handleManifestLater}
            >
              Create &amp; Manifest Later
            </button>
            <button
              type="button"
              className="ord-cta ord-cta-p"
              onClick={handleShipNow}
              disabled={!selectedModeId}
              style={!selectedModeId ? { opacity: .55, cursor: 'not-allowed' } : undefined}
            >
              Ship Now
            </button>
          </div>
        )}
      </div>

      {step === 'select-mode' ? (
        <SelectShipmentModeView
          orderId={order.id}
          orderKind="Forward · Single"
          pickupCity={order.pickup.city}
          pickupPincode={order.pickup.pin}
          pickupState={cityState(order.pickup.city)}
          deliveryCity={order.delivery.city}
          deliveryPincode={order.delivery.pin}
          deliveryState={cityState(order.delivery.city)}
          orderValue={order.payment.amount}
          paymentMode={paymentMode}
          chargeableWeight={chargeable}
          modes={SHIPMENT_MODES}
          selectedModeId={selectedModeId}
          onSelectMode={setSelectedModeId}
        />
      ) : (
        <AwbAssignedView
          orderId={order.id}
          awbNumber={awbNumber ?? ''}
          shipmentMode={selectedShipmentMode}
          customerName={order.customer.name}
          deliveryCity={order.delivery.city}
          pickupName={pickupName}
          pickupCity={order.pickup.city}
          chargeableWeight={chargeable}
          amount={order.payment.amount}
          paymentMode={paymentMode}
          onViewOrders={() => navigate('/orders')}
          onPrintLabel={() =>
            showToast(`🖨️ Label for AWB ${awbNumber} sent to printer`)
          }
        />
      )}

      {toast && <Toast />}
    </div>
  );
};

export default ShipNowPage;
