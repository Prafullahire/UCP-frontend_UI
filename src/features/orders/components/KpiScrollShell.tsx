import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface KpiScrollShellProps {
  /** Total number of cards rendered as children — drives the layout
   *  variant (≤4 cards = distribute, ≥5 cards = fixed-width + scroll). */
  cardCount: number;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Horizontal-scroll wrapper for the Orders KPI strip.
 *
 * Rules baked in:
 *   • Cards keep a consistent width — max 4 visible at once.
 *   • When the underlying strip carries 5+ cards the row becomes
 *     horizontally scrollable.
 *   • Left / right arrows appear only when there is scrollable content
 *     in that direction.
 *
 * Both `PendingKpiStrip` and `ShipmentKpiStrip` render their cards
 * inside this shell so behaviour stays identical across tabs.
 */
export const KpiScrollShell: React.FC<KpiScrollShellProps> = ({
  cardCount,
  ariaLabel,
  children,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);

  /* `scrollWidth - clientWidth - scrollLeft` > 0 indicates content to the
     right. We add a 1px tolerance to avoid sub-pixel jitter on Safari. */
  const sync = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useLayoutEffect(sync, [sync, cardCount]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  /** Scrolls by roughly one card width. */
  const scrollByCards = (dir: -1 | 1) => {
    const el = rowRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('.ord-kc');
    const step = firstCard ? firstCard.offsetWidth + 12 : 260;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  /* >4 cards triggers the fixed-width / scrollable variant. With ≤4
     cards the row keeps its existing grid distribution and the arrows
     never appear (canLeft/canRight stay false). */
  const overflow = cardCount > 4;

  return (
    <div className="ord-kc-shell">
      {canLeft && (
        <button
          type="button"
          className="ord-kc-arr left"
          onClick={() => scrollByCards(-1)}
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}
      <div
        ref={rowRef}
        className={`ord-kc-row${overflow ? ' kc-scroll' : ''}`}
        role="group"
        aria-label={ariaLabel ?? 'Summary'}
      >
        {children}
      </div>
      {canRight && (
        <button
          type="button"
          className="ord-kc-arr right"
          onClick={() => scrollByCards(1)}
          aria-label="Scroll right"
        >
          ›
        </button>
      )}
    </div>
  );
};

export default KpiScrollShell;
