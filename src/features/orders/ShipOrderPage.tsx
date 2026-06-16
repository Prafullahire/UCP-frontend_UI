import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Order } from './types';
import { api, ordersApi } from '../../services/ordersApi';
import { useReportsStore } from '../../store/useReportsStore';
import Toast from '../../components/ui/Toast';

const ShipIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17h4V5H2v12h3M20 17H8m12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    <path d="M14 8h4l4 5v4h-2" />
  </svg>
);

interface Courier {
  courier_id: string;
  name: string;
  total_charges: number;
  expected_delivery: string;
  rating: number;
}

interface ShipmentMode {
  id: string;
  courier: string;
  mode: 'Surface' | 'Air' | '';
  weight: number;
  rate: number;
}

type ShipmentModeTab  = 'all' | 'surface' | 'air';
type ShipmentSortDir  = 'asc' | 'desc';

export const ShipOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useReportsStore((s) => s.showToast);
  const toast = useReportsStore((s) => s.toast);

  const order = location.state?.order as Order | undefined;

  const [modes, setModes] = useState<ShipmentMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedModeId, setSelectedModeId] = useState<string | null>('auto');
  const [shipping, setShipping] = useState(false);
  const [step, setStep] = useState<'select-mode' | 'awb-assigned'>('select-mode');
  
  const [tab, setTab] = useState<ShipmentModeTab>('all');
  const [sortDir, setSortDir] = useState<ShipmentSortDir>('asc');

  // Parse order weight
  const weightMatches = order?.package?.deadWt.match(/[\d.]+/);
  const weight = weightMatches ? parseFloat(weightMatches[0]) : 1;

  useEffect(() => {
    if (!order) {
      setError('Order details not found. Please navigate from the orders page.');
      setLoading(false);
      return;
    }

    const fetchCouriers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const dimsMatches = order.package.dims.match(/\d+/g);
        const length = dimsMatches ? parseInt(dimsMatches[0]) : 10;
        const breadth = dimsMatches && dimsMatches.length > 1 ? parseInt(dimsMatches[1]) : 10;
        const height = dimsMatches && dimsMatches.length > 2 ? parseInt(dimsMatches[2]) : 10;

        const originPin = order.pickup.pin === 'N/A' || !order.pickup.pin ? '400001' : order.pickup.pin;
        const destPin = order.customer.pin === 'N/A' || !order.customer.pin ? '411001' : order.customer.pin;

        const requestData = {
          origin: originPin,
          destination: destPin,
          payment_type: order.payment.mode.toLowerCase(),
          order_amount: order.payment.amount || 100,
          weight: weight,
          length: length,
          breadth: breadth,
          height: height,
        };

        const res = await api.post('/pincode/shipmentRateServicibility', requestData);
        if (res.data?.data) {
          const apiCouriers = res.data.data;
          const mappedModes = apiCouriers.map((c: any): ShipmentMode => {
             const isAir = c.name.toLowerCase().includes('air') || c.expected_delivery?.toLowerCase().includes('1-2');
             return {
                id: c.courier_id,
                courier: c.name,
                mode: isAir ? 'Air' : 'Surface',
                weight: weight,
                rate: c.total_charges
             };
          });
          setModes(mappedModes);
        } else {
          setError('No couriers available for this route.');
        }
      } catch (err: any) {
        if (err.response?.data?.code === 404) {
          setError('Destination Pincode is Not Serviceable');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch couriers');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCouriers();
  }, [order, weight]);

  const handleConfirm = async () => {
    if (!order || !selectedModeId) return;
    try {
      setShipping(true);
      showToast(`Shipping order ${order.id}...`);
      const success = await ordersApi.shipOrder(order.id, selectedModeId);
      if (success) {
        showToast(`Order ${order.id} successfully shipped!`);
        setStep('awb-assigned');
      } else {
        showToast(`Failed to ship order ${order.id}. Please try again.`);
      }
    } catch (err) {
      console.error(err);
      showToast(`An error occurred while shipping.`);
    } finally {
      setShipping(false);
    }
  };

  const counts = useMemo(() => ({
    all: modes.length,
    surface: modes.filter((m) => m.mode === 'Surface').length,
    air: modes.filter((m) => m.mode === 'Air').length,
  }), [modes]);

  const visibleModes = useMemo(() => {
    const filtered =
      tab === 'surface' ? modes.filter((m) => m.mode === 'Surface') :
      tab === 'air'     ? modes.filter((m) => m.mode === 'Air')     :
      modes;
    return filtered.slice().sort((a, b) =>
      sortDir === 'asc' ? a.rate - b.rate : b.rate - a.rate,
    );
  }, [modes, tab, sortDir]);

  const TABS: Array<{ id: ShipmentModeTab; label: string; count: number }> = [
    { id: 'all',     label: 'All',     count: counts.all     },
    { id: 'surface', label: 'Surface', count: counts.surface },
    { id: 'air',     label: 'Air',     count: counts.air     },
  ];

  if (!order) {
    return (
      <div className="page" style={{ padding: '2rem' }}>
        <div className="ord-ph">
          <div className="ord-ph-title">Ship Order</div>
          <button className="ord-btn-sec" onClick={() => navigate('/orders')}>Go Back</button>
        </div>
        <div style={{ color: '#c62828', padding: '1rem', background: '#ffebee', borderRadius: '4px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="ord-ph">
        <div className="ord-ph-l">
          <div className="ord-ph-title">Ship Order {order.id}</div>
        </div>
        {step === 'select-mode' && (
          <div className="ord-ph-r">
            <button type="button" className="ord-btn-sec" onClick={() => navigate(-1)} disabled={shipping}>
              Cancel
            </button>
            <button type="button" className="ord-cta ord-cta-p" onClick={handleConfirm} disabled={loading || !!error || shipping || !selectedModeId}>
              <ShipIcon /> {shipping ? 'Shipping...' : 'Ship Now'}
            </button>
          </div>
        )}
      </div>

      {step === 'select-mode' && (
        <>
          {loading ? (
             <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
               <div className="spinner" style={{ marginBottom: '1rem' }}></div>
               Loading courier rates...
             </div>
          ) : error ? (
             <div style={{ padding: '1.5rem', background: '#ffebee', color: '#c62828', borderRadius: '6px', textAlign: 'center', margin: '2rem' }}>
               {error}
               <div style={{ marginTop: '1rem' }}>
                 <button className="ord-btn-sec" onClick={() => navigate(-1)}>Go Back</button>
               </div>
             </div>
          ) : (
            <div className="ord-nf-mode-grid">
              <aside className="ord-nf-mode-side">
                <div className="ord-nf-mode-side-sec">
                  <div className="ord-nf-mode-side-k">ORDER</div>
                  <div className="ord-nf-mode-side-v">{order.id}</div>
                  <div className="ord-nf-mode-side-sub">Forward · Single</div>
                </div>

                <div className="ord-nf-mode-side-sec">
                  <div className="ord-nf-mode-side-k">ROUTE</div>
                  <div className="ord-nf-mode-side-route">
                    <div className="ord-nf-mode-side-loc">
                      <b>{order.pickup.city}</b>
                      <span>{order.pickup.pin}</span>
                    </div>
                    <span className="ord-nf-mode-side-line" aria-hidden="true" />
                    <div className="ord-nf-mode-side-loc to">
                      <b>{order.delivery.city}</b>
                      <span>{order.delivery.pin}</span>
                    </div>
                  </div>
                </div>

                <div className="ord-nf-mode-side-sec">
                  <div className="ord-nf-mode-side-k">ORDER VALUE</div>
                  <div className="ord-nf-mode-side-v">₹{order.payment.amount.toLocaleString('en-IN')}</div>
                </div>

                <div className="ord-nf-mode-side-sec">
                  <div className="ord-nf-mode-side-k">PAYMENT</div>
                  <span className={`ord-pay-mode ${order.payment.mode === 'COD' ? 'cod' : 'prepaid'}`}>
                    {order.payment.mode}
                  </span>
                </div>

                <div className="ord-nf-mode-side-sec">
                  <div className="ord-nf-mode-side-k">APPLICABLE WEIGHT (IN KG)</div>
                  <div className="ord-nf-mode-side-v">{weight.toFixed(2)} kg</div>
                </div>
              </aside>

              <main className="ord-nf-mode-main">
                <div className="ord-nf-mode-toolbar">
                  <div className="ord-nf-mode-tabs" role="tablist" aria-label="Shipment mode filter">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        className={`ord-nf-mode-tab ${tab === t.id ? 'on' : ''}`}
                        onClick={() => setTab(t.id)}
                      >
                        {t.label}
                        <span className="ord-nf-mode-tab-count">{t.count}</span>
                      </button>
                    ))}
                  </div>

                  <div className="ord-nf-mode-toolbar-r">
                    <span className="ord-nf-mode-count-lbl">
                      <b>{visibleModes.length}</b> services found
                    </span>
                    <label className="ord-nf-mode-sort">
                      <select
                        value={sortDir}
                        onChange={(e) => setSortDir(e.target.value as ShipmentSortDir)}
                        aria-label="Sort by price"
                      >
                        <option value="asc">Price: Low - High</option>
                        <option value="desc">Price: High - Low</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="ord-nf-mode-tbl" role="table">
                  <div className="ord-nf-mode-tbl-hdr" role="row">
                    <span />
                    <span role="columnheader">COURIER SERVICE</span>
                    <span role="columnheader" className="num">WEIGHT</span>
                    <span role="columnheader" className="num">CHARGES</span>
                  </div>

                  <button
                    type="button"
                    role="row"
                    aria-pressed={selectedModeId === 'auto'}
                    className={`ord-nf-mode-tbl-row ${selectedModeId === 'auto' ? 'on' : ''}`}
                    onClick={() => setSelectedModeId('auto')}
                  >
                    <span className={`ord-cb ${selectedModeId === 'auto' ? 'on' : ''}`} aria-hidden="true" />
                    <div className="ord-nf-mode-tbl-courier">
                      <div className="ord-nf-mode-tbl-name">Auto Allocate</div>
                      <span className="ord-nf-mode-tag">System will automatically assign the best courier based on rules</span>
                    </div>
                    <div className="ord-nf-mode-tbl-wt"><span className="ord-nf-mode-wt-pill">{weight.toFixed(2)} K.G</span></div>
                    <div className="ord-nf-mode-tbl-rate">Best Rate</div>
                  </button>

                  {visibleModes.length === 0 ? (
                    <div className="ord-nf-mode-tbl-empty">
                      No {tab === 'all' ? '' : tab} services available for this route.
                    </div>
                  ) : (
                    visibleModes.map((m) => {
                      const isOn = m.id === selectedModeId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          role="row"
                          aria-pressed={isOn}
                          className={`ord-nf-mode-tbl-row ${isOn ? 'on' : ''}`}
                          onClick={() => setSelectedModeId(m.id)}
                        >
                          <span
                            className={`ord-cb ${isOn ? 'on' : ''}`}
                            aria-hidden="true"
                          />
                          <div className="ord-nf-mode-tbl-courier">
                            <div className="ord-nf-mode-tbl-name">{m.courier}</div>
                            {m.mode && (
                              <span className={`ord-nf-mode-tag ${m.mode.toLowerCase()}`}>
                                {m.mode.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ord-nf-mode-tbl-wt">
                            <span className="ord-nf-mode-wt-pill">
                              {m.weight.toFixed(2)} K.G
                            </span>
                          </div>
                          <div className="ord-nf-mode-tbl-rate">
                            ₹{m.rate.toLocaleString('en-IN')}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </main>
            </div>
          )}
        </>
      )}

      {step === 'awb-assigned' && (
        <div className="ord-nf-state">
          <div className="ord-nf-state-card">
            <div className="ord-nf-state-ico ok" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="ord-nf-state-title">AWB Assigned</div>
            <div className="ord-nf-state-sub">
              Order <b>{order.id}</b> is ready to ship.{' '}
              {selectedModeId !== 'auto' && modes.find(m => m.id === selectedModeId) ? (
                <>{modes.find(m => m.id === selectedModeId)!.courier} will pick it up next.</>
              ) : null}
            </div>

            <div className="ord-nf-awb">
              <div className="ord-nf-awb-l">
                <div className="ord-nf-state-k">AWB Number</div>
                <div className="ord-nf-awb-num">AWB{Math.floor(1000000 + Math.random() * 9000000)}</div>
                {selectedModeId !== 'auto' && modes.find(m => m.id === selectedModeId) && (() => {
                  const m = modes.find(m => m.id === selectedModeId)!;
                  return (
                    <div className="ord-nf-awb-courier">
                      {m.courier}
                      {m.mode && ` · ${m.mode}`}
                      {' · '}{m.weight} kg slab
                    </div>
                  );
                })()}
              </div>
              <span className="ord-status new ord-nf-awb-pill">Ready to Ship</span>
            </div>

            <div className="ord-nf-state-grid">
              <div>
                <div className="ord-nf-state-k">Order ID</div>
                <div className="ord-nf-state-v mono">{order.id}</div>
              </div>
              <div>
                <div className="ord-nf-state-k">Customer</div>
                <div className="ord-nf-state-v">{order.customer.name} · {order.delivery.city}</div>
              </div>
              <div>
                <div className="ord-nf-state-k">Pickup From</div>
                <div className="ord-nf-state-v">{order.pickup.city}</div>
              </div>
              <div>
                <div className="ord-nf-state-k">Chargeable Weight</div>
                <div className="ord-nf-state-v mono">{weight.toFixed(2)} kg</div>
              </div>
              <div>
                <div className="ord-nf-state-k">Order Value</div>
                <div className="ord-nf-state-v mono">
                  ₹{order.payment.amount.toLocaleString('en-IN')}{' '}
                  <span className={`ord-pay-mode ${order.payment.mode === 'COD' ? 'cod' : 'prepaid'}`} style={{ marginLeft: 6 }}>
                    {order.payment.mode}
                  </span>
                </div>
              </div>
              {selectedModeId !== 'auto' && modes.find(m => m.id === selectedModeId) && (
                <div>
                  <div className="ord-nf-state-k">Shipping Rate</div>
                  <div className="ord-nf-state-v mono">₹{modes.find(m => m.id === selectedModeId)!.rate.toLocaleString('en-IN')}</div>
                </div>
              )}
            </div>

            <div className="ord-nf-state-ft">
              <button type="button" className="ord-cta ord-cta-s" onClick={() => navigate('/orders/new-forward')}>
                + Create Another Order
              </button>
              <button type="button" className="ord-cta ord-cta-s" onClick={() => showToast('Label download started')}>
                🖨 Print Label
              </button>
              <button type="button" className="ord-cta ord-cta-p" onClick={() => navigate('/orders')}>
                View All Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast />}
    </div>
  );
};

export default ShipOrderPage;
