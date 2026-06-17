import React, { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import StackedBar from '../components/StackedBar';
import RankedRow from '../components/RankedRow';
import Legend from '../components/Legend';
import Insight from '../components/Insight';
import FilterBar from '../components/FilterBar';
import GroupedBars from '../components/GroupedBars';
import {
  RTO_TOTAL,
  RTO_RATE,
  RTO_LOSS,
  RTO_REASONS,
  RTO_PINCODES,
  RTO_TREND,
  RTO_TREND_MAX,
  RTO_STATUS,
  RTO_STATUS_MAX,
} from '../data/dashboardData';

const RTO_FILTERS = [
  { id: 'all',     label: 'All Time' },
  { id: 'paymode', label: 'COD / Prepaid' },
  { id: 'reason',  label: 'RTO Reason' },
  { id: 'zone',    label: 'Zone / State' },
  { id: 'value',   label: 'Order Value', dividerBefore: true },
  { id: 'courier', label: 'Courier' },
];

const RTO_LOSS_LINES = [
  { l: 'Product value lost',       v: '−₹38.4K', c: 'var(--c-lost)'    },
  { l: 'Forward shipping wasted',  v: '−₹8.6K',  c: 'var(--c-transit)' },
  { l: 'Return shipping cost',     v: '−₹5.8K',  c: 'var(--c-cod)'     },
  { l: 'Packaging waste',          v: '−₹1.4K',  c: 'var(--c-insta)'   },
];

/** Recovery & action plan steps — fills the previously-empty card slot
 *  in the original HTML's last fold so the 2-column row is visually balanced. */
const RECOVERY_ACTIONS = [
  { step: '1', title: 'Block COD for top-6 pincodes',  desc: 'Saves est. ₹42K/month at current refusal rate.', tone: 'red' as const },
  { step: '2', title: 'Add address confirmation SMS',  desc: 'Reduces "Address Issue" returns by ~30%.',       tone: 'amber' as const },
  { step: '3', title: 'Push prepaid via 5% discount',  desc: 'Cuts new-customer COD share from 42% → 30%.',    tone: 'orange' as const },
  { step: '4', title: 'Auto-flag 3rd NDR for RTO',     desc: 'Stops futile reattempts — 0% delivery rate.',    tone: 'gray' as const },
];

export const RtoTab: React.FC<{ datePreset?: string }> = ({ datePreset = 'Last Week' }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const getFilterMultiplier = (filterId: string) => {
    if (filterId === 'all') return 1;
    const hash = filterId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 0.4 + (hash % 50) / 100;
  };

  const dateM = datePreset === 'Last 2 Weeks' ? 2 : datePreset === 'Last Month' ? 4 : datePreset === 'Last Quarter' ? 12 : 1;
  const filterM = getFilterMultiplier(activeFilter);
  const m = dateM * filterM;

  /* Single-bar trend grouped chart */
  const trendSlots = RTO_TREND.map((tm) => ({
    label: tm.l,
    bars: [{ color: 'var(--c-lost)', heightPx: ((tm.v * m) / (RTO_TREND_MAX * m)) * 100, width: 28 }],
  }));

  /* RTO Status grouped chart (Initiated / Delivered / Undelivered per month) */
  const statusSlots = RTO_STATUS.map((sm) => ({
    label: `${sm.l} 2026`,
    bars: [
      { color: 'var(--c-delivered)', heightPx: ((sm.init * m)  / (RTO_STATUS_MAX * m)) * 100, width: 16 },
      { color: 'var(--c-ontime)',    heightPx: ((sm.del * m)   / (RTO_STATUS_MAX * m)) * 100, width: 16 },
      { color: 'var(--c-lost)',      heightPx: ((sm.undel * m) / (RTO_STATUS_MAX * m)) * 100, width: 16 },
    ],
  }));

  return (
    <div className="d-fade">
      <FilterBar chips={RTO_FILTERS} onFilterChange={setActiveFilter} />

      {/* ── Fold 1 — Overview | Revenue Impact | Top Pincodes (3-col) ── */}
      <div className="row-3">
        <Card title="RTO Overview" sub="Return-to-origin summary">
          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            <div>
              <div className="val-label">Total RTOs</div>
              <div className="val-big" style={{ color: 'var(--red)' }}>{RTO_TOTAL * m}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
              <div className="val-label">RTO Rate</div>
              <div className="val-big" style={{ color: 'var(--red)' }}>{RTO_RATE}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
              <div className="val-label">RTO Loss</div>
              <div className="val-big" style={{ color: 'var(--red)' }}>{RTO_LOSS}</div>
            </div>
          </div>
          <StackedBar height={24} withTooltip={false} segments={RTO_REASONS.map(s => ({...s, v: s.v * m}))} />
          <Legend items={RTO_REASONS.map((s) => ({
            l: s.l, v: String(s.v * m), c: s.c, p: `${Math.round(((s.v * m) / (RTO_TOTAL * m)) * 100)}%`,
          }))} />
        </Card>

        <Card title="RTO Revenue Impact" sub="Where the money goes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RTO_LOSS_LINES.map((r) => {
              const numVal = parseFloat(r.v.replace(/[^0-9.]/g, ''));
              return (
              <div className="rev-line" key={r.l}>
                <span className="rev-dot" style={{ background: r.c }} />
                <span className="rev-lbl">{r.l}</span>
                <span className="rev-val rev-neg">−₹{(numVal * m).toFixed(1)}K</span>
              </div>
            )})}
            <div className="rev-total">
              <span style={{ fontSize: 12, fontWeight: 700 }}>Total Loss</span>
              <span className="val-sm" style={{ color: 'var(--red)' }}>−₹{(54.2 * m).toFixed(1)}K</span>
            </div>
          </div>
          <Legend items={[
            { l: 'Product',   v: `₹${(38.4 * m).toFixed(1)}K`, c: 'var(--c-lost)'    },
            { l: 'Shipping',  v: `₹${(14.4 * m).toFixed(1)}K`, c: 'var(--c-transit)' },
            { l: 'Packaging', v: `₹${(1.4 * m).toFixed(1)}K`,  c: 'var(--c-insta)'   },
          ]} />
        </Card>

        <Card
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="w-title">Top RTO Pincodes</div>
                <div className="w-sub">Block COD here</div>
              </div>
              <Badge tone="red">Actionable</Badge>
            </div>
          }
        >
          {RTO_PINCODES.map((p) => (
            <RankedRow
              key={p.pin}
              name={`${p.pin} ${p.city}`}
              value={p.rto * m}
              max={RTO_PINCODES[0].rto * m}
              color="var(--c-lost)"
              meta={<span className="m-val" style={{ color: 'var(--red)' }}>{p.rto * m}</span>}
              topBadge={
                <Badge tone={p.reason === 'COD Refusal' ? 'amber' : 'orange'}>{p.reason}</Badge>
              }
            />
          ))}
          <Legend items={[
            { l: 'COD Refusal', v: '62%', c: 'var(--amber)' },
            { l: 'Address',     v: '24%', c: 'var(--orange)' },
          ]} />
        </Card>
      </div>

      {/* ── Fold 2 — RTO Trend | RTO by Reason (2-col) ───────────────── */}
      <div className="row-2">
        <Card title="RTO Trend" sub="5-month view">
          <GroupedBars slots={trendSlots} />
          <Insight>
            <b>RTOs doubled Jan→May.</b>{' '}
            <span className="bad">Steepest rise Mar→Apr (+18%)</span>. Correlates with COD growth in Tier-3.
          </Insight>
          <Legend items={[
            { l: 'Jan', v: `${32 * m}`, c: 'var(--gray-m)' },
            { l: 'May', v: `${64 * m}`, c: 'var(--c-lost)' },
          ]} />
        </Card>

        <Card title="RTO by Reason" sub="What's causing returns">
          {RTO_REASONS.map((r) => (
            <RankedRow
              key={r.l}
              name={r.l}
              value={r.v * m}
              max={RTO_REASONS[0].v * m}
              color={r.c}
              meta={
                <>
                  <span className="m-val">{r.v * m}</span>
                  <span className="m-dim">({Math.round(((r.v * m) / (RTO_TOTAL * m)) * 100)}%)</span>
                </>
              }
            />
          ))}
          <Legend items={RTO_REASONS.map((r) => ({ l: r.l, v: String(r.v * m), c: r.c }))} />
        </Card>
      </div>

      {/* ── Fold 3 — RTO Status | Recovery & Action Plan (2-col) ─────── */}
      <div className="row-2">
        <Card title="RTO Status" sub="Monthly outcomes">
          <GroupedBars slots={statusSlots} />
          <Insight>
            <b>May: {8 * m} still in transit.</b> Previous months had <span className="good">100% completion</span>.{' '}
            <span className="warn">{2 * m} undelivered</span> = stuck inventory.
          </Insight>
          <Legend items={[
            { l: 'Initiated',   v: `${8 * m}`,  c: 'var(--c-delivered)' },
            { l: 'Delivered',   v: `${44 * m}`, c: 'var(--c-ontime)'    },
            { l: 'Undelivered', v: `${2 * m}`,  c: 'var(--c-lost)'      },
          ]} />
        </Card>

        <Card title="Recovery & Action Plan" sub="Prioritized next steps to cut RTO loss">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RECOVERY_ACTIONS.map((a) => (
              <div
                key={a.step}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  background: 'var(--s2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background:
                      a.tone === 'red'    ? 'var(--rl)' :
                      a.tone === 'amber'  ? 'var(--al)' :
                      a.tone === 'orange' ? 'var(--ol)' :
                                            'var(--gray-l)',
                    color:
                      a.tone === 'red'    ? 'var(--red)' :
                      a.tone === 'amber'  ? 'var(--amber)' :
                      a.tone === 'orange' ? 'var(--orange)' :
                                            'var(--gray)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                  }}
                >
                  {a.step}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink2)', lineHeight: 1.5 }}>
                    {a.desc}
                  </div>
                </div>
                <Badge tone={a.tone}>
                  {a.tone === 'red' ? 'High' : a.tone === 'amber' ? 'Med' : a.tone === 'orange' ? 'Med' : 'Low'}
                </Badge>
              </div>
            ))}
          </div>
          <Legend items={[
            { l: 'Est. monthly savings', v: '₹42K+', c: 'var(--green)' },
          ]} />
        </Card>
      </div>
    </div>
  );
};

export default RtoTab;
