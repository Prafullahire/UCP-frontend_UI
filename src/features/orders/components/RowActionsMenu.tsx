import React, { useEffect, useRef } from 'react';

/**
 * A single entry in the row-level action menu. Callers compose a list of
 * these and the popover handles rendering + outside-click + keyboard.
 *
 * Variants:
 *   • `default` — plain menu item
 *   • `danger`  — red text (e.g. Cancel)
 *   • `future`  — muted + optional "Soon" pill (un-shipped feature)
 */
export interface RowMenuItem {
  /** Stable React key */
  key: string;
  /** Leading icon — SVG ReactNode */
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'future';
  /** Label used on the trailing pill when variant === 'future' */
  futureTag?: string;
  /** When true, draws a divider line above this item */
  separatorAbove?: boolean;
}

export interface RowActionsMenuProps {
  /** Anchor element's bounding rect (used to position the popover) */
  anchor: DOMRect;
  onClose: () => void;
  /** Menu rows in render order. Empty list collapses the menu to nothing. */
  items: RowMenuItem[];
}

/* ── Shared icon glyphs — exported so callers can compose their own item
 * lists without duplicating SVG paths. ────────────────────────────────── */
export const PrintIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M4 2h8v4H4zM3 6h10v6h-2v2H5v-2H3zM5 10h6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const EditIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M11 2l3 3-8 8H3v-3l8-8z" strokeLinejoin="round" />
  </svg>
);
export const TagIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M2 2h6l6 6-6 6-6-6V2z" strokeLinejoin="round" />
    <circle cx="5" cy="5" r="1" />
  </svg>
);
export const CloneIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2" y="4" width="9" height="10" rx="1.5" />
    <path d="M5 4V2.5A.5.5 0 015.5 2H13a1 1 0 011 1v8.5a.5.5 0 01-.5.5H12" />
  </svg>
);
export const CancelIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="8" r="6" />
    <path d="M5 5l6 6M11 5l-6 6" strokeLinecap="round" />
  </svg>
);
/* Same icon recipe as the page-level Download button — re-used by the
 * Print Label menu item so the visual rhyme between Invoice / Label
 * holds even though the underlying assets differ. */
export const LabelIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2.5" y="3" width="11" height="9" rx="1" />
    <path d="M2.5 6.5h11M5 9.5h6M5 11h3.5" strokeLinecap="round" />
  </svg>
);

/**
 * Portal-less popover anchored to the 3-dot button. Closes on outside click
 * and on Escape. Caller owns each action handler — this component only
 * positions + renders the list it's given.
 */
export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
  anchor,
  onClose,
  items,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  /** Position the popover under-right of the trigger. Caps to viewport edges. */
  const MENU_WIDTH = 220;
  const top = anchor.bottom + 4;
  const left = Math.min(
    anchor.right - MENU_WIDTH,
    window.innerWidth - MENU_WIDTH - 16,
  );

  if (items.length === 0) return null;

  return (
    <div
      ref={ref}
      className="ord-row-menu"
      role="menu"
      style={{ top, left: Math.max(8, left), width: MENU_WIDTH }}
    >
      {items.map((item) => {
        const variantClass =
          item.variant === 'danger' ? ' danger'
          : item.variant === 'future' ? ' fut'
          : '';
        return (
          <React.Fragment key={item.key}>
            {item.separatorAbove && <div className="ord-row-menu-sep" />}
            <button
              type="button"
              role="menuitem"
              className={`ord-row-menu-i${variantClass}`}
              onClick={item.onClick}
            >
              {item.icon} {item.label}
              {item.variant === 'future' && (
                <span className="fut-tag">{item.futureTag ?? 'Soon'}</span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default RowActionsMenu;
