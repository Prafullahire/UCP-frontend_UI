import React, { useEffect } from 'react';
import type { WrRecord } from '../types';

interface WrAcceptModalProps {
  record: WrRecord;
  onClose: () => void;
  onConfirm: (record: WrRecord) => void;
}

/**
 * Confirm Acceptance modal — surfaces a green "this is final" callout
 * with the order id, applied weight and forward charge so the seller
 * has a last chance to review before the wallet is debited.
 *
 * Reuses the shared `.ord-mod*` modal recipe (already used by every
 * other modal in the app) to keep the visual rhythm consistent.
 */
export const WrAcceptModal: React.FC<WrAcceptModalProps> = ({
  record,
  onClose,
  onConfirm,
}) => {
  /* Esc closes the modal — matches every other modal in the app */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="wr-mod-ov"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wr-accept-title"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="wr-mod" style={{ maxWidth: 480 }}>
        <div className="wr-mod-hdr">
          <div>
            <div id="wr-accept-title" className="wr-mod-title">Confirm Acceptance</div>
            <div className="wr-mod-sub">
              You are accepting the courier-applied weight and charges
            </div>
          </div>
          <button
            type="button"
            className="wr-mod-close"
            onClick={onClose}
            aria-label="Close confirm acceptance modal"
          >
            ×
          </button>
        </div>

        <div className="wr-mod-body">
          <div className="wr-accept-callout">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--green)"
              strokeWidth="1.5"
              style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }}
              aria-hidden="true"
            >
              <path d="M2 8l4 4 8-8" strokeLinecap="round" />
            </svg>
            <div>
              <div className="wr-accept-h">
                Accepting: Order <span>{record.orderId}</span>
              </div>
              <div className="wr-accept-p">
                Applied weight: <b>{record.appliedWeight}</b> · Charges:{' '}
                <b>{record.charges.forward}</b>
                <br />
                This action cannot be undone after confirmation.
              </div>
            </div>
          </div>
          <div className="wr-accept-note">
            By accepting, you confirm the courier&rsquo;s weight measurement is
            accurate and agree to the applied charges. The amount will be
            deducted from your wallet if not already charged.
          </div>
        </div>

        <div className="wr-mod-ft">
          <button type="button" className="ndr-ab ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ndr-ab primary"
            onClick={() => onConfirm(record)}
          >
            Confirm Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default WrAcceptModal;
