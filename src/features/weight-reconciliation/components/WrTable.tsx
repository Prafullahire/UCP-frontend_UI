import React from 'react';
import type { WrRecord } from '../types';

interface WrTableProps {
  records: WrRecord[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAwbClick: (record: WrRecord) => void;
  onOrderClick: (record: WrRecord) => void;
  onAccept: (record: WrRecord) => void;
  onReject: (record: WrRecord) => void;
}

const COLUMNS = [
  'Weight Applied Date',
  'AWB Number',
  'Order ID',
  'Entered Weight',
  'Applied Weight',
  'Weight Charges',
  'Product',
  'Status',
];

const ArrowUpIcon = (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M5 2v6M2 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const InfoCircleIcon = (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="6" cy="6" r="5" />
    <path d="M6 4v3M6 8.5h.01" strokeLinecap="round" />
  </svg>
);

const STATE_PILL: Record<NonNullable<WrRecord['state']>, { cls: string; text: string }> = {
  accepted: { cls: 'wr-state-accepted', text: 'Accepted' },
  open:     { cls: 'wr-state-open',     text: 'In Dispute' },
  closed:   { cls: 'wr-state-closed',   text: 'Closed' },
};

/* Convert a "1000g" string to its numeric grams value. */
const grams = (raw: string) => {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Weight reconciliation grid.
 *
 * Reuses the shared `.ord-tbl` recipe + adds row-level decorations
 * specific to this module (priority left-border driven by `daysLeft`,
 * discrepancy badge, charged / not-charged tag, and the per-row
 * Accept / Reject CTAs).
 */
export const WrTable: React.FC<WrTableProps> = ({
  records,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onAwbClick,
  onOrderClick,
  onAccept,
  onReject,
}) => {
  const allSelected = records.length > 0 && records.every((r) => selected.has(r.id));
  const partialSelected = !allSelected && records.some((r) => selected.has(r.id));
  const headerCheckboxClass = `ord-cb ${
    allSelected ? 'on' : partialSelected ? 'partial' : ''
  }`;

  if (records.length === 0) {
    return (
      <div className="ord-grid">
        <div className="ord-grid-scroll">
          <table className="ord-tbl wr-tbl">
            <thead>
              <tr>
                <th className="ord-col-cb" aria-hidden="true" />
                {COLUMNS.map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={COLUMNS.length + 1} className="wr-empty">
                  <div className="wr-empty-title">No records found</div>
                  <div className="wr-empty-sub">
                    Try a different bucket or clear your filters.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="ord-grid">
      <div className="ord-grid-scroll">
        <table className="ord-tbl wr-tbl">
          <thead>
            <tr>
              <th className="ord-col-cb">
                <button
                  type="button"
                  className={headerCheckboxClass}
                  onClick={onToggleSelectAll}
                  aria-label={
                    allSelected
                      ? 'Deselect all weight reconciliation rows'
                      : 'Select all weight reconciliation rows on this page'
                  }
                />
              </th>
              {COLUMNS.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const isSelected = selected.has(r.id);
              const enteredGrams = grams(r.entered.dead);
              const appliedGrams = grams(r.appliedWeight);
              const isDiscrepancy = appliedGrams > enteredGrams;
              const diff = Math.max(0, appliedGrams - enteredGrams);

              /* Priority border (mirrors NDR + the prototype):
                 0 days → red, 1 day → amber, accepted/closed → green. */
              let priorityCls = '';
              if (r.state === 'accepted' || r.state === 'closed') {
                priorityCls = 'wr-pri-ok';
              } else if (r.state === 'open') {
                priorityCls = 'wr-pri-warn';
              } else if (r.daysLeft === 0) {
                priorityCls = 'wr-pri-urgent';
              } else if (r.daysLeft === 1) {
                priorityCls = 'wr-pri-warn';
              }

              const deadlineCls =
                r.daysLeft === 0 ? 'wr-dl-urgent' :
                r.daysLeft === 1 ? 'wr-dl-warn' :
                'wr-dl-ok';

              return (
                <tr
                  key={r.id}
                  className={`wr-row ${priorityCls} ${isSelected ? 'selected' : ''}`}
                >
                  <td className="ord-col-cb">
                    <div className="tdi">
                      <button
                        type="button"
                        className={`ord-cb ${isSelected ? 'on' : ''}`}
                        onClick={() => onToggleSelect(r.id)}
                        aria-label={isSelected ? `Deselect ${r.orderId}` : `Select ${r.orderId}`}
                      />
                    </div>
                  </td>

                  {/* Weight Applied Date + AWB inline */}
                  <td>
                    <div className="tdi">
                      <div className="wr-cell-date">{r.appliedDate}</div>
                    </div>
                  </td>

                  {/* AWB Number */}
                  <td>
                    <div className="tdi">
                      <button
                        type="button"
                        className="wr-awb"
                        onClick={() => onAwbClick(r)}
                      >
                        {r.awb}
                      </button>
                    </div>
                  </td>

                  {/* Order ID */}
                  <td>
                    <div className="tdi">
                      <button
                        type="button"
                        className="wr-oid"
                        onClick={() => onOrderClick(r)}
                      >
                        {r.orderId}
                      </button>
                    </div>
                  </td>

                  {/* Entered Weight breakdown */}
                  <td>
                    <div className="tdi">
                      <div className="wr-wd">
                        <div><span className="wr-wd-l">Dead Weight</span> <span className="wr-wd-v">{r.entered.dead}</span></div>
                        <div><span className="wr-wd-l">L×B×H</span> <span className="wr-wd-v">{r.entered.dims}</span></div>
                        <div><span className="wr-wd-l">Charged Slab</span> <span className="wr-wd-v">{r.entered.slab}</span></div>
                        <div><span className="wr-wd-l">Volumetric</span> <span className="wr-wd-v">{r.entered.volumetric}</span></div>
                      </div>
                    </div>
                  </td>

                  {/* Applied Weight + discrepancy */}
                  <td>
                    <div className="tdi">
                      <div className="wr-aw">
                        Applied Slab :{' '}
                        <span
                          className="wr-aw-v"
                          style={{ color: isDiscrepancy ? 'var(--red)' : 'var(--ink)' }}
                        >
                          {r.appliedWeight}
                        </span>
                      </div>
                      <div
                        className={`wr-disc ${isDiscrepancy ? 'wr-disc-up' : 'wr-disc-match'}`}
                      >
                        {isDiscrepancy ? ArrowUpIcon : CheckIcon}
                        {isDiscrepancy ? `+${diff}g over` : 'Matches'}
                      </div>
                    </div>
                  </td>

                  {/* Charges */}
                  <td>
                    <div className="tdi">
                      <div className="wr-wc">
                        <div className="wr-wc-line">
                          <span className="wr-wc-l">Forward :</span>
                          <span className="wr-wc-v">{r.charges.forward}</span>
                        </div>
                        {r.charges.rto && (
                          <div className="wr-wc-line">
                            <span className="wr-wc-l">RTO :</span>
                            <span className="wr-wc-v">{r.charges.rto}</span>
                          </div>
                        )}
                        <span
                          className={
                            r.charges.chargedToWallet ? 'wr-charged-yes' : 'wr-charged-no'
                          }
                        >
                          {r.charges.chargedToWallet ? 'Charged ✓' : 'Not charged'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Product */}
                  <td>
                    <div className="tdi">
                      <div className="wr-prod">{r.product}</div>
                    </div>
                  </td>

                  {/* Status — Accept / Reject when seller hasn't acted, otherwise a state pill */}
                  <td>
                    <div className="tdi">
                      <div className="wr-status-col">
                        {r.state === null ? (
                          <>
                            <div className="wr-act-cell">
                              <button
                                type="button"
                                className="ndr-ab primary"
                                onClick={() => onAccept(r)}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                className="ndr-ab ghost wr-ab-reject"
                                onClick={() => onReject(r)}
                              >
                                Reject
                              </button>
                            </div>
                            <div className={`wr-deadline ${deadlineCls}`}>
                              {r.daysLeft === 0
                                ? '0 day(s) left'
                                : `${r.daysLeft} day(s) left`}
                            </div>
                          </>
                        ) : (
                          <div className={`wr-state-pill ${STATE_PILL[r.state].cls}`}>
                            {r.state === 'accepted' ? CheckIcon : InfoCircleIcon}
                            {STATE_PILL[r.state].text}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ord-foot">
        <span>
          Showing <b>1 – {records.length}</b> of <b>184</b>
        </span>
        <div className="ord-foot-pgw">
          <button type="button" className="ord-foot-pgb icon" disabled>
            ← Previous
          </button>
          <button type="button" className="ord-foot-pgb on">
            1
          </button>
          <button type="button" className="ord-foot-pgb">
            2
          </button>
          <button type="button" className="ord-foot-pgb">
            3
          </button>
          <button type="button" className="ord-foot-pgb icon">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WrTable;
