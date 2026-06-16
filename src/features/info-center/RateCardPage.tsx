import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import {
  buildRateCardServices,
  formatPrice,
  modeDisplayLabel,
  PDF_DATA,
} from './data/rateCardData';
import type { PlanKey, RateCardMode } from './types';

/* ── Inline SVG icons ─────────────────────────────────────────── */

const PinListIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <path d="M7 1C5.34 1 4 2.34 4 4c0 2.5 3 6 3 6s3-3.5 3-6c0-1.66-1.34-3-3-3z" />
    <circle cx="7" cy="4" r="1.2" />
  </svg>
);

const CalculatorIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <rect x="2" y="1" width="10" height="12" rx="1.5" />
    <path d="M4 4h6M4 7h2M7 7h1.5M10 7h.5M4 10h2M7 10h1.5M10 10h.5" strokeLinecap="round" />
  </svg>
);

const TnCIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
    <path d="M4 3h8a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M6 7h4M6 10h2" strokeLinecap="round" />
  </svg>
);

const TnCChevron = (
  <svg
    className="ic-rc-tnc-chevron"
    viewBox="0 0 10 6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    width="12"
    height="12"
  >
    <path d="M1 1l4 4 4-4" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Constants ────────────────────────────────────────────────── */

const PLAN_OPTIONS: { value: PlanKey; label: string }[] = [
  { value: 'bronze',   label: 'XB Bronze' },
  { value: 'silver',   label: 'XB Silver' },
  { value: 'gold',     label: 'XB Gold' },
  { value: 'platinum', label: 'XB Platinum' },
];

const MODE_OPTIONS: { value: RateCardMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'air', label: 'Air' },
  { value: 'sfc', label: 'Surface' },
];

const ZONE_HEADERS = [1, 2, 3, 4, 5] as const;

const TNC_ROWS: { label: string; value: string }[] = [
  { label: 'Chargeable Weight',   value: 'Physical or Volumetric Weight — whichever is higher' },
  { label: 'Volumetric Weight',   value: 'L × B × H (cm) / 5000 — applicable for both Surface and Air' },
  { label: 'Fuel Surcharge',      value: 'NIL' },
  { label: 'GST',                 value: 'Included in all displayed prices' },
  { label: 'Liability — Forward', value: '₹2,000 or product value — whichever is lower' },
  { label: 'Liability — RVP',     value: '₹2,000 or 50% of product value — whichever is lower' },
  { label: 'COD Remittance',      value: 'Twice every week' },
  { label: 'QC Parameters',       value: 'Express Reverse with QC supports up to 3 QC parameters' },
];

/**
 * Rate Card screen for the Information Center module.
 *
 * Layout:
 *
 *   Breadcrumb
 *   Title row + controls (Plan / Mode / GST toggle) + cross-nav CTAs
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Dark plan bar                                                │
 *   │   ↳ "Active Plan" chip shown only when XB Bronze is selected │
 *   │ v3 rate-card table (Services × Zone 1..5)                    │
 *   │ COD footer row                                               │
 *   └──────────────────────────────────────────────────────────────┘
 *   Collapsible Terms & Conditions card
 */
