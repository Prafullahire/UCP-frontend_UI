import React from 'react';
import KpiScrollShell from './KpiScrollShell';

/**
 * Generic, tab-agnostic version of `PendingKpiStrip`. Renders 3–5 KPI tiles
 * using the same `.ord-kc*` CSS recipe so every Shipment tab visually
 * matches the Pending tab pixel-for-pixel.
 *
 * Each card is a button so it reads as actionable, but selection state is
 * optional — callers that don't need clickable filters can omit `active`
 * and `onSelect` and the cards will still render as static tiles.
 */

/** Tile-level icon set — re-uses the existing svg recipe from PendingKpiStrip. */
export type KpiIconKind =
  | 'total'
  | 'clock'
  | 'warn'
  | 'truck'
  | 'check'
  | 'package'
  | 'route'
  | 'fail'
  | 'return';

const ICONS: Record<KpiIconKind, React.ReactNode> = {
  total: (
    <>
      <path d="M3 6h10M3 9.5h10M3 13h6" strokeLinecap="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5v4l2.5 1.5" strokeLinecap="round" />
    </>
  ),
  warn: (
    <>
      <path d="M8 2l6.5 11.5h-13L8 2z" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11.5v.4" strokeLinecap="round" />
    </>
  ),
  truck: (
    <>
      <rect x="1.5" y="5" width="8" height="6" rx="1" />
      <path d="M9.5 7h3l2 2v2h-5" />
      <circle cx="4.5" cy="12.5" r="1.2" />
      <circle cx="11.5" cy="12.5" r="1.2" />
    </>
  ),
  check: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M5 8.2l2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  package: (
    <>
      <path d="M8 2l5.5 2.8v6.4L8 14 2.5 11.2V4.8L8 2z" strokeLinejoin="round" />
      <path d="M2.5 4.8L8 7.6l5.5-2.8M8 7.6V14" />
    </>
  ),
  route: (
    <>
      <path d="M3 4h6a2 2 0 010 4H7a2 2 0 000 4h6" strokeLinecap="round" />
      <circle cx="3" cy="4" r="1.2" />
      <circle cx="13" cy="12" r="1.2" />
    </>
  ),
  fail: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" strokeLinecap="round" />
    </>
  ),
  return: (
    <>
      <path d="M3 9h8a3 3 0 003-3 3 3 0 00-3-3H5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 6L3 9l2.5 3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

/** Token preset that maps to the existing CSS variables. */
export type AccentKey = 'ink' | 'orange' | 'blue' | 'amber' | 'red' | 'green';

const ACCENT: Record<AccentKey, { accent: string; iconBg: string; iconStroke: string }> = {
  ink:    { accent: 'var(--ink)',    iconBg: 'var(--s3)', iconStroke: 'var(--ink2)' },
  orange: { accent: 'var(--orange)', iconBg: 'var(--ol)', iconStroke: 'var(--orange)' },
  blue:   { accent: 'var(--blue)',   iconBg: 'var(--bl)', iconStroke: 'var(--blue)' },
  amber:  { accent: 'var(--amber)',  iconBg: 'var(--al)', iconStroke: 'var(--amber)' },
  red:    { accent: 'var(--red)',    iconBg: 'var(--rl)', iconStroke: 'var(--red)' },
  green:  { accent: 'var(--green)',  iconBg: 'var(--gl)', iconStroke: 'var(--green)' },
};

/** Inline pill rendered at the bottom of a card (e.g. "Sitting >24 hrs"). */
export interface KpiPill {
  label: string;
  variant: 'warn' | 'danger' | 'info' | 'success';
}

export interface KpiCardSpec {
  /** Stable id — used as the bucket key for filter selection. */
  id: string;
  label: string;
  value: string | number;
  /** Plain sub text rendered under the value */
  sub?: string;
  /** Optional pill (e.g. "Sitting >24 hrs") rendered below the value */
  pill?: KpiPill;
  accent: AccentKey;
  icon: KpiIconKind;
  /** When true the card shows as inert (no hover ring on selection). */
  staticTile?: boolean;
}

interface ShipmentKpiStripProps {
  cards: KpiCardSpec[];
  /** Currently active bucket id — drives the `.on` ring on each tile. */
  active?: string;
  /** Click handler. When omitted the cards still render but stay static. */
  onSelect?: (id: string) => void;
  /** Aria label for the strip group element */
  ariaLabel?: string;
}

/**
 * Tab-agnostic KPI strip. Pixel-identical to `PendingKpiStrip` — the
 * difference is that this one accepts an arbitrary card list so every
 * Shipments tab can compose its own bucket configuration without
 * forking the markup or CSS.
 */
export const ShipmentKpiStrip: React.FC<ShipmentKpiStripProps> = ({
  cards,
  active,
  onSelect,
  ariaLabel,
}) => {
  return (
    <KpiScrollShell cardCount={cards.length} ariaLabel={ariaLabel ?? 'Summary'}>
      {cards.map((c) => {
        const tokens = ACCENT[c.accent];
        const isOn = !!active && !c.staticTile && active === c.id;
        const clickable = !!onSelect && !c.staticTile;
        return (
          <button
            key={c.id}
            type="button"
            className={`ord-kc ${isOn ? 'on' : ''}`}
            onClick={clickable ? () => onSelect!(c.id) : undefined}
            aria-pressed={isOn}
            style={!clickable ? { cursor: 'default' } : undefined}
          >
            <div className="ord-kc-bar" style={{ background: tokens.accent }} />
            <div className="ord-kc-top">
              <div className="ord-kc-lbl">{c.label}</div>
              <div className="ord-kc-ico" style={{ background: tokens.iconBg }}>
                <svg viewBox="0 0 16 16" fill="none" stroke={tokens.iconStroke} strokeWidth="1.5">
                  {ICONS[c.icon]}
                </svg>
              </div>
            </div>
            <div className="ord-kc-n" style={c.accent === 'red' ? { color: 'var(--red)' } : undefined}>
              {c.value}
            </div>
            {c.sub && <div className="ord-kc-sub">{c.sub}</div>}
            {c.pill && (
              <div className="ord-kc-sub">
                <span className={`ord-kpi-pill ${c.pill.variant}`}>{c.pill.label}</span>
              </div>
            )}
          </button>
        );
      })}
    </KpiScrollShell>
  );
};

export default ShipmentKpiStrip;
