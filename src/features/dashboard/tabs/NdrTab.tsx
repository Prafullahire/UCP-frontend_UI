import React, { useState } from 'react';
import Card from '../components/Card';
import KpiCard from '../components/KpiCard';
import RankedRow from '../components/RankedRow';
import Legend from '../components/Legend';
import Insight from '../components/Insight';
import FilterBar from '../components/FilterBar';
import Funnel3 from '../components/Funnel3';
import FunnelDual from '../components/FunnelDual';
import Heatmap from '../components/Heatmap';
import GroupedBars from '../components/GroupedBars';
import {
  NDR_KPIS,
  NDR_REASONS,
  NDR_TOTAL,
  NDR_FUNNEL,
  NDR_RESPONSE,
  NDR_ATTEMPT_DAYS,
  NDR_ATTEMPT_TABLE,
  NDR_STATUS,
  NDR_STATUS_MAX,
  SELLER_RESPONSE,
  BUYER_RESPONSE,
} from '../data/dashboardData';

const NDR_FILTERS = [
  { id: 'all',     label: 'All Time' },
  { id: 'reason',  label: 'NDR Reason' },
  { id: 'attempt', label: 'Attempt Count' },
  { id: 'paymode', label: 'COD / Prepaid' },
  { id: 'days',    label: 'Days Since',     dividerBefore: true },
  { id: 'courier', label: 'Courier' },
];

