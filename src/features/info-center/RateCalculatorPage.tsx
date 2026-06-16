import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import CarrierResultCard from './components/CarrierResultCard';
import { calculateRates, pinInfo } from './data/rateCalculatorData';
import type {
  CalcOutput,
  PaymentType,
  PlanKey,
  ResultTab,
  WeightUnit,
} from './types';

/* ── Inline SVG icons (kept here so the page stays self-contained) ── */

const ChevronDown = (
  <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" width="10" height="10">
    <path d="M1 1l4 4 4-4" strokeLinecap="round" />
  </svg>
);

const PinPickupIcon = (
  <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
    <path d="M7 1C5.34 1 4 2.34 4 4c0 2.5 3 6 3 6s3-3.5 3-6c0-1.66-1.34-3-3-3z" fill="#E8520A" />
    <circle cx="7" cy="4" r="1.2" fill="#fff" />
  </svg>
);

const PinDropIcon = (
  <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
    <path d="M7 1C5.34 1 4 2.34 4 4c0 2.5 3 6 3 6s3-3.5 3-6c0-1.66-1.34-3-3-3z" fill="#38A169" />
    <circle cx="7" cy="4" r="1.2" fill="#fff" />
  </svg>
);

const PinListIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <path d="M7 1C5.34 1 4 2.34 4 4c0 2.5 3 6 3 6s3-3.5 3-6c0-1.66-1.34-3-3-3z" />
    <circle cx="7" cy="4" r="1.2" />
  </svg>
);

const RateCardIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <rect x="1" y="1" width="12" height="12" rx="2" />
    <path d="M3 5h8M3 8h5" strokeLinecap="round" />
  </svg>
);

const ArrowRightIcon = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <path d="M4 10h12M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SurfaceIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="1" y="6" width="13" height="12" rx="2" fill="#ED8936" />
    <path d="M14 9h4l3 4v5h-7V9z" fill="#ED8936" />
    <circle cx="6" cy="19" r="2" fill="#C05621" />
    <circle cx="18" cy="19" r="2" fill="#C05621" />
  </svg>
);

const ExpressIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M2 12h16M14 7l5 5-5 5" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 4l4 8-4 8" stroke="#66BB6A" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EmptyStateIcon = (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="8" width="32" height="32" rx="4" />
    <path d="M16 24h16M16 30h10" strokeLinecap="round" />
    <circle cx="24" cy="16" r="3" />
  </svg>
);

const ForwardStarIcon = (
  <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
    <path
      d="M7 1l1.2 3.6H12L9.1 7l1.2 3.6L7 8.5l-3.3 2.1L4.9 7 2 4.6h3.8L7 1z"
      fill="currentColor"
    />
  </svg>
);

const ReturnIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 2v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TnCIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
    <path d="M4 3h8a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M6 7h4M6 10h2" strokeLinecap="round" />
  </svg>
);

const MailIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13">
    <rect x="1" y="3" width="12" height="9" rx="1.5" />
    <path d="M1 5l6 4 6-4" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TnCChevron = (
  <svg
    className="ic-t-chevron"
    viewBox="0 0 10 6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M1 1l4 4 4-4" strokeLinecap="round" />
  </svg>
);

/* ── Helpers ─────────────────────────────────────────────────────── */

const toKg = (val: number, unit: WeightUnit): number => (unit === 'GM' ? val / 1000 : val);

/** XB plan input was removed from the widget, so the calculator falls
 *  back to this default so the right-side breakdown keeps rendering. */
const DEFAULT_PLAN: PlanKey = 'gold';

