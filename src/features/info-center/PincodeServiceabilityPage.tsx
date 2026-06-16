import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { useReportsStore } from '../../store/useReportsStore';
import { pincodeApi } from '../../services/pincodeApi';
import { pinInfo } from './data/rateCalculatorData';
import type { PsResult } from './types';

/* ── Inline SVG icons ─────────────────────────────────────────── */

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

const CalculatorIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <rect x="2" y="1" width="10" height="12" rx="1.5" />
    <path d="M4 4h6M4 7h2M7 7h1.5M10 7h.5M4 10h2M7 10h1.5M10 10h.5" strokeLinecap="round" />
  </svg>
);

const RateCardIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <rect x="1" y="1" width="12" height="12" rx="2" />
    <path d="M3 5h8M3 8h5" strokeLinecap="round" />
  </svg>
);

const CheckIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" width="12" height="12">
    <path d="M2 7l3.5 3.5L12 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TickIcon = (
  <svg viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="2" width="10" height="10">
    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = (
  <svg viewBox="0 0 12 12" fill="none" stroke="var(--ink3)" strokeWidth="1.8" width="10" height="10">
    <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
    <path d="M12 6A5 5 0 1 0 11 9.2" strokeLinecap="round" />
    <path d="M12 1.5v4H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EmptyStateIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="52" height="52">
    <path d="M12 2C8.68 2 6 4.68 6 8c0 5 6 12 6 12s6-7 6-12c0-3.32-2.68-6-6-6z" />
    <circle cx="12" cy="8" r="2.5" />
  </svg>
);

/**
 * Pincode Serviceability screen for the Information Center module.
 *
 * Layout:
 *
 *   Breadcrumb
 *   Title row + header CTAs:
 *     • Rate Calculator (secondary, navigates)
 *     • Rate Card        (secondary, navigates)
 *     • Check Active Pincodes (primary, triggers serviceability check)
 *   ┌────────────────────┬──────────────────────────────────────────┐
 *   │ Form card          │ Result panel                             │
 *   │  • Origin pincode  │  • Empty state OR                        │
 *   │  • Dest pincode    │    title + serviceable / unserviceable   │
 *   │  • Check button    │    chip + zone strip + service rows      │
 *   └────────────────────┴──────────────────────────────────────────┘
 */