export const NdrTab: React.FC<{ datePreset?: string }> = ({ datePreset = 'Last Week' }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const getFilterMultiplier = (filterId: string) => {
    if (filterId === 'all') return 1;
    const hash = filterId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 0.4 + (hash % 50) / 100;
  };

  const dateM = datePreset === 'Last 2 Weeks' ? 2 : datePreset === 'Last Month' ? 4 : datePreset === 'Last Quarter' ? 12 : 1;
  const filterM = getFilterMultiplier(activeFilter);
  const m = dateM * filterM;

  /* Pre-compute grouped-bar slot heights for the NDR Status weekly chart */
  const ndrStatusSlots = NDR_STATUS.map((w) => ({
    label: w.l,
    bars: [
      { color: 'var(--c-ontime)',    heightPx: ((w.del * m)  / (NDR_STATUS_MAX * m)) * 100, width: 12 },
      { color: 'var(--c-delivered)', heightPx: ((w.rto * m)  / (NDR_STATUS_MAX * m)) * 100, width: 12 },
      { color: 'var(--c-cod)',       heightPx: ((w.pend * m) / (NDR_STATUS_MAX * m)) * 100, width: 12 },
      { color: 'var(--c-lost)',      heightPx: ((w.lost * m) / (NDR_STATUS_MAX * m)) * 100, width: 12 },
    ],
  }));

  return (
    <div className="d-fade">
      <FilterBar chips={NDR_FILTERS} onFilterChange={setActiveFilter} />

      {/* ── KPI strip (5-col) — Action Required first, hugged height ── */}
      <div className="kpi-grid kpi-grid-5" style={{ marginBottom: 16 }}>
        {NDR_KPIS.map((k) => (
          <KpiCard key={k.lbl} {...k} variant="compact" />
        ))}
      </div>

      {/* ── Fold 1 — NDR Reason Split | NDR Funnel ───────────────────── */}
      <div className="row-2">
        <Card title="NDR Reason Split" sub={`${NDR_TOTAL * m} total NDRs by cause`}>
          {NDR_REASONS.map((r) => (
            <RankedRow
              key={r.l}
              name={r.l}
              value={r.v * m}
              max={NDR_REASONS[0].v * m}
              color={r.c}
              meta={
                <>
                  <span className="m-val">{r.v * m}</span>
                  <span className="m-dim">({Math.round(((r.v * m) / (NDR_TOTAL * m)) * 100)}%)</span>
                </>
              }
            />
          ))}
          <Legend items={NDR_REASONS.map((r) => ({ l: r.l, v: String(r.v * m), c: r.c }))} />
        </Card>

        <Card title="NDR Funnel" sub="Attempt-wise progression">
          <Funnel3 columns={NDR_FUNNEL.map(col => ({...col, val: col.val * m}))} />
          <Insight>
            3rd NDR delivers <span className="bad">0%</span>. Flag orders reaching 3rd attempt for RTO instead.
          </Insight>
          <Legend items={[
            { l: '1st', v: '25%', c: 'var(--green)' },
            { l: '2nd', v: '25%', c: 'var(--amber)' },
            { l: '3rd', v: '0%',  c: 'var(--red)'   },
          ]} />
        </Card>
      </div>

      {/* ── Fold 2 — NDR Response | NDR Attempt Heatmap ──────────────── */}
      <div className="row-2">
        <Card title="NDR Response" sub="Seller vs Buyer conversion">
          <FunnelDual
            scale={Math.max(NDR_RESPONSE.seller.responded * m, NDR_RESPONSE.buyer.responded * m)}
            columns={[
              {
                hdr: 'Seller Channel',
                responded: NDR_RESPONSE.seller.responded * m,
                positive:  NDR_RESPONSE.seller.positive * m,
                delivered: NDR_RESPONSE.seller.delivered * m,
              },
              {
                hdr: 'Buyer Channel',
                responded: NDR_RESPONSE.buyer.responded * m,
                positive:  NDR_RESPONSE.buyer.positive * m,
                delivered: NDR_RESPONSE.buyer.delivered * m,
                colors: { responded: 'var(--c-buyer-resp)', positive: 'var(--am)', delivered: 'var(--c-ontime)' },
              },
            ]}
          />
          <Insight>
            <b>Seller converts 50%</b> vs buyer at <span className="warn">25%</span>. Seller channel is 2x more effective.
          </Insight>
          <Legend items={[
            { l: 'Seller', v: '50%', c: 'var(--green)' },
            { l: 'Buyer',  v: '25%', c: 'var(--amber)' },
          ]} />
        </Card>

        <Card title="NDR to Delivery Attempt" sub="Daily reattempt coverage">
          <Heatmap columns={[...NDR_ATTEMPT_DAYS, 'Total']} rows={NDR_ATTEMPT_TABLE.map(row => ({...row, cells: row.cells.map(v => typeof v === 'number' ? v * m : v)}))} />
          <Insight>
            <b>82% reattempt rate.</b>{' '}
            <span className="bad">Sun had only 2/4 reattempted</span> — courier weekend staffing bottleneck.
          </Insight>
          <Legend items={[
            { l: 'Reattempted', v: `${23 * m}/${28 * m}`, c: 'var(--c-ontime)' },
            { l: 'Missed',      v: `${5 * m}`,     c: 'var(--red)'      },
          ]} />
        </Card>
      </div>

      {/* ── Fold 3 — NDR Status | Seller Response | Buyer Response ──── */}
      <div className="row-3">
        <Card title="NDR Status" sub="Weekly outcomes">
          <GroupedBars slots={ndrStatusSlots} />
          <Legend items={[
            { l: 'Delivered', c: 'var(--c-ontime)'    },
            { l: 'RTO',       c: 'var(--c-delivered)' },
            { l: 'Pending',   c: 'var(--c-cod)'       },
            { l: 'Lost',      c: 'var(--c-lost)'      },
          ]} />
        </Card>

        <Card title="Seller Response" sub="Daily engagement">
          <Heatmap columns={NDR_ATTEMPT_DAYS} rows={SELLER_RESPONSE.map(row => ({...row, cells: row.cells.map(v => typeof v === 'number' ? v * m : v)}))} />
          <Insight>
            <b>79% responded</b> but only <span className="warn">54% positive</span>. Wed best, Thu worst.
          </Insight>
          <Legend items={[
            { l: 'Response', v: '79%', c: 'var(--c-resp)'   },
            { l: '+ve',      v: '54%', c: 'var(--c-ontime)' },
          ]} />
        </Card>

        <Card title="Buyer Response" sub="Daily engagement">
          <Heatmap columns={NDR_ATTEMPT_DAYS} rows={BUYER_RESPONSE.map(row => ({...row, cells: row.cells.map(v => typeof v === 'number' ? v * m : v)}))} />
          <Insight>
            <b>Only 43% buyer response.</b>{' '}
            <span className="bad">Mon &amp; Thu = zero positive</span>. Auto-flag for prepaid-only.
          </Insight>
          <Legend items={[
            { l: 'Response', v: '43%', c: 'var(--c-buyer-resp)' },
            { l: '+ve',      v: '25%', c: 'var(--c-ontime)'     },
          ]} />
        </Card>
      </div>
    </div>
  );
};

export default NdrTab;
