import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StackedBar from '../components/StackedBar';
import Legend from '../components/Legend';
import RankedRow from '../components/RankedRow';
import Insight from '../components/Insight';
import FilterBar from '../components/FilterBar';
import {
  PICKUPS,
  PICKUP_BADGE,
  NET_REVENUE,
  SHIPMENTS,
  CATEGORIES,
  CATEGORIES_TOTAL_REV,
  PRODUCTS,
  LOCATIONS,
  CUSTOMERS,
} from '../data/dashboardData';

const ORDERS_FILTERS = [
  { id: 'all',     label: 'All Time' },
  { id: 'pay',     label: 'Payment Mode' },
  { id: 'ship',    label: 'Shipment Type' },
  { id: 'channel', label: 'Channel' },
  { id: 'courier', label: 'Courier' },
];

/* Net revenue waterfall lines */
const REV_LINES = [
  { l: 'Delivered Value',  v: NET_REVENUE.del,  c: 'var(--c-ontime)',  neg: false },
  { l: 'RTO Losses',       v: NET_REVENUE.rto,  c: 'var(--c-lost)',    neg: true  },
  { l: 'Shipping Cost',    v: NET_REVENUE.ship, c: 'var(--c-transit)', neg: true  },
  { l: 'Penalties',        v: NET_REVENUE.pen,  c: 'var(--c-cod)',     neg: true  },
];

const SHIPMENT_SEGMENTS = [
  { l: 'Delivered', v: SHIPMENTS.delivered, c: 'var(--c-delivered)' },
  { l: 'In Transit', v: SHIPMENTS.transit,  c: 'var(--c-transit)'   },
  { l: 'Failed',     v: SHIPMENTS.failed,   c: 'var(--c-lost)'      },
];

const DELAY_SEGMENTS = [
  { l: 'On-time',       v: 668, c: 'var(--c-ontime)' },
  { l: '1-2 days late', v: 118, c: 'var(--am)'       },
  { l: '3+ days late',  v: 70,  c: 'var(--c-lost)'   },
];

