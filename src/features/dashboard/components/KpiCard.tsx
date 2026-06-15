import React from 'react';
import type { KpiSpec, Severity } from '../data/dashboardData';

interface KpiCardProps extends KpiSpec {
  /** Variant: 'detail' shows sub/CTA; 'compact' hugs content (used by NDR mini-KPIs) */
  variant?: 'detail' | 'compact';
  onClickCTA?: () => void;
}

const SEV_LABEL: Record<Severity, string> = {
  high:    'Needs attention',
  med:     'Action pending',
  low:     'Low priority',
  neutral: 'Tracked',
};

/**
 * Severity-colored KPI tile. The left bar, severity pill and dot all
 * derive from `sev` via CSS class composition (`.kpi-high` / `.kpi-med` …).
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  lbl,
  n,
  sub,
  sev,
  cta,
  tip,
  variant = 'detail',
  onClickCTA,
}) => {
  const compact = variant === 'compact';
  return (
    <div className={`kpi kpi-${sev}${compact ? ' kpi-hug' : ''}`}>
      <span className="kpi-bar" />
      <div className="kpi-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="kpi-lbl" style={compact ? { fontSize: 12 } : undefined}>{lbl}</div>
          {tip && (
            <span className="tip">
              <span style={{ cursor: 'help', color: 'var(--ink3)', fontSize: 12 }}>i</span>
              <span className="tip-t">{tip}</span>
            </span>
          )}
        </div>
        <div className="kpi-n">{n}</div>
        {sub && !compact && <div className="kpi-sub">{sub}</div>}
      </div>

      {!compact && (
        <div className="kpi-bottom">
          <span className="kpi-sev">
            <span className={`kpi-dot ${sev === 'high' ? 'blink' : ''}`} />
            {SEV_LABEL[sev]}
          </span>
          {cta && (
            <button type="button" className={`cta ${sev === 'high' ? 'cta-p' : 'cta-s'}`} onClick={onClickCTA}>
              {cta}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
