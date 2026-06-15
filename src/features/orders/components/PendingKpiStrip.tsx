import React from 'react';
import KpiScrollShell from './KpiScrollShell';
import type { PendingKpis } from '../data/ordersData';

/**
 * KPI bucket id surfaced by each card. Selecting a card filters the
 * grid; selecting it again (or `all`) clears the KPI filter.
 */
export type KpiBucket = 'all' | 'waiting' | 'attention' | 'incomplete';

interface PendingKpiStripProps {
  kpis: PendingKpis;
  /** Currently-active KPI filter — drives the card's `on` state. */
  active: KpiBucket;
  /** Fires on tile click — caller toggles its `active` state. */
  onSelect: (bucket: KpiBucket) => void;
}

const formatRupees = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

/* ── Icon glyphs (sized to fit the .skc-ico chip) ────────────── */
const TotalIcon = (
  <>
    <path d="M3 6h10M3 9.5h10M3 13h6" strokeLinecap="round" />
  </>
);
const WaitingIcon = (
  <>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5v4l2.5 1.5" strokeLinecap="round" />
  </>
);
const AttentionIcon = (
  <>
    <path d="M8 2l6.5 11.5h-13L8 2z" strokeLinejoin="round" />
    <path d="M8 6.5v3M8 11.5v.4" strokeLinecap="round" />
  </>
);
const IncompleteIcon = (
  <>
    <rect x="3" y="2.5" width="9" height="11" rx="1.5" />
    <path d="M5.5 6.5h4M5.5 9h4M5.5 11.5h2.5" strokeLinecap="round" />
  </>
);

interface CardSpec {
  id: KpiBucket;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  accent: string;
  iconBg: string;
  iconStroke: string;
  icon: React.ReactNode;
}

/**
 * Pending-orders summary as four clickable KPI cards (matches the
 * Support module's `.skc` card recipe). Each card represents a
 * filter bucket — clicking one applies it to the grid; clicking
 * the active card again clears it.
 */
export const PendingKpiStrip: React.FC<PendingKpiStripProps> = ({
  kpis,
  active,
  onSelect,
}) => {
  const cards: CardSpec[] = [
    {
      id: 'all',
      label: 'Total Order Value',
      value: formatRupees(kpis.totalValue),
      sub: `${kpis.orderCount} Orders`,
      accent: 'var(--ink)',
      iconBg: 'var(--s3)',
      iconStroke: 'var(--ink2)',
      icon: TotalIcon,
    },
    {
      id: 'waiting',
      label: 'Waiting To Ship',
      value: kpis.waitingToShip,
      accent: 'var(--blue)',
      iconBg: 'var(--bl)',
      iconStroke: 'var(--blue)',
      icon: WaitingIcon,
    },
    {
      id: 'attention',
      label: 'Orders Need Attention',
      value: kpis.needAttention,
      sub: (
        <span className="ord-kpi-pill warn">
          Sitting &gt;{kpis.attentionSittingHours} hrs
        </span>
      ),
      accent: 'var(--amber)',
      iconBg: 'var(--al)',
      iconStroke: 'var(--amber)',
      icon: AttentionIcon,
    },
    {
      id: 'incomplete',
      label: 'Incomplete Orders Details',
      value: kpis.incomplete,
      accent: 'var(--red)',
      iconBg: 'var(--rl)',
      iconStroke: 'var(--red)',
      icon: IncompleteIcon,
    },
  ];

  return (
    <KpiScrollShell cardCount={cards.length} ariaLabel="Pending orders summary">
      {cards.map((c) => {
        /* The "all" card represents the default unfiltered state, so we
           never paint it with the active ring — its `on` indicator
           would just be visual noise. Only the three filter buckets
           highlight when active. */
        const isOn = c.id !== 'all' && active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            className={`ord-kc ${isOn ? 'on' : ''}`}
            onClick={() => onSelect(c.id)}
            aria-pressed={isOn}
          >
            <div className="ord-kc-bar" style={{ background: c.accent }} />
            <div className="ord-kc-top">
              <div className="ord-kc-lbl">{c.label}</div>
              <div className="ord-kc-ico" style={{ background: c.iconBg }}>
                <svg viewBox="0 0 16 16" fill="none" stroke={c.iconStroke} strokeWidth="1.5">
                  {c.icon}
                </svg>
              </div>
            </div>
            <div className="ord-kc-n">{c.value}</div>
            {c.sub && <div className="ord-kc-sub">{c.sub}</div>}
          </button>
        );
      })}
    </KpiScrollShell>
  );
};

export default PendingKpiStrip;
