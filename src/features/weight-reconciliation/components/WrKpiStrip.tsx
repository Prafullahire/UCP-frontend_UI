import React from 'react';
import ShipmentKpiStrip, {
  type KpiCardSpec,
} from '../../orders/components/ShipmentKpiStrip';
import type { WrBucket, WrKpiCounts } from '../types';

interface WrKpiStripProps {
  counts: WrKpiCounts;
  active: WrBucket;
  onSelect: (bucket: WrBucket) => void;
}

/**
 * Weight Reconciliation KPI summary — 5 clickable buckets.
 *
 * Visual recipe is now shared with the Orders module (RTO / Shipments
 * tabs) by delegating to `ShipmentKpiStrip`. That keeps the card
 * markup, accent palette, hover/active ring, and horizontal-scroll
 * behaviour identical across the two screens, per the
 * `ui-layout-standards.mdc` rule.
 *
 * Card mapping (per the brief):
 *  • All weight disputes     — every record under reconciliation
 *  • Action Required         — your acceptance is required
 *  • Open Disputes           — under review by XpressBees
 *  • Accepted                — accepted by XpressBees
 *  • Closed                  — disputes closed (settled / rejected)
 */
export const WrKpiStrip: React.FC<WrKpiStripProps> = ({ counts, active, onSelect }) => {
  const cards: KpiCardSpec[] = [
    {
      id: 'all',
      label: 'All Weight Disputes',
      value: counts.all,
      sub: 'Every shipment under reconciliation',
      accent: 'ink',
      icon: 'total',
    },
    {
      id: 'action',
      label: 'Action Required',
      value: counts.action,
      pill: { label: 'Act before midnight', variant: 'danger' },
      accent: 'red',
      icon: 'warn',
    },
    {
      id: 'open',
      label: 'Open Disputes',
      value: counts.open,
      sub: 'Under review by XpressBees',
      accent: 'blue',
      icon: 'clock',
    },
    {
      id: 'accepted',
      label: 'Accepted',
      value: counts.accepted,
      sub: 'Settled by XpressBees',
      accent: 'green',
      icon: 'check',
    },
    {
      id: 'closed',
      label: 'Closed',
      value: counts.closed,
      sub: 'Disputes closed in this period',
      accent: 'amber',
      icon: 'fail',
    },
  ];

  return (
    <ShipmentKpiStrip
      cards={cards}
      active={active}
      onSelect={(id) => onSelect(id as WrBucket)}
      ariaLabel="Weight Reconciliation summary"
    />
  );
};

export default WrKpiStrip;