export const PincodeServiceabilityPage: React.FC = () => {
  const navigate   = useNavigate();
  const showToast  = useReportsStore((s) => s.showToast);
  const toastState = useReportsStore((s) => s.toast);

  const [origin, setOrigin] = useState('');
  const [dest,   setDest]   = useState('');
  const [result, setResult] = useState<PsResult | null>(null);

  /* ─── Derived helpers — show preview city info as user types ── */
  const originPreview = useMemo(() => pinInfo(origin.trim()), [origin]);
  const destPreview   = useMemo(() => pinInfo(dest.trim()),   [dest]);

  /* ─── Handlers ────────────────────────────────────────────── */

  const handleCheck = useCallback(async () => {
    const pu = origin.trim();
    const dr = dest.trim();
    if (pu.length !== 6 || Number.isNaN(Number(pu))) {
      showToast('Please enter a valid 6-digit origin pincode');
      return;
    }
    if (dr.length !== 6 || Number.isNaN(Number(dr))) {
      showToast('Please enter a valid 6-digit destination pincode');
      return;
    }
    const next = await pincodeApi.checkServiceability(pu, dr);
    if (!next) {
      showToast('Could not check serviceability');
      return;
    }
    setResult(next);
    showToast('Serviceability checked');
  }, [origin, dest, showToast]);

  const handleDownloadCSV = useCallback(async () => {
    try {
      showToast('Preparing download, please wait...');
      const records = await pincodeApi.downloadActivePincodes();
      
      if (!records || records.length === 0) {
        showToast('No active pincodes found to download');
        return;
      }
      
      // Extract headers from the first record
      const headers = Object.keys(records[0]);
      let csvContent = headers.join(',') + '\n';
      
      // Add all rows
      records.forEach((record) => {
        const row = headers.map(header => {
          let val = record[header] === null || record[header] === undefined ? '' : String(record[header]);
          // Escape quotes and wrap in quotes if contains comma
          if (val.includes(',') || val.includes('"')) {
             val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Active_Pincodes_List.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Download complete');
    } catch (err) {
      showToast('Failed to download active pincodes');
    }
  }, [showToast]);

  /* ─── Render ──────────────────────────────────────────────── */

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div className="ic-breadcrumb">
        <span>Information Center</span>
        <span className="ic-breadcrumb-sep">›</span>
        <span className="ic-breadcrumb-current">Pincode Serviceability</span>
      </div>

      {/* Page header */}
      <div className="ic-rc-header">
        <div>
          <div className="ic-rc-title">Pincode Serviceability</div>
          <div className="ic-rc-subtitle">
            Check delivery serviceability for any pincode across India
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
            onClick={() => navigate('/info/rate-calculator')}
          >
            {CalculatorIcon} Rate Calculator
          </button>
          <button
            type="button"
            className="ic-tbtn"
            onClick={() => navigate('/info/rate-card')}
          >
            {RateCardIcon} Rate Card
          </button>
          
          <button
            type="button"
            onClick={handleDownloadCSV}
            style={{
              backgroundColor: '#1a202c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Active Pincodes
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="ic-ps-layout">
        {/* LEFT: Form */}
        <div className="ic-ps-form">
          <div className="ic-field">
            <div className="ic-field-label" style={{ marginBottom: 8 }}>
              Origin Pincode
            </div>
            <div className="ic-pincode-input-wrap">
              <div className="ic-pin-icon">{PinPickupIcon}</div>
              <input
                type="text"
                inputMode="numeric"
                value={origin}
                maxLength={6}
                placeholder="e.g. 411006"
                onChange={(e) => setOrigin(e.target.value.replace(/\D/g, ''))}
                aria-label="Origin pincode"
              />
              <div className="ic-pin-state">{originPreview?.[2] ?? ''}</div>
            </div>
            <div className="ic-pin-city">
              {originPreview ? `${originPreview[0]}, ${originPreview[1]}` : ''}
            </div>
          </div>

          <div className="ic-field" style={{ marginTop: 16 }}>
            <div className="ic-field-label" style={{ marginBottom: 8 }}>
              Destination Pincode
            </div>
            <div className="ic-pincode-input-wrap">
              <div className="ic-pin-icon">{PinDropIcon}</div>
              <input
                type="text"
                inputMode="numeric"
                value={dest}
                maxLength={6}
                placeholder="e.g. 560025"
                onChange={(e) => setDest(e.target.value.replace(/\D/g, ''))}
                aria-label="Destination pincode"
              />
              <div className="ic-pin-state">{destPreview?.[2] ?? ''}</div>
            </div>
            <div className="ic-pin-city">
              {destPreview ? `${destPreview[0]}, ${destPreview[1]}` : ''}
            </div>
          </div>

          <button
            type="button"
            className="ic-btn-calc ic-ps-check-btn"
            onClick={handleCheck}
          >
            {CheckIcon} Check Serviceability
          </button>
        </div>

        {/* RIGHT: Result panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="ic-ps-result" style={{ backgroundColor: 'transparent', padding: 0, border: 'none', gap: '16px', display: 'flex', flexDirection: 'row' }}>
          {!result ? (
            <div className="ic-ps-empty" style={{ width: '100%', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
              {EmptyStateIcon}
              <div className="ic-result-empty-title">
                Enter pincodes to check serviceability
              </div>
              <div className="ic-result-empty-sub">
                Enter origin and destination pincodes to see available
                shipping services, estimated delivery times, and COD availability.
              </div>
            </div>
          ) : (
            <>
              {/* Origin Column */}
              <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {PinPickupIcon} {result.origin}
                  </div>
                  <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px', textTransform: 'uppercase' }}>
                    {result.originInfo ? `${result.originInfo[0]}, ${result.originInfo[1]}` : 'Unknown Location'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', fontSize: '12px', fontWeight: '500' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> Reverse</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> COD</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> Prepaid</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '400px' }}>
                  {(result as any).originCouriers?.length > 0 ? (result as any).originCouriers.map((c: any) => (
                    <div key={c.courier_id} style={{ padding: '12px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '8px' }}>{c.courier_name}</div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#4a5568' }}>
                         {c.cod === 'Y' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> COD</span>}
                         {c.prepaid === 'Y' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> Prepaid</span>}
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>No couriers found</div>
                  )}
                </div>
              </div>

              {/* Destination Column */}
              <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {PinDropIcon} {result.destination}
                  </div>
                  <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px', textTransform: 'uppercase' }}>
                    {result.destInfo ? `${result.destInfo[0]}, ${result.destInfo[1]}` : 'Unknown Location'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', fontSize: '12px', fontWeight: '500' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> Reverse</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> COD</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> Prepaid</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '400px' }}>
                  {(result as any).destCouriers?.length > 0 ? (result as any).destCouriers.map((c: any) => (
                    <div key={c.courier_id} style={{ padding: '12px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '8px' }}>{c.courier_name}</div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#4a5568' }}>
                         {c.cod === 'Y' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> COD</span>}
                         {c.prepaid === 'Y' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#48BB78' }}>●</span> Prepaid</span>}
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>No couriers found</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {toastState && <Toast />}
    </div>
  );
};

export default PincodeServiceabilityPage;
