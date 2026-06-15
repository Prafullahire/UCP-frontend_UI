import React, { useMemo, useState } from 'react';
import { type ShipmentMode, toStateCode } from '../data/shipmentModes';

export interface SelectShipmentModeViewProps {
  orderId: string;
  /** "Forward · Single" by default — override for reverse / bulk flows. */
  orderKind?: string;
  pickupCity: string;
  pickupPincode: string;
  pickupState: string;
  deliveryCity: string;
  deliveryPincode: string;
  deliveryState: string;
  orderValue: number;
  paymentMode: 'PREPAID' | 'COD';
  chargeableWeight: number;
  modes: ShipmentMode[];
  selectedModeId: string | null;
  onSelectMode: (id: string) => void;
}

type ShipmentModeTab = 'all' | 'surface' | 'air';
type ShipmentSortDir = 'asc' | 'desc';

/**
 * Courier-comparison view used by both the New Forward Order
 * "Select Shipment Mode" step and the Ship Now flow launched from the
 * Pending Orders grid. Renders an order-summary sidebar on the left and
 * a tabs + sort + table panel on the right, exactly as shown in the
 * reference design.
 */
export const SelectShipmentModeView: React.FC<SelectShipmentModeViewProps> = ({
  orderId,
  orderKind = 'Forward · Single',
  pickupCity,
  pickupPincode,
  pickupState,
  deliveryCity,
  deliveryPincode,
  deliveryState,
  orderValue,
  paymentMode,
  chargeableWeight,
  modes,
  selectedModeId,
  onSelectMode,
}) => {
  /* Tab + sort state — both purely local to this view. The tab counts
     come from the full `modes` list (so "Surface 1" stays accurate
     even when the active tab filters the visible rows down to one). */
  const [tab, setTab] = useState<ShipmentModeTab>('all');
  const [sortDir, setSortDir] = useState<ShipmentSortDir>('asc');

  const counts = useMemo(
    () => ({
      all: modes.length,
      surface: modes.filter((m) => m.mode === 'Surface').length,
      air: modes.filter((m) => m.mode === 'Air').length,
    }),
    [modes],
  );

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

  return (
    <div className="ord-nf-mode-grid">
      {/* ── Order summary sidebar (matches the reference layout) ── */}
      <aside className="ord-nf-mode-side">
        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">ORDER</div>
          <div className="ord-nf-mode-side-v">{orderId}</div>
          <div className="ord-nf-mode-side-sub">{orderKind}</div>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">ROUTE</div>
          <div className="ord-nf-mode-side-route">
            <div className="ord-nf-mode-side-loc">
              <b>{pickupCity}</b>
              <span>{pickupPincode}{pickupState && `, ${toStateCode(pickupState)}`}</span>
            </div>
            <span className="ord-nf-mode-side-line" aria-hidden="true" />
            <div className="ord-nf-mode-side-loc to">
              <b>{deliveryCity}</b>
              <span>{deliveryPincode}{deliveryState && `, ${toStateCode(deliveryState)}`}</span>
            </div>
          </div>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">ORDER VALUE</div>
          <div className="ord-nf-mode-side-v">₹{orderValue.toLocaleString('en-IN')}</div>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">PAYMENT</div>
          <span className={`ord-pay-mode ${paymentMode === 'COD' ? 'cod' : 'prepaid'}`}>
            {paymentMode}
          </span>
        </div>

        <div className="ord-nf-mode-side-sec">
          <div className="ord-nf-mode-side-k">APPLICABLE WEIGHT (IN KG)</div>
          <div className="ord-nf-mode-side-v">{chargeableWeight} kg</div>
        </div>
      </aside>

      {/* ── Right panel: tabs + sort toolbar + courier table ── */}
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
                  onClick={() => onSelectMode(m.id)}
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
                      {m.weight} K.G
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
  );
};

export default SelectShipmentModeView;