export const RateCardPage: React.FC = () => {
  const navigate   = useNavigate();
  const toastState = useReportsStore((s) => s.toast);

  const [plan,    setPlan]    = useState<PlanKey>('gold');
  const [mode,    setMode]    = useState<RateCardMode>('all');
  const [gstIncl, setGstIncl] = useState(false);
  const [tncOpen, setTncOpen] = useState(false);

  const planData = PDF_DATA[plan];
  const services = useMemo(
    () => buildRateCardServices(planData, mode),
    [planData, mode],
  );

  /** Active-plan chip is gated to Bronze per design spec. */
  const showActivePlanChip = plan === 'bronze';

  const gstNote = gstIncl
    ? 'GST Inclusive'
    : 'Ex-GST (× 1.18 incl. GST)';

  const codNote = gstIncl
    ? 'GST-inclusive pricing shown'
    : 'Ex-GST pricing shown (× 1.18 for GST-inclusive)';

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div className="ic-breadcrumb">
        <span>Information Center</span>
        <span className="ic-breadcrumb-sep">›</span>
        <span className="ic-breadcrumb-current">Rate Card</span>
      </div>

      {/* Page header */}
      <div className="ic-rc-header">
        <div>
          <div className="ic-rc-title">Rate Card</div>
          <div className="ic-rc-subtitle">
            Pricing slabs by weight and zone — all prices inclusive of 18% GST
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
            onClick={() => navigate('/info/rate-calculator')}
          >
            {CalculatorIcon} Rate Calculator
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="ic-rc-controls">
        <label className="ic-rc-ctrl-label">Plan:</label>
        <select
          className="ic-rc-select"
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanKey)}
          aria-label="Plan"
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <label className="ic-rc-ctrl-label">Mode:</label>
        <div className="ic-mode-tabs" role="tablist" aria-label="Mode">
          {MODE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={mode === o.value}
              className={`ic-mode-tab${mode === o.value ? ' on' : ''}`}
              onClick={() => setMode(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="ic-gst-toggle">
          <label className="ic-toggle-sw">
            <input
              type="checkbox"
              checked={gstIncl}
              onChange={(e) => setGstIncl(e.target.checked)}
              aria-label="Show Rates Inclusive of GST"
            />
            <span className="ic-toggle-track" />
            <span className="ic-toggle-thumb" />
          </label>
          <span>Show Rates Inclusive of GST</span>
        </div>
      </div>

      {/* Rate Card table */}
      <div className="ic-rc-v3-wrap">
        {/* Dark plan bar */}
        <div className="ic-rc-v3-plan-bar">
          {showActivePlanChip && (
            <span className="ic-rc-v3-active-lbl">Active Plan</span>
          )}
          <span className={`ic-rc-v3-plan-name ${planData.cls}`}>
            {planData.label}
          </span>
          <span className="ic-rc-v3-dot">·</span>
          <span className="ic-rc-v3-mode">{modeDisplayLabel(mode)}</span>
          {planData.commitment && (
            <span className="ic-rc-v3-commitment">{planData.commitment}</span>
          )}
          <span className="ic-rc-v3-gst-note">
            <strong>{gstNote}</strong>
          </span>
        </div>

        {/* Table */}
        <div className="ic-rc-v3-scroll">
          <table className="ic-rc-v3-tbl">
            <thead>
              <tr>
                <th style={{ minWidth: 280 }}>Services as per weight slab.</th>
                {ZONE_HEADERS.map((n) => (
                  <th key={n} className="ic-th-zone">
                    <div className="ic-th-zone-label">Zone {n}</div>
                    <div className="ic-th-zone-sub">
                      <span className="ic-th-fwd">FWD</span>
                      <span className="ic-th-sep">|</span>
                      <span className="ic-th-rto">RTO</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => {
                const tagCls =
                  svc.modeTag === 'AIR' ? 'air' :
                  svc.modeTag === 'SFC' ? 'sfc' : 'rev';
                return (
                  <React.Fragment key={svc.name}>
                    <tr className="ic-tr-svc-hdr">
                      <td colSpan={6}>
                        <div className="ic-svc-hdr-row">
                          <span className={`ic-svc-mode-tag ${tagCls}`}>
                            {svc.modeTag}
                          </span>
                          <span>{svc.name}</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="ic-tr-data">
                      <td className="ic-td-row-lbl">{svc.baseFareDesc}</td>
                      {svc.base.map((v, idx) => (
                        <td key={idx} className="ic-td-price">
                          <PriceCell
                            value={v}
                            gstIncl={gstIncl}
                            reverseOnly={svc.isReverse}
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="ic-tr-data ic-tr-last">
                      <td className="ic-td-row-lbl">{svc.addlDesc}</td>
                      {svc.addl.map((v, idx) => (
                        <td key={idx} className="ic-td-price">
                          <PriceCell
                            value={v}
                            gstIncl={gstIncl}
                            reverseOnly={svc.isReverse}
                          />
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                );
              })}

              <tr className="ic-tr-cod">
                <td colSpan={6}>
                  COD:{' '}
                  <span className="ic-cod-highlight">
                    ₹{planData.cod_fixed} or {planData.cod_pct}% (higher applicable)
                  </span>
                  <span className="ic-cod-sep">·</span>
                  {codNote}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="ic-rc-tnc-wrap">
        <button
          type="button"
          className={`ic-rc-tnc-toggle${tncOpen ? ' open' : ''}`}
          onClick={() => setTncOpen((o) => !o)}
          aria-expanded={tncOpen}
        >
          <span className="ic-rc-tnc-toggle-lbl">
            {TnCIcon} Terms &amp; Conditions
          </span>
          {TnCChevron}
        </button>
        {tncOpen && (
          <div className="ic-rc-tnc-body">
            <div className="ic-rc-tnc-grid">
              {TNC_ROWS.map((row) => (
                <div key={row.label} className="ic-rc-tnc-item">
                  <span className="ic-rc-tnc-lbl">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toastState && <Toast />}
    </div>
  );
};

interface PriceCellProps {
  value:       number;
  gstIncl:     boolean;
  reverseOnly: boolean;
}

/**
 * One zone-column data cell. Shows `FWD | RTO` for forward services
 * and just FWD for Express Reverse rows (where RTO doesn't apply).
 */
const PriceCell: React.FC<PriceCellProps> = ({ value, gstIncl, reverseOnly }) => {
  const display = formatPrice(value, gstIncl);
  if (reverseOnly) {
    return <span className="ic-v3-fwd">₹{display}</span>;
  }
  return (
    <>
      <span className="ic-v3-fwd">₹{display}</span>
      <span className="ic-v3-sep">|</span>
      <span className="ic-v3-rto">₹{display}</span>
    </>
  );
};

export default RateCardPage;