export const OrdersTab: React.FC<{ datePreset?: string }> = ({ datePreset = 'Last Week' }) => {
  const m = datePreset === 'Last 2 Weeks' ? 2 : datePreset === 'Last Month' ? 4 : datePreset === 'Last Quarter' ? 12 : 1;
  const netRev = (NET_REVENUE.del - NET_REVENUE.rto - NET_REVENUE.ship - NET_REVENUE.pen) * m;

  return (
    <div className="d-fade">
      <FilterBar chips={ORDERS_FILTERS} />

      {/* ── Top two folds share a single 3-col grid so column edges align ──
         Row 1: [ Upcoming Pickups (span 2) ][ Net Revenue ]
         Row 2: [ Orders ][ Shipment Overview ][ Delivery Performance ]
         ─────────────────────────────────────────────────────────────── */}
      <div className="d-grid-3">
        <Card
          className="d-span-2"
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="w-title">Upcoming Pickups</div>
                <div className="w-sub">{PICKUPS.length} scheduled</div>
              </div>
              <button type="button" className="cta cta-s" style={{ margin: 0 }}>+ Create Pickup</button>
            </div>
          }
        >
          <table className="dtbl">
            <thead>
              <tr>
                <th>Manifest</th>
                <th>Date</th>
                <th>Orders</th>
                <th>Location</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {PICKUPS.map((p) => {
                const b = PICKUP_BADGE[p.st];
                return (
                  <tr key={p.id} className={p.st === 'overdue' ? 'overdue' : undefined}>
                    <td className="fw">{p.id}</td>
                    <td><Badge tone={b.cls.replace('bg-', '') as 'amber' | 'red' | 'gray'}>{b.label}</Badge></td>
                    <td className="fw">{p.o}</td>
                    <td style={{ color: 'var(--ink2)' }}>{p.loc}</td>
                    <td>
                      {p.st === 'overdue' && (
                        <button type="button" className="cta cta-p" style={{ margin: 0 }}>Reschedule</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Legend items={[
            { l: 'Scheduled', v: 2, c: 'var(--am)'     },
            { l: 'Overdue',   v: 1, c: 'var(--red)'    },
            { l: 'Upcoming',  v: 1, c: 'var(--gray-m)' },
          ]} />
        </Card>

        <Card
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div className="w-title">Net Revenue</div>
                <div className="w-sub">After deductions</div>
              </div>
              <Badge tone="green">↑ 4.2%</Badge>
            </div>
          }
        >
          <div style={{ margin: '6px 0 12px' }}>
            <StackedBar
              height={12}
              segments={[
                { l: 'Net',  v: netRev,           c: 'var(--c-ontime)'  },
                { l: 'RTO',  v: NET_REVENUE.rto * m,  c: 'var(--c-lost)'    },
                { l: 'Ship', v: NET_REVENUE.ship * m, c: 'var(--c-transit)' },
                { l: 'Pen',  v: NET_REVENUE.pen * m,  c: 'var(--c-cod)'     },
              ]}
            />
          </div>
          <div className="val-big green" style={{ fontSize: 30, marginBottom: 14 }}>
            ₹{(netRev / 100000).toFixed(2)}L
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {REV_LINES.map((r) => (
              <div className="rev-line" key={r.l}>
                <span className="rev-dot" style={{ background: r.c }} />
                <span className="rev-lbl">{r.l}</span>
                <span className={`rev-val ${r.neg ? 'rev-neg' : ''}`}>
                  {r.neg ? '− ' : '+ '}₹{((r.v * m) / 1000).toFixed(1)}K
                </span>
              </div>
            ))}
            <div className="rev-total">
              <span style={{ fontSize: 12, fontWeight: 700 }}>Net Revenue</span>
              <span className="val-sm" style={{ color: 'var(--green)' }}>
                ₹{(netRev / 1000).toFixed(1)}K
              </span>
            </div>
          </div>
          <Legend items={REV_LINES.map((r) => ({
            l: r.l, v: `₹${((r.v * m) / 1000).toFixed(0)}K`, c: r.c,
          }))} />
        </Card>

        <Card title="Orders" sub="Order health & risk profile">
          <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div className="val-label">Total Orders</div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="val-big">{(1380 * m).toLocaleString()}</span>
                <span className="stat-delta up">↑ 12%</span>
              </div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <div className="val-label">GMV</div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="val-big">₹{(11.7 * m).toFixed(1)}L</span>
                <span className="stat-delta up">↑ 8%</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div className="val-label">Today</div>
              <div className="val-mid">{Math.round(47 * m)}</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <div className="val-label">Yesterday</div>
              <div className="val-mid">{Math.round(52 * m)}</div>
            </div>
          </div>

          <div className="val-label" style={{ marginBottom: 6 }}>Payment Split</div>
          <StackedBar
            segments={[
              { l: 'Prepaid', v: 58, c: 'var(--c-prepaid)' },
              { l: 'COD',     v: 42, c: 'var(--c-cod)'     },
            ]}
          />

          <div className="val-label" style={{ marginTop: 12, marginBottom: 6 }}>Customer Mix</div>
          <StackedBar
            segments={[
              { l: 'New Customers', v: 68, c: 'var(--c-insta)' },
              { l: 'Repeat',        v: 32, c: 'var(--c-amz)'   },
            ]}
          />

          <Insight>
            <b>COD 42%</b> with <span className="warn">68% new customers</span> — expected RTO ~5.2%. Push prepaid incentive.
          </Insight>

          <Legend items={[
            { l: 'Prepaid', v: '58%', c: 'var(--c-prepaid)' },
            { l: 'COD',     v: '42%', c: 'var(--c-cod)'     },
            { l: 'New',     v: '68%', c: 'var(--c-insta)'   },
            { l: 'Repeat',  v: '32%', c: 'var(--c-amz)'     },
          ]} />
        </Card>

        <Card title="Shipment Overview" sub="Pipeline health">
          <div className="val-label">Delivery Rate</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 14 }}>
            <span className="val-big" style={{ color: 'var(--green)', fontSize: 32 }}>85.4%</span>
            <span className="stat-delta down">↓ 3.2%</span>
          </div>

          <div className="val-label" style={{ marginBottom: 6 }}>
            Pipeline ({(SHIPMENTS.total * m).toLocaleString()} shipments)
          </div>
          <StackedBar height={40} segments={SHIPMENT_SEGMENTS.map(s => ({...s, v: s.v * m}))} />

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div className="stat-tile good">
              <div className="val-label">Delivered</div>
              <div className="val-mid" style={{ color: 'var(--green)' }}>{SHIPMENTS.delivered * m}</div>
            </div>
            <div className="stat-tile">
              <div className="val-label">In Transit</div>
              <div className="val-mid">{SHIPMENTS.transit * m}</div>
            </div>
            <div className="stat-tile bad">
              <div className="val-label">Failed</div>
              <div className="val-mid" style={{ color: 'var(--red)' }}>{SHIPMENTS.failed * m}</div>
            </div>
          </div>

          <Insight>
            <b>60 shipments in transit 6+ days</b> — high NDR risk. Proactive outreach recommended.
          </Insight>

          <Legend items={[
            { l: 'Delivered', v: `${856 * m}`, c: 'var(--c-delivered)' },
            { l: 'Transit',   v: `${318 * m}`, c: 'var(--c-transit)'   },
            { l: 'Failed',    v: `${146 * m}`, c: 'var(--c-lost)'      },
          ]} />
        </Card>

        <Card title="Delivery Performance" sub="Delivery quality">
          <div className="val-label">On-Time Delivery</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="val-big" style={{ fontSize: 32 }}>78%</span>
            <span className="stat-delta down">↓ 4%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12, color: 'var(--ink2)' }}>
            <span style={{ fontWeight: 600 }}>First Attempt:</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--ink)' }}>68%</span>
            <span className="stat-delta down">↓ 2%</span>
          </div>

          <div className="val-label" style={{ marginBottom: 6 }}>Delay Severity ({188 * m} late)</div>
          <StackedBar height={40} segments={DELAY_SEGMENTS.map(s => ({...s, v: s.v * m}))} />

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div className="stat-tile good">
              <div className="val-label">On-time</div>
              <div className="val-mid" style={{ color: 'var(--green)' }}>{668 * m}</div>
            </div>
            <div className="stat-tile warn">
              <div className="val-label">Mild</div>
              <div className="val-mid" style={{ color: 'var(--amber)' }}>{118 * m}</div>
            </div>
            <div className="stat-tile bad">
              <div className="val-label">Critical</div>
              <div className="val-mid" style={{ color: 'var(--red)' }}>{70 * m}</div>
            </div>
          </div>

          <Insight>
            <b>East zone via Xpressbees: 38% late</b> vs 12% avg.{' '}
            <span className="bad">{70 * m} deliveries 3+ days late</span> = NDR candidates.
          </Insight>

          <Legend items={[
            { l: 'On-time',  v: '78%', c: 'var(--c-ontime)' },
            { l: 'Mild',     v: '14%', c: 'var(--am)'       },
            { l: 'Critical', v: '8%',  c: 'var(--c-lost)'   },
          ]} />
        </Card>
      </div>

      {/* ── Row 3 — Popular Categories | Popular Products (2-col) ─────── */}
      <div className="row-2">
        <Card title="Popular Product Categories" sub="Revenue by category">
          {CATEGORIES.map((c, i) => (
            <RankedRow
              key={c.n}
              name={c.n}
              value={c.r * m}
              max={CATEGORIES[0].r * m}
              color={c.c}
              topBadge={i === 0 ? <Badge tone="green">Top</Badge> : undefined}
              meta={
                <>
                  <span className="m-dim">{c.o * m} ord</span>
                  <span className="m-val">₹{((c.r * m) / 1000).toFixed(0)}K</span>
                </>
              }
            />
          ))}
          <Legend items={CATEGORIES.map((c) => ({
            l: c.n,
            v: `${Math.round((c.r / CATEGORIES_TOTAL_REV) * 100)}%`,
            c: c.c,
          }))} />
        </Card>

        <Card title="Popular Products" sub="Top sellers">
          {PRODUCTS.map((p) => (
            <RankedRow
              key={p.n}
              name={p.n}
              value={p.r * m}
              max={PRODUCTS[0].r * m}
              color="var(--c-insta)"
              meta={
                <>
                  <span className="m-dim">{p.o * m} sold</span>
                  <span className="m-val">₹{((p.r * m) / 1000).toFixed(0)}K</span>
                </>
              }
            />
          ))}
          <Legend items={[{ l: 'Top 3', v: '28.1% of revenue', c: 'var(--orange)' }]} />
        </Card>
      </div>

      {/* ── Row 4 — Popular Locations | Top Customers (2-col) ─────────── */}
      <div className="row-2">
        <Card title="Popular Locations / Cities" sub="Demand concentration">
          {LOCATIONS.map((l) => (
            <RankedRow
              key={l.s}
              name={l.s}
              value={l.p}
              max={LOCATIONS[0].p}
              color="var(--orange)"
              meta={
                <>
                  <span className="m-dim">{l.o * m} ord</span>
                  <span className="m-val">₹{(l.r * m).toLocaleString()}</span>
                  <span className="m-val" style={{ color: 'var(--ink3)', minWidth: 42 }}>{l.p}%</span>
                </>
              }
            />
          ))}
          <Legend items={[{ l: 'Top', v: 'UP (45.9%)', c: 'var(--orange)' }]} />
        </Card>

        <Card title="Top Customers" sub="By lifetime revenue">
          {CUSTOMERS.map((c) => (
            <RankedRow
              key={c.n}
              name={c.n}
              value={c.r * m}
              max={CUSTOMERS[0].r * m}
              color="var(--c-amz)"
              meta={
                <>
                  <span className="m-dim">{c.o * m} ord</span>
                  <span className="m-val">₹{((c.r * m) / 1000).toFixed(1)}K</span>
                </>
              }
            />
          ))}
          <Legend items={[{ l: 'Top 3', v: '₹59.6K', c: 'var(--orange)' }]} />
        </Card>
      </div>
    </div>
  );
};

export default OrdersTab;