/**
 * Rate Calculator screen for the Information Center module.
 *
 * Simplified left-side widget (zone chip, XB plan, shipping mode,
 * shipment value, dangerous goods, secure shipment and the volumetric /
 * applicable weight chips were removed). The right-side result panel,
 * page header and spacing remain untouched.
 *
 *   Breadcrumb
 *   Title row  (subtitle + Check-All-Active-Pincodes / View-Rate-Card)
 *   ┌───────────────────────────────────────────┬──────────────┐
 *   │ Form card                                 │ Result panel │
 *   │  • Pickup + Drop pincodes                 │  • Forward / │
 *   │  • Actual Weight + Dimensions             │    Reverse   │
 *   │  • Payment Method + Shipment Value (₹)    │    tabs      │
 *   │  • Calculate / Reset                      │  • Surface + │
 *   │                                           │    Air cards │
 *   ├───────────────────────────────────────────┘              │
 *   │ Collapsible Terms & Conditions card                       │
 *   └────────────────────────────────────────────────────────────┘
 */
export const RateCalculatorPage: React.FC = () => {
  const navigate    = useNavigate();
  const showToast   = useReportsStore((s) => s.showToast);
  const toastState  = useReportsStore((s) => s.toast);

  /* ─── Pincode state ────────────────────────────────────────── */
  const [pickupPin, setPickupPin] = useState('411006');
  const [dropPin,   setDropPin]   = useState('560025');

  /* ─── Package details ──────────────────────────────────────── */
  const [actualWeight, setActualWeight] = useState('0.5');
  const [weightUnit,   setWeightUnit]   = useState<WeightUnit>('KG');
  const [dimL, setDimL] = useState('10');
  const [dimB, setDimB] = useState('10');
  const [dimH, setDimH] = useState('12');

  /* ─── Shipment metadata ────────────────────────────────────── */
  const [payment,   setPayment]   = useState<PaymentType>('cod');
  const [shipValue, setShipValue] = useState('4000');

  /* ─── UI state ─────────────────────────────────────────────── */
  const [unitOpen,   setUnitOpen]   = useState(false);
  const [tncOpen,    setTncOpen]    = useState(false);
  const [resultTab,  setResultTab]  = useState<ResultTab>('forward');
  /**
   * Tracks whether the user has clicked Calculate at least once.
   * When true, `result` (derived via useMemo) is recomputed on every
   * input change so the breakdown stays live. Reset flips it off so the
   * empty state reappears.
   */
  const [showResult, setShowResult] = useState(false);
  const unitSelRef                  = useRef<HTMLDivElement | null>(null);

  /* ─── Derived: weights & pincode metadata ──────────────────── */
  const pickupMeta = useMemo(() => pinInfo(pickupPin.trim()), [pickupPin]);
  const dropMeta   = useMemo(() => pinInfo(dropPin.trim()),   [dropPin]);

  const actualKg = useMemo(() => {
    const n = parseFloat(actualWeight);
    return Number.isFinite(n) ? toKg(n, weightUnit) : 0;
  }, [actualWeight, weightUnit]);

  const volKg = useMemo(() => {
    const l = parseFloat(dimL) || 0;
    const b = parseFloat(dimB) || 0;
    const h = parseFloat(dimH) || 0;
    return (l * b * h) / 5000;
  }, [dimL, dimB, dimH]);

  /**
   * Result panel content. Derived (not stored) so changing any input
   * after the first Calculate click instantly reflects in the breakdown
   * — matches the prototype's `updateCalcIfShown` behaviour.
   *
   * `plan` is a fixed default because the XB-plan picker was removed
   * from the simplified left-side widget.
   */
  const result = useMemo<CalcOutput | null>(() => {
    if (!showResult) return null;
    return calculateRates({
      pickup:    pickupPin.trim(),
      drop:      dropPin.trim(),
      actualKg,
      volKg,
      plan:      DEFAULT_PLAN,
      isCod:     payment === 'cod',
      shipValue: parseFloat(shipValue) || 0,
    });
  }, [showResult, pickupPin, dropPin, actualKg, volKg, payment, shipValue]);

  /* ─── Close the weight-unit dropdown on outside click ─────── */
  useEffect(() => {
    if (!unitOpen) return;
    const handler = (e: MouseEvent) => {
      if (unitSelRef.current && !unitSelRef.current.contains(e.target as Node)) {
        setUnitOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [unitOpen]);

  /* ─── Handlers ─────────────────────────────────────────────── */

  const handleCalculate = useCallback(() => {
    const pu = pickupPin.trim();
    const dr = dropPin.trim();
    if (pu.length !== 6 || Number.isNaN(Number(pu))) {
      showToast('Please enter a valid 6-digit pickup pincode');
      return;
    }
    if (dr.length !== 6 || Number.isNaN(Number(dr))) {
      showToast('Please enter a valid 6-digit drop pincode');
      return;
    }
    setShowResult(true);
    showToast('Rates calculated');
  }, [pickupPin, dropPin, showToast]);

  const handleReset = useCallback(() => {
    setPickupPin('');
    setDropPin('');
    setActualWeight('');
    setWeightUnit('KG');
    setDimL('');
    setDimB('');
    setDimH('');
    setShipValue('');
    setPayment('cod');
    setShowResult(false);
    showToast('Form reset');
  }, [showToast]);

  const handleSelectUnit = useCallback((unit: WeightUnit) => {
    setWeightUnit(unit);
    setUnitOpen(false);
  }, []);

  /* ─── Render helpers ───────────────────────────────────────── */

  const weightHint = weightUnit === 'KG'
    ? 'Note: Minimum chargeable weight is 0.5 kg'
    : 'Note: Minimum chargeable weight is 500 gm';

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div className="ic-breadcrumb">
        <span>Information Center</span>
        <span className="ic-breadcrumb-sep">›</span>
        <span className="ic-breadcrumb-current">Rate Calculator</span>
      </div>

      {/* Page header */}
      <div className="ic-rc-header">
        <div>
          <div className="ic-rc-title">Rate Calculator</div>
          <div className="ic-rc-subtitle">
            Estimate shipping charges before creating a shipment
          </div>
        </div>
        <div className="ic-rc-cta-row">
          <button
            type="button"
            className="ic-tbtn"
            onClick={() => {
              window.location.reload();
            }}
          >
            {RefreshIcon} Refresh
          </button>
          <button
            type="button"
            className="ic-tbtn"
            onClick={() => navigate('/info/pincode')}
          >
            {PinListIcon} Pincode Serviceability
          </button>
          <button
            type="button"
            className="ic-tbtn"
            onClick={() => navigate('/info/rate-card')}
          >
            {RateCardIcon} Rate Card
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="ic-rc-layout">
        {/* ─── LEFT: Form + Terms ─────────────────────────────── */}
        <div>
          <div className="ic-form-card">
            {/* Pincode section */}
            <div className="ic-section-label">
              Pickup and delivery pincode
            </div>

            <div className="ic-pincode-row">
              {/* Pickup */}
              <div className="ic-pincode-col">
                <div className="ic-input-label">Pickup pincode</div>
                <div className="ic-pincode-input-wrap">
                  <div className="ic-pin-icon">{PinPickupIcon}</div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pickupPin}
                    maxLength={6}
                    onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, ''))}
                    aria-label="Pickup pincode"
                  />
                  <div className="ic-pin-state">{pickupMeta?.[2] ?? ''}</div>
                </div>
                <div className="ic-pin-city">
                  {pickupMeta ? `${pickupMeta[0]}, ${pickupMeta[1]}` : ''}
                </div>
              </div>

              {/* Arrow */}
              <div className="ic-pin-arrow">{ArrowRightIcon}</div>

              {/* Drop */}
              <div className="ic-pincode-col">
                <div className="ic-input-label">Drop pincode</div>
                <div className="ic-pincode-input-wrap">
                  <div className="ic-pin-icon">{PinDropIcon}</div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dropPin}
                    maxLength={6}
                    onChange={(e) => setDropPin(e.target.value.replace(/\D/g, ''))}
                    aria-label="Drop pincode"
                  />
                  <div className="ic-pin-state">{dropMeta?.[2] ?? ''}</div>
                </div>
                <div className="ic-pin-city">
                  {dropMeta ? `${dropMeta[0]}, ${dropMeta[1]}` : ''}
                </div>
              </div>
            </div>

            <div className="ic-divider" />

            {/* Package details */}
            <div className="ic-pkg-label">Package Details</div>
            <div className="ic-pkg-grid">
              {/* Actual weight + unit */}
              <div className="ic-field">
                <div className="ic-field-label">Actual Weight</div>
                <div className="ic-weight-input-row">
                  <input
                    type="number"
                    value={actualWeight}
                    min="0.01"
                    step="0.01"
                    onChange={(e) => setActualWeight(e.target.value)}
                    aria-label="Actual weight"
                  />
                  <div
                    ref={unitSelRef}
                    className={`ic-weight-unit-sel${unitOpen ? ' open' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setUnitOpen((o) => !o);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="listbox"
                    aria-expanded={unitOpen}
                  >
                    <span>{weightUnit}</span>
                    {ChevronDown}
                    {unitOpen && (
                      <div className="ic-weight-unit-dd" role="listbox">
                        {(['KG', 'GM'] as WeightUnit[]).map((u) => (
                          <div
                            key={u}
                            role="option"
                            aria-selected={weightUnit === u}
                            className={`ic-wud-opt${weightUnit === u ? ' on' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUnit(u);
                            }}
                          >
                            {u}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ic-field-hint">{weightHint}</div>
              </div>

              {/* Dimensions */}
              <div className="ic-field">
                <div className="ic-field-label">
                  Dimensions{' '}
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink3)' }}>
                    (Optional)
                  </span>
                </div>
                <div className="ic-dim-row">
                  <div className="ic-dim-input-wrap">
                    <input
                      type="number"
                      value={dimL}
                      onChange={(e) => setDimL(e.target.value)}
                      placeholder="L"
                      aria-label="Length"
                    />
                    <div className="ic-dim-unit">CM</div>
                  </div>
                  <div className="ic-dim-x">×</div>
                  <div className="ic-dim-input-wrap">
                    <input
                      type="number"
                      value={dimB}
                      onChange={(e) => setDimB(e.target.value)}
                      placeholder="B"
                      aria-label="Breadth"
                    />
                    <div className="ic-dim-unit">CM</div>
                  </div>
                  <div className="ic-dim-x">×</div>
                  <div className="ic-dim-input-wrap">
                    <input
                      type="number"
                      value={dimH}
                      onChange={(e) => setDimH(e.target.value)}
                      placeholder="H"
                      aria-label="Height"
                    />
                    <div className="ic-dim-unit">CM</div>
                  </div>
                </div>
                <div className="ic-field-hint">
                  Note: Dimensional value should be greater than 0.5 cm
                </div>
              </div>
            </div>

            <div style={{ height: 18 }} />

            {/* Payment method + Shipment value */}
            <div className="ic-pkg-grid">
              <div className="ic-field">
                <div className="ic-field-label">Payment Method</div>
                <div className="ic-radio-row">
                  <label className={`ic-radio-opt${payment === 'cod' ? ' on' : ''}`}>
                    <input
                      type="radio"
                      name="ic-pay"
                      value="cod"
                      checked={payment === 'cod'}
                      onChange={() => setPayment('cod')}
                    />{' '}
                    Cash on Delivery
                  </label>
                  <label className={`ic-radio-opt${payment === 'prepaid' ? ' on' : ''}`}>
                    <input
                      type="radio"
                      name="ic-pay"
                      value="prepaid"
                      checked={payment === 'prepaid'}
                      onChange={() => setPayment('prepaid')}
                    />{' '}
                    Prepaid
                  </label>
                </div>
              </div>
              <div className="ic-field">
                <div className="ic-field-label">Shipment Value (₹)</div>
                <div className="ic-input-field">
                  <div className="ic-prefix">₹</div>
                  <input
                    type="number"
                    value={shipValue}
                    min="0"
                    onChange={(e) => setShipValue(e.target.value)}
                    aria-label="Shipment value"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="ic-btn-row">
              <button type="button" className="ic-btn-calc" onClick={handleCalculate}>
                Calculate
              </button>
              <button type="button" className="ic-btn-reset" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="ic-tnc-section">
            <button
              type="button"
              className={`ic-tnc-toggle${tncOpen ? ' open' : ''}`}
              onClick={() => setTncOpen((o) => !o)}
              aria-expanded={tncOpen}
            >
              {TnCIcon}
              <span>Terms &amp; Conditions</span>
              {TnCChevron}
            </button>
            {tncOpen && (
              <div className="ic-tnc-body">
                <div className="ic-tnc-title">
                  Terms &amp; Conditions — XpressBees Shipping Rate Calculator
                </div>
                <div className="ic-tnc-item">
                  <div className="ic-tnc-bullet" />
                  <div>
                    Freight charges (GST inclusive) are based on the{' '}
                    <strong>higher of dead/dry or volumetric weight</strong>.
                    RTO shipment will be charged differently from the forward
                    delivery rate.
                  </div>
                </div>
                <div className="ic-tnc-item">
                  <div className="ic-tnc-bullet" />
                  <div>
                    Fixed COD charge or COD % of the order value —{' '}
                    <strong>whichever is higher</strong> — will be taken while
                    calculating the COD fee.
                  </div>
                </div>
                <div className="ic-tnc-item">
                  <div className="ic-tnc-bullet" />
                  <div>
                    Volumetric weight is calculated as{' '}
                    <strong>L × B × H ÷ 5000</strong>. For Air courier it may
                    differ. All measurements must be in centimetres (CM).
                  </div>
                </div>
                <div className="ic-tnc-item">
                  <div className="ic-tnc-bullet" />
                  <div>
                    All rates shown are{' '}
                    <strong>inclusive of 18% GST</strong> as per the PDF rate
                    card.
                  </div>
                </div>
                <div className="ic-tnc-contact">
                  <div className="ic-tnc-contact-item">
                    {MailIcon} support@xpressbees.com
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Result panel ─────────────────────────────── */}
        <div className="ic-result-panel">
          <div className="ic-result-tabs" role="tablist" aria-label="Result direction">
            <button
              type="button"
              role="tab"
              aria-selected={resultTab === 'forward'}
              className={`ic-res-tab${resultTab === 'forward' ? ' on' : ''}`}
              onClick={() => setResultTab('forward')}
            >
              Forward
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={resultTab === 'return'}
              className={`ic-res-tab${resultTab === 'return' ? ' on' : ''}`}
              onClick={() => setResultTab('return')}
            >
              Reverse
            </button>
          </div>

          {!result ? (
            <div className="ic-result-empty">
              {EmptyStateIcon}
              <div className="ic-result-empty-title">Enter shipment details</div>
              <div className="ic-result-empty-sub">
                Fill in pincodes, package weight, and click Calculate to see rates.
              </div>
            </div>
          ) : resultTab === 'forward' ? (
            <div>
              <div className="ic-fwd-banner">
                <span style={{ color: 'var(--amber)', display: 'inline-flex' }}>
                  {ForwardStarIcon}
                </span>
                Forward: Deliveries from seller to your customer
              </div>
              <CarrierResultCard
                icon={SurfaceIcon}
                variant="surface"
                name="Surface"
                data={result.surface}
                baseLabel="Base freight"
                priceSub="incl. GST & all charges"
              />
              <CarrierResultCard
                icon={ExpressIcon}
                variant="express"
                name="Air Express"
                data={result.express}
                baseLabel="Base freight (Air)"
                priceSub="incl. GST & all charges"
              />
            </div>
          ) : (
            <div>
              <div className="ic-fwd-banner rto">
                {ReturnIcon}
                Reverse: Package returned from customer to you
              </div>
              <CarrierResultCard
                icon={SurfaceIcon}
                variant="surface"
                name="Surface RTO"
                data={result.rtoSurface}
                baseLabel="Base RTO freight"
                priceSub="incl. GST"
                showCod={false}
              />
              <CarrierResultCard
                icon={ExpressIcon}
                variant="express"
                name="Air Express RTO"
                data={result.rtoExpress}
                baseLabel="Base RTO freight (Air)"
                priceSub="incl. GST"
                showCod={false}
              />
            </div>
          )}
        </div>
      </div>

      {toastState && <Toast />}
    </div>
  );
};

export default RateCalculatorPage;
