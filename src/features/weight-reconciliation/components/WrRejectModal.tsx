import React, { useEffect, useState } from 'react';
import type { WrRecord } from '../types';
import { WR_DISPUTE_REASONS } from '../data/weightReconciliationData';

export interface WrRejectPayload {
  recordId: string;
  claimedWeight: string;
  reasonId: string;
  notes: string;
  evidenceFileName: string | null;
}

interface WrRejectModalProps {
  record: WrRecord;
  onClose: () => void;
  onConfirm: (payload: WrRejectPayload) => void;
}

const UploadIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M12 16V8M9 11l3-3 3 3" strokeLinecap="round" />
    <path d="M20 16.5A3.5 3.5 0 0 0 16.5 13H15A5 5 0 1 0 6 15h-.5A3.5 3.5 0 1 0 5.5 22H18a3 3 0 0 0 2-5.5z" />
  </svg>
);

/**
 * Reject (Raise Dispute) modal — captures the seller's claimed weight,
 * dispute reason, optional supporting evidence and free-form notes.
 *
 * Reuses the shared `.wr-mod*` recipe (also used by `WrAcceptModal`)
 * so the two modals read as visual siblings.
 */
export const WrRejectModal: React.FC<WrRejectModalProps> = ({
  record,
  onClose,
  onConfirm,
}) => {
  const [claimedWeight, setClaimedWeight] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isValid = claimedWeight.trim().length > 0 && reasonId.trim().length > 0;

  const submit = () => {
    if (!isValid) return;
    onConfirm({
      recordId: record.id,
      claimedWeight: claimedWeight.trim(),
      reasonId,
      notes: notes.trim(),
      evidenceFileName: evidence?.name ?? null,
    });
  };

  return (
    <div
      className="wr-mod-ov"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wr-reject-title"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="wr-mod">
        <div className="wr-mod-hdr">
          <div>
            <div id="wr-reject-title" className="wr-mod-title">Reject Applied Weight</div>
            <div className="wr-mod-sub">
              Provide supporting details for your dispute claim
            </div>
          </div>
          <button
            type="button"
            className="wr-mod-close"
            onClick={onClose}
            aria-label="Close reject modal"
          >
            ×
          </button>
        </div>

        <div className="wr-mod-body">
          {/* Read-only context */}
          <div className="wr-mod-row">
            <div className="wr-mod-field">
              <div className="wr-mod-label">Order ID</div>
              <div className="wr-mod-val">{record.orderId}</div>
            </div>
            <div className="wr-mod-field">
              <div className="wr-mod-label">AWB Number</div>
              <div className="wr-mod-val">{record.awb}</div>
            </div>
          </div>
          <div className="wr-mod-row">
            <div className="wr-mod-field">
              <div className="wr-mod-label">Applied Weight (Courier)</div>
              <div className="wr-mod-val" style={{ color: 'var(--red)' }}>
                {record.appliedWeight}
              </div>
            </div>
            <div className="wr-mod-field">
              <div className="wr-mod-label">Your Entered Weight</div>
              <div className="wr-mod-val">{record.entered.dead}</div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="wr-mod-row">
            <div className="wr-mod-field">
              <label className="wr-mod-label" htmlFor="wr-claimed">
                Your Claimed Weight (g) <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                id="wr-claimed"
                className="wr-mod-input"
                type="number"
                placeholder="e.g. 500"
                min={0}
                value={claimedWeight}
                onChange={(e) => setClaimedWeight(e.target.value)}
              />
              <div className="wr-mod-hint">
                Enter the actual weight of the shipment as measured by you
              </div>
            </div>
            <div className="wr-mod-field">
              <label className="wr-mod-label" htmlFor="wr-reason">
                Dispute Reason <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <select
                id="wr-reason"
                className="wr-mod-select"
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value)}
              >
                <option value="">Select reason</option>
                {WR_DISPUTE_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="wr-mod-row one">
            <div className="wr-mod-field">
              <div className="wr-mod-label">Supporting Evidence (optional)</div>
              <label className="wr-upload-zone">
                {UploadIcon}
                <div className="wr-upload-t">
                  {evidence ? evidence.name : 'Upload weight screenshot or image'}
                </div>
                <div className="wr-upload-s">JPG, PNG, PDF up to 5MB</div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setEvidence(e.target.files?.[0] ?? null)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="wr-mod-row one">
            <div className="wr-mod-field">
              <label className="wr-mod-label" htmlFor="wr-notes">
                Additional Notes (optional)
              </label>
              <textarea
                id="wr-notes"
                className="wr-mod-textarea"
                placeholder="Add any additional context for the dispute..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="wr-mod-ft">
          <button type="button" className="ndr-ab ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ndr-ab primary"
            onClick={submit}
            disabled={!isValid}
            aria-disabled={!isValid}
          >
            Submit Dispute
          </button>
        </div>
      </div>
    </div>
  );
};

export default WrRejectModal;
